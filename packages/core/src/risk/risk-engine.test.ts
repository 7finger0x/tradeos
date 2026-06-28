import { describe, expect, it } from "vitest";
import {
  computeConsecutiveLosses,
  computeRiskMetrics,
  evaluateRisk,
  checkProposedTradeRisk,
} from "../risk/risk-engine";

const baseRules = {
  max_daily_loss: 500,
  max_weekly_loss: 1500,
  max_position_risk: 100,
  max_trades_per_day: 5,
  max_consecutive_losses: 3,
  cooldown_after_loss_minutes: 30,
  is_active: true,
};

describe("risk engine", () => {
  it("returns normal when within limits", () => {
    const metrics = {
      daily_pnl: -100,
      weekly_pnl: -200,
      trades_today: 2,
      consecutive_losses: 0,
      open_positions: 1,
    };
    const result = evaluateRisk({
      rules: baseRules,
      metrics,
      in_cooldown: false,
      cooldown_ends_at: null,
    });
    expect(result.risk_state).toBe("normal");
    expect(result.ui_label).toBe("Green");
    expect(result.size_multiplier).toBe(1);
  });

  it("lockout on max daily loss", () => {
    const result = evaluateRisk({
      rules: baseRules,
      metrics: {
        daily_pnl: -500,
        weekly_pnl: -500,
        trades_today: 3,
        consecutive_losses: 1,
        open_positions: 0,
      },
      in_cooldown: false,
      cooldown_ends_at: null,
    });
    expect(result.risk_state).toBe("lockout");
    expect(result.ui_label).toBe("Red");
    expect(result.size_multiplier).toBe(0);
  });

  it("caution at 50% daily loss", () => {
    const result = evaluateRisk({
      rules: baseRules,
      metrics: {
        daily_pnl: -250,
        weekly_pnl: -250,
        trades_today: 1,
        consecutive_losses: 0,
        open_positions: 0,
      },
      in_cooldown: false,
      cooldown_ends_at: null,
    });
    expect(result.risk_state).toBe("caution");
    expect(result.size_multiplier).toBe(0.5);
  });

  it("blocks trade on lockout", () => {
    const evaluation = evaluateRisk({
      rules: baseRules,
      metrics: {
        daily_pnl: -600,
        weekly_pnl: -600,
        trades_today: 2,
        consecutive_losses: 2,
        open_positions: 0,
      },
      in_cooldown: false,
      cooldown_ends_at: null,
    });
    const check = checkProposedTradeRisk(evaluation, 50, 100);
    expect(check.allowed).toBe(false);
  });

  it("computes consecutive losses", () => {
    const streak = computeConsecutiveLosses([
      { net_pnl: 50, entry_time: "2026-06-01T08:00:00Z", exit_time: "2026-06-01T09:00:00Z", risk_amount: 25 },
      { net_pnl: -10, entry_time: "2026-06-01T10:00:00Z", exit_time: "2026-06-01T11:00:00Z", risk_amount: 10 },
      { net_pnl: -20, entry_time: "2026-06-01T12:00:00Z", exit_time: "2026-06-01T13:00:00Z", risk_amount: 20 },
    ]);
    expect(streak).toBe(2);
  });

  it("computes metrics from trades", () => {
    const now = new Date("2026-06-03T16:00:00Z");
    const metrics = computeRiskMetrics(
      [
        { net_pnl: 100, entry_time: "2026-06-03T14:00:00Z", exit_time: "2026-06-03T15:00:00Z", risk_amount: 50 },
        { net_pnl: -50, entry_time: "2026-06-02T14:00:00Z", exit_time: "2026-06-02T15:00:00Z", risk_amount: 50 },
      ],
      now,
    );
    expect(metrics.daily_pnl).toBe(100);
    expect(metrics.trades_today).toBe(1);
  });
});
