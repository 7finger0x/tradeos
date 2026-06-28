import { z } from "zod";

export const TradeGradeInputSchema = z.object({
  setup_id: z.string().uuid().optional().nullable(),
  exit_time: z.string().optional().nullable(),
  exit_price: z.number().optional().nullable(),
  net_pnl: z.number().optional().nullable(),
  r_multiple: z.number().optional().nullable(),
  stop_loss: z.number().optional().nullable(),
  risk_amount: z.number().optional().nullable(),
  target_price: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  emotion: z.string().optional().nullable(),
  conviction: z.number().int().min(1).max(10).optional().nullable(),
  discipline_score: z.number().int().min(1).max(10).optional().nullable(),
  mistake_tags: z.array(z.string()).default([]),
});

export type TradeGradeInput = z.infer<typeof TradeGradeInputSchema>;

export const TradeGradeOutputSchema = z.object({
  overall_grade: z.string(),
  setup_quality: z.number().int().min(1).max(10),
  execution_quality: z.number().int().min(1).max(10),
  risk_management: z.number().int().min(1).max(10),
  discipline: z.number().int().min(1).max(10),
  emotional_control: z.number().int().min(1).max(10),
  data_completeness: z.number().int().min(1).max(10),
  feedback_text: z.string(),
  evidence: z.record(z.unknown()),
});

export type TradeGradeOutput = z.infer<typeof TradeGradeOutputSchema>;

export const MistakeCostSchema = z.object({
  code: z.string(),
  title: z.string(),
  occurrence_count: z.number(),
  total_cost: z.number(),
  average_cost: z.number(),
});

export type MistakeCost = z.infer<typeof MistakeCostSchema>;

export const BehavioralScoreInputSchema = z.object({
  trades: z.array(
    z.object({
      emotion: z.string().optional().nullable(),
      discipline_score: z.number().optional().nullable(),
      mistake_tags: z.array(z.string()).default([]),
      notes: z.string().optional().nullable(),
      setup_id: z.string().optional().nullable(),
      net_pnl: z.number().optional().nullable(),
      entry_time: z.string(),
    }),
  ),
});

export type BehavioralScoreInput = z.infer<typeof BehavioralScoreInputSchema>;

export const BehavioralScoreOutputSchema = z.object({
  discipline_avg: z.number(),
  emotion_stability: z.number(),
  revenge_trade_risk: z.number(),
  journaling_completeness: z.number(),
  overall_behavioral_score: z.number(),
  evidence: z.record(z.unknown()),
});

export type BehavioralScoreOutput = z.infer<typeof BehavioralScoreOutputSchema>;

export const CoachingReportInputSchema = z.object({
  period_start: z.string(),
  period_end: z.string(),
  analytics: z.object({
    trade_count: z.number(),
    win_rate: z.number(),
    total_net_pnl: z.number(),
    expectancy: z.number(),
    profit_factor: z.number(),
    average_r: z.number(),
  }),
  mistake_costs: z.array(MistakeCostSchema),
  behavioral: BehavioralScoreOutputSchema,
  grade_summary: z.object({
    average_overall: z.number(),
    low_grade_count: z.number(),
    high_grade_count: z.number(),
  }),
  emotional_triggers: z.array(z.string()),
});

export type CoachingReportInput = z.infer<typeof CoachingReportInputSchema>;

export const CoachingReportOutputSchema = z.object({
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  highest_cost_mistake: z.string().nullable(),
  repeated_patterns: z.array(z.object({ pattern: z.string(), count: z.number() })),
  emotional_triggers: z.array(z.string()),
  stop_actions: z.array(z.string()),
  improve_actions: z.array(z.string()),
  repeat_actions: z.array(z.string()),
  next_week_focus: z.string(),
  confidence_score: z.number(),
  evidence: z.record(z.unknown()),
  summary_text: z.string(),
});

export type CoachingReportOutput = z.infer<typeof CoachingReportOutputSchema>;
