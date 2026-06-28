export type ProviderHealthInput = {
  provider_key: string;
  latency_ms: number;
  success_rate: number;
  error_rate: number;
  staleness_seconds: number;
  quorum_eligible: boolean;
  metrics?: Record<string, unknown>;
};

export type LiquidityObservationInput = {
  chain_id: string;
  pool_address: string;
  token_pair: string;
  liquidity_usd: number;
  volume_24h_usd?: number;
  spread_bps?: number;
  depth_score?: number;
  provider_key: string;
  observed_at: string;
  raw_payload?: Record<string, unknown>;
};
