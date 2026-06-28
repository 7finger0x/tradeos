import type { QuorumReading, QuorumResult } from "../schemas/hermes";

const DEFAULT_TOLERANCE_PCT = 5;

export function evaluateQuorum(
  poolAddress: string,
  tokenPair: string,
  readings: QuorumReading[],
  tolerancePct: number = DEFAULT_TOLERANCE_PCT,
): QuorumResult {
  const eligible = readings.filter(
    (r) => r.health.quorum_eligible && r.health.success_rate >= 0.9 && r.liquidity_usd > 0,
  );

  if (eligible.length < 2) {
    return {
      pool_address: poolAddress,
      token_pair: tokenPair,
      passed: false,
      median_liquidity_usd: eligible[0]?.liquidity_usd ?? 0,
      deviation_pct: 100,
      eligible_providers: eligible.length,
      quality_score: 0.2,
      reasons: ["Insufficient eligible providers for quorum (need 2+)"],
    };
  }

  const values = eligible.map((r) => r.liquidity_usd).sort((a, b) => a - b);
  const mid = Math.floor(values.length / 2);
  const median =
    values.length % 2 === 0
      ? (values[mid - 1]! + values[mid]!) / 2
      : values[mid]!;

  const deviations = eligible.map((r) =>
    median > 0 ? Math.abs((r.liquidity_usd - median) / median) * 100 : 0,
  );
  const maxDeviation = Math.max(...deviations);
  const passed = maxDeviation <= tolerancePct;

  const avgHealth =
    eligible.reduce((s, r) => s + r.health.success_rate, 0) / eligible.length;
  const avgLatency =
    eligible.reduce((s, r) => s + r.health.latency_ms, 0) / eligible.length;
  const latencyFactor = Math.max(0, 1 - avgLatency / 2000);
  const quorumFactor = passed ? 1 : 0.5;
  const quality_score = Number(
    (avgHealth * 0.4 + latencyFactor * 0.2 + quorumFactor * 0.4).toFixed(4),
  );

  const reasons: string[] = [];
  if (!passed) {
    reasons.push(`Provider deviation ${maxDeviation.toFixed(2)}% exceeds ${tolerancePct}% tolerance`);
  } else {
    reasons.push(`Quorum passed with ${eligible.length} providers within ${tolerancePct}%`);
  }

  return {
    pool_address: poolAddress,
    token_pair: tokenPair,
    passed,
    median_liquidity_usd: Number(median.toFixed(2)),
    deviation_pct: Number(maxDeviation.toFixed(2)),
    eligible_providers: eligible.length,
    quality_score,
    reasons,
  };
}

export function computeQuorumPassRate(results: QuorumResult[]): number {
  if (results.length === 0) return 0;
  const passed = results.filter((r) => r.passed).length;
  return Number(((passed / results.length) * 100).toFixed(2));
}
