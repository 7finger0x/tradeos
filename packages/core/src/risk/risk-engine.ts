import type {
  RiskEvaluation,
  RiskMetrics,
  RiskRules,
  RiskState,
  TradeForRisk,
} from "../schemas/risk";

const STATE_UI: Record<RiskState, RiskEvaluation["ui_label"]> = {
  normal: "Green",
  caution: "Yellow",
  reduce_size: "Orange",
  lockout: "Red",
};

const SIZE_MULTIPLIER: Record<RiskState, number> = {
  normal: 1,
  caution: 0.5,
  reduce_size: 0.25,
  lockout: 0,
};

export type RiskEngineInput = {
  rules: RiskRules | null;
  metrics: RiskMetrics;
  in_cooldown: boolean;
  cooldown_ends_at: string | null;
  now?: Date;
};

export function computeConsecutiveLosses(trades: TradeForRisk[]): number {
  const closed = [...trades]
    .filter((t) => t.net_pnl !== null && t.exit_time !== null)
    .sort(
      (a, b) =>
        new Date(b.exit_time ?? b.entry_time).getTime() -
        new Date(a.exit_time ?? a.entry_time).getTime(),
    );

  let streak = 0;
  for (const trade of closed) {
    if ((trade.net_pnl ?? 0) < 0) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function computeRiskMetrics(
  trades: TradeForRisk[],
  now: Date = new Date(),
): RiskMetrics {
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date(dayStart);
  const day = weekStart.getDay();
  const diff = day === 0 ? 6 : day - 1;
  weekStart.setDate(weekStart.getDate() - diff);

  const inDay = (t: TradeForRisk) => new Date(t.entry_time) >= dayStart;
  const inWeek = (t: TradeForRisk) => new Date(t.entry_time) >= weekStart;

  const dailyTrades = trades.filter(inDay);
  const weeklyTrades = trades.filter(inWeek);

  const sumPnl = (list: TradeForRisk[]) =>
    list.reduce((s, t) => s + (t.net_pnl ?? 0), 0);

  const open_positions = trades.filter((t) => !t.exit_time).length;

  return {
    daily_pnl: Number(sumPnl(dailyTrades).toFixed(2)),
    weekly_pnl: Number(sumPnl(weeklyTrades).toFixed(2)),
    trades_today: dailyTrades.length,
    consecutive_losses: computeConsecutiveLosses(trades),
    open_positions,
  };
}

export function evaluateRisk(input: RiskEngineInput): RiskEvaluation {
  const now = input.now ?? new Date();
  const { rules, metrics } = input;
  const triggered: string[] = [];
  const reasons: string[] = [];

  if (input.in_cooldown) {
    return buildEvaluation(
      "lockout",
      triggered,
      [
        ...reasons,
        `Cooldown active until ${input.cooldown_ends_at ?? "unknown"}`,
      ],
      rules,
      metrics,
      input.in_cooldown,
      input.cooldown_ends_at,
      now,
    );
  }

  if (!rules) {
    return buildEvaluation(
      "normal",
      triggered,
      ["No risk rules configured — using normal state. Configure rules in Risk Manager."],
      rules,
      metrics,
      false,
      null,
      now,
    );
  }

  let state: RiskState = "normal";

  if (
    rules.max_daily_loss &&
    metrics.daily_pnl <= -Math.abs(rules.max_daily_loss)
  ) {
    triggered.push("max_daily_loss");
    reasons.push(
      `Daily loss $${Math.abs(metrics.daily_pnl).toFixed(2)} reached max daily loss $${rules.max_daily_loss}`,
    );
    state = "lockout";
  }

  if (
    state !== "lockout" &&
    rules.max_weekly_loss &&
    metrics.weekly_pnl <= -Math.abs(rules.max_weekly_loss)
  ) {
    triggered.push("max_weekly_loss");
    reasons.push(
      `Weekly loss $${Math.abs(metrics.weekly_pnl).toFixed(2)} reached max weekly loss $${rules.max_weekly_loss}`,
    );
    state = "lockout";
  }

  if (
    state !== "lockout" &&
    rules.max_consecutive_losses &&
    metrics.consecutive_losses >= rules.max_consecutive_losses
  ) {
    triggered.push("max_consecutive_losses");
    reasons.push(
      `${metrics.consecutive_losses} consecutive losses (max ${rules.max_consecutive_losses})`,
    );
    state = "lockout";
  }

  if (state !== "lockout" && rules.max_trades_per_day) {
    if (metrics.trades_today >= rules.max_trades_per_day) {
      triggered.push("max_trades_per_day");
      reasons.push(
        `${metrics.trades_today} trades today (max ${rules.max_trades_per_day})`,
      );
      state = "reduce_size";
    } else if (metrics.trades_today >= rules.max_trades_per_day - 1) {
      triggered.push("approaching_max_trades");
      reasons.push("Approaching max trades per day");
      if (state === "normal") state = "caution";
    }
  }

  if (
    state === "normal" &&
    rules.max_daily_loss &&
    metrics.daily_pnl <= -Math.abs(rules.max_daily_loss) * 0.75
  ) {
    triggered.push("daily_loss_warning_75");
    reasons.push("Daily loss at 75% of max — reduce size");
    state = "reduce_size";
  } else if (
    state === "normal" &&
    rules.max_daily_loss &&
    metrics.daily_pnl <= -Math.abs(rules.max_daily_loss) * 0.5
  ) {
    triggered.push("daily_loss_warning_50");
    reasons.push("Daily loss at 50% of max — caution");
    state = "caution";
  }

  if (
    state === "normal" &&
    rules.max_consecutive_losses &&
    metrics.consecutive_losses >= Math.max(1, rules.max_consecutive_losses - 1)
  ) {
    triggered.push("consecutive_loss_warning");
    reasons.push("Loss streak building — tighten selectivity");
    state = "caution";
  }

  if (
    rules.max_open_positions &&
    metrics.open_positions >= rules.max_open_positions
  ) {
    triggered.push("max_open_positions");
    reasons.push(
      `${metrics.open_positions} open positions (max ${rules.max_open_positions})`,
    );
    if (state === "normal") state = "caution";
  }

  return buildEvaluation(
    state,
    triggered,
    reasons.length ? reasons : ["All risk checks within limits"],
    rules,
    metrics,
    false,
    null,
    now,
  );
}

export function checkProposedTradeRisk(
  evaluation: RiskEvaluation,
  proposedRiskAmount: number | null | undefined,
  maxPositionRisk: number | null | undefined,
): { allowed: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (evaluation.risk_state === "lockout") {
    return {
      allowed: false,
      warnings: ["Trading lockout active — no new trades allowed"],
    };
  }

  if (
    maxPositionRisk &&
    proposedRiskAmount &&
    proposedRiskAmount > maxPositionRisk
  ) {
    warnings.push(
      `Proposed risk $${proposedRiskAmount} exceeds max position risk $${maxPositionRisk}`,
    );
    if (evaluation.risk_state === "reduce_size") {
      return { allowed: false, warnings };
    }
  }

  const maxAllowed =
    maxPositionRisk && evaluation.size_multiplier
      ? maxPositionRisk * evaluation.size_multiplier
      : null;

  if (
    maxAllowed !== null &&
    proposedRiskAmount &&
    proposedRiskAmount > maxAllowed
  ) {
    warnings.push(
      `Proposed risk exceeds adjusted limit $${maxAllowed.toFixed(2)} (${evaluation.ui_label} state)`,
    );
  }

  return { allowed: true, warnings };
}

function buildEvaluation(
  state: RiskState,
  triggered: string[],
  reasons: string[],
  rules: RiskRules | null,
  metrics: RiskMetrics,
  inCooldown: boolean,
  cooldownEndsAt: string | null,
  now: Date,
): RiskEvaluation {
  const multiplier = SIZE_MULTIPLIER[state];
  const allowedRisk =
    rules?.max_position_risk && multiplier > 0
      ? Number((rules.max_position_risk * multiplier).toFixed(2))
      : state === "lockout"
        ? 0
        : rules?.max_position_risk ?? null;

  const blocked =
    state === "lockout"
      ? ["new_trade", "increase_size", "revenge_trade"]
      : state === "reduce_size"
        ? ["increase_size", "marginal_setup"]
        : [];

  const allowed =
    state === "lockout"
      ? ["review_journal", "wait_cooldown"]
      : state === "reduce_size"
        ? ["a_plus_setup_only", "reduced_size"]
        : state === "caution"
          ? ["reduced_size", "planned_setups"]
          : ["full_planned_risk"];

  return {
    risk_state: state,
    ui_label: STATE_UI[state],
    size_multiplier: multiplier,
    allowed_risk_per_trade: allowedRisk,
    triggered_rules: triggered,
    reasons,
    blocked_actions: blocked,
    allowed_actions: allowed,
    in_cooldown: inCooldown,
    cooldown_ends_at: cooldownEndsAt,
    evaluated_at: now.toISOString(),
  };
}
