import { z } from "zod";

export const HermesAgentStatusSchema = z.enum(["idle", "running", "error", "paused"]);
export type HermesAgentStatus = z.infer<typeof HermesAgentStatusSchema>;

export const LiquidityObservationInputSchema = z.object({
  chain_id: z.string(),
  pool_address: z.string(),
  token_pair: z.string(),
  liquidity_usd: z.number(),
  volume_24h_usd: z.number().optional(),
  spread_bps: z.number().optional(),
  depth_score: z.number().optional(),
  provider_key: z.string(),
  observed_at: z.string(),
  raw_payload: z.record(z.unknown()).optional(),
});

export type LiquidityObservationInput = z.infer<typeof LiquidityObservationInputSchema>;

export const ProviderHealthInputSchema = z.object({
  provider_key: z.string(),
  latency_ms: z.number(),
  success_rate: z.number().min(0).max(1),
  error_rate: z.number().min(0).max(1),
  staleness_seconds: z.number().min(0),
  quorum_eligible: z.boolean(),
  metrics: z.record(z.unknown()).optional(),
});

export type ProviderHealthInput = z.infer<typeof ProviderHealthInputSchema>;

export const QuorumReadingSchema = z.object({
  provider_key: z.string(),
  liquidity_usd: z.number(),
  health: ProviderHealthInputSchema,
});

export type QuorumReading = z.infer<typeof QuorumReadingSchema>;

export const QuorumResultSchema = z.object({
  pool_address: z.string(),
  token_pair: z.string(),
  passed: z.boolean(),
  median_liquidity_usd: z.number(),
  deviation_pct: z.number(),
  eligible_providers: z.number(),
  quality_score: z.number(),
  reasons: z.array(z.string()),
});

export type QuorumResult = z.infer<typeof QuorumResultSchema>;

export const HermesRiskThresholdSchema = z.object({
  threshold_key: z.string(),
  label: z.string(),
  value: z.number(),
  unit: z.string().default("usd"),
  severity: z.string().default("medium"),
  enabled: z.boolean().default(true),
});

export type HermesRiskThreshold = z.infer<typeof HermesRiskThresholdSchema>;

export const HermesStatusSummarySchema = z.object({
  agent_status: HermesAgentStatusSchema,
  last_run_at: z.string().nullable(),
  provider_count: z.number(),
  healthy_providers: z.number(),
  observation_count_24h: z.number(),
  quorum_pass_rate: z.number(),
  threshold_alerts: z.number(),
});

export type HermesStatusSummary = z.infer<typeof HermesStatusSummarySchema>;
