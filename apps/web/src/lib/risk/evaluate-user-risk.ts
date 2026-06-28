import type { SupabaseClient } from "@supabase/supabase-js";
import {
  computeRiskMetrics,
  evaluateRisk,
  type RiskEvaluation,
  type RiskRules,
  type TradeForRisk,
} from "@tradeos/core";

export async function loadActiveRiskRules(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
): Promise<RiskRules | null> {
  const { data } = await supabase
    .from("risk_rules")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) return null;

  return {
    max_daily_loss: data.max_daily_loss ? Number(data.max_daily_loss) : null,
    max_weekly_loss: data.max_weekly_loss ? Number(data.max_weekly_loss) : null,
    max_position_risk: data.max_position_risk ? Number(data.max_position_risk) : null,
    max_open_positions: data.max_open_positions,
    max_trades_per_day: data.max_trades_per_day,
    max_consecutive_losses: data.max_consecutive_losses,
    cooldown_after_loss_minutes: data.cooldown_after_loss_minutes,
    is_active: data.is_active,
  };
}

export async function loadTradesForRisk(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
): Promise<TradeForRisk[]> {
  const { data } = await supabase
    .from("trades")
    .select("net_pnl, entry_time, exit_time, risk_amount")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .order("entry_time", { ascending: false })
    .limit(500);

  return (data ?? []).map((t) => ({
    net_pnl: t.net_pnl !== null ? Number(t.net_pnl) : null,
    entry_time: t.entry_time,
    exit_time: t.exit_time,
    risk_amount: t.risk_amount !== null ? Number(t.risk_amount) : null,
  }));
}

export async function loadActiveCooldown(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
): Promise<{ active: boolean; ends_at: string | null }> {
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("risk_cooldowns")
    .select("ends_at")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("active", true)
    .gt("ends_at", now)
    .order("ends_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    active: Boolean(data),
    ends_at: data?.ends_at ?? null,
  };
}

export async function evaluateUserRisk(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
): Promise<{ evaluation: RiskEvaluation; metrics: ReturnType<typeof computeRiskMetrics> }> {
  const [rules, trades, cooldown] = await Promise.all([
    loadActiveRiskRules(supabase, tenantId, userId),
    loadTradesForRisk(supabase, tenantId, userId),
    loadActiveCooldown(supabase, tenantId, userId),
  ]);

  const metrics = computeRiskMetrics(trades);
  const evaluation = evaluateRisk({
    rules,
    metrics,
    in_cooldown: cooldown.active,
    cooldown_ends_at: cooldown.ends_at,
  });

  return { evaluation, metrics };
}

export async function recordRiskStateChange(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  evaluation: RiskEvaluation,
  metrics: ReturnType<typeof computeRiskMetrics>,
  previousState?: string | null,
): Promise<void> {
  if (previousState === evaluation.risk_state) return;

  await supabase.from("risk_events").insert({
    tenant_id: tenantId,
    user_id: userId,
    risk_state: evaluation.risk_state,
    previous_state: previousState ?? null,
    triggered_rules: evaluation.triggered_rules,
    message: evaluation.reasons.join("; "),
    daily_pnl: metrics.daily_pnl,
    weekly_pnl: metrics.weekly_pnl,
    trades_today: metrics.trades_today,
    consecutive_losses: metrics.consecutive_losses,
    size_multiplier: evaluation.size_multiplier,
    metadata: {
      allowed_actions: evaluation.allowed_actions,
      blocked_actions: evaluation.blocked_actions,
    },
  });
}

export async function startCooldownIfNeeded(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  evaluation: RiskEvaluation,
  cooldownMinutes: number | null | undefined,
): Promise<void> {
  if (evaluation.risk_state !== "lockout" || !cooldownMinutes || cooldownMinutes <= 0) {
    return;
  }

  const endsAt = new Date(Date.now() + cooldownMinutes * 60 * 1000).toISOString();

  await supabase.from("risk_cooldowns").insert({
    tenant_id: tenantId,
    user_id: userId,
    reason: evaluation.triggered_rules.join(", ") || "lockout",
    ends_at: endsAt,
    active: true,
  });
}
