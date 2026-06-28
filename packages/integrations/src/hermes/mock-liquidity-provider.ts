import type { LiquidityObservationInput, ProviderHealthInput } from "./types";

export type LiquidityPoolSnapshot = {
  chain_id: string;
  pool_address: string;
  token_pair: string;
  liquidity_usd: number;
  volume_24h_usd: number;
  spread_bps: number;
  depth_score: number;
};

export type ProviderSnapshot = {
  provider_key: string;
  chain_id: string;
  health: ProviderHealthInput;
  pools: LiquidityPoolSnapshot[];
};

export interface LiquidityDataProvider {
  readonly name: string;
  readonly providerKey: string;
  fetchSnapshots(chainId: string): Promise<ProviderSnapshot>;
}

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

const MOCK_POOLS = [
  { pool_address: "0x88e6a0c2ddd630feeff9b94285ca6e9984c4caff", token_pair: "USDC/WETH" },
  { pool_address: "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8", token_pair: "USDC/WETH" },
  { pool_address: "0x4e68ccd3e89f51c3074ca5072bbac773960dfa36", token_pair: "WETH/USDT" },
];

export class MockLiquidityProvider implements LiquidityDataProvider {
  readonly name = "mock";
  readonly providerKey: string;
  private readonly driftFactor: number;

  constructor(providerKey: string, driftFactor = 0) {
    this.providerKey = providerKey;
    this.driftFactor = driftFactor;
  }

  async fetchSnapshots(chainId: string): Promise<ProviderSnapshot> {
    const day = new Date().toISOString().slice(0, 10);
    const seed = hashSeed(`${this.providerKey}:${chainId}:${day}`);
    const baseLatency = 80 + (seed % 400);
    const errorRate = this.driftFactor > 0.05 ? 0.15 : 0.02;

    const pools = MOCK_POOLS.map((pool) => {
      const poolSeed = hashSeed(`${this.providerKey}:${pool.pool_address}:${day}`);
      const baseLiquidity = 500_000 + (poolSeed % 2_000_000);
      const drift = 1 + this.driftFactor * ((poolSeed % 21) - 10) / 100;
      return {
        chain_id: chainId,
        pool_address: pool.pool_address,
        token_pair: pool.token_pair,
        liquidity_usd: Number((baseLiquidity * drift).toFixed(2)),
        volume_24h_usd: Number((baseLiquidity * 0.3).toFixed(2)),
        spread_bps: Number((5 + (poolSeed % 30) / 10).toFixed(2)),
        depth_score: Number((0.6 + (poolSeed % 40) / 100).toFixed(2)),
      };
    });

    return {
      provider_key: this.providerKey,
      chain_id: chainId,
      health: {
        provider_key: this.providerKey,
        latency_ms: baseLatency,
        success_rate: Number((1 - errorRate).toFixed(4)),
        error_rate: errorRate,
        staleness_seconds: seed % 45,
        quorum_eligible: errorRate < 0.1,
        metrics: { source: "mock", chain_id: chainId },
      },
      pools,
    };
  }
}

export function createHermesProviderCluster(chainId = "ethereum-mainnet"): MockLiquidityProvider[] {
  return [
    new MockLiquidityProvider(`${chainId}-rpc-alpha`, 0),
    new MockLiquidityProvider(`${chainId}-rpc-beta`, 0.01),
    new MockLiquidityProvider(`${chainId}-rpc-gamma`, 0.08),
  ];
}

export async function fetchMultiProviderSnapshots(
  chainId = "ethereum-mainnet",
): Promise<ProviderSnapshot[]> {
  const cluster = createHermesProviderCluster(chainId);
  return Promise.all(cluster.map((p) => p.fetchSnapshots(chainId)));
}
