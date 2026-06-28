import { z } from "zod";

export const RiskStateSchema = z.enum([
  "normal",
  "caution",
  "reduce_size",
  "lockout",
]);

export type RiskState = z.infer<typeof RiskStateSchema>;

export const RiskRulesSchema = z.object({
  id: z.string().uuid().optional(),
  max_daily_loss: z.number().positive().optional().nullable(),
  max_weekly_loss: z.number().positive().optional().nullable(),
  max_position_risk: z.number().positive().optional().nullable(),
  max_open_positions: z.number().int().positive().optional().nullable(),
  max_trades_per_day: z.number().int().positive().optional().nullable(),
  max_consecutive_losses: z.number().int().positive().optional().nullable(),
  cooldown_after_loss_minutes: z.number().int().min(0).optional().nullable(),
  is_active: z.boolean().default(true),
});

export type RiskRules = z.infer<typeof RiskRulesSchema>;

export const RiskRulesInputSchema = RiskRulesSchema.omit({ id: true });

export type RiskRulesInput = z.infer<typeof RiskRulesInputSchema>;

export const RiskMetricsSchema = z.object({
  daily_pnl: z.number(),
  weekly_pnl: z.number(),
  trades_today: z.number().int(),
  consecutive_losses: z.number().int(),
  open_positions: z.number().int(),
});

export type RiskMetrics = z.infer<typeof RiskMetricsSchema>;

export const RiskEvaluationSchema = z.object({
  risk_state: RiskStateSchema,
  ui_label: z.enum(["Green", "Yellow", "Orange", "Red"]),
  size_multiplier: z.number(),
  allowed_risk_per_trade: z.number().nullable(),
  triggered_rules: z.array(z.string()),
  reasons: z.array(z.string()),
  blocked_actions: z.array(z.string()),
  allowed_actions: z.array(z.string()),
  in_cooldown: z.boolean(),
  cooldown_ends_at: z.string().nullable(),
  evaluated_at: z.string(),
});

export type RiskEvaluation = z.infer<typeof RiskEvaluationSchema>;

export type TradeForRisk = {
  net_pnl: number | null;
  entry_time: string;
  exit_time: string | null;
  risk_amount: number | null;
};
