import { describe, expect, it } from "vitest";
import { evaluateQuorum, computeQuorumPassRate } from "../hermes/quorum";
import { evaluateThresholdAlerts, DEFAULT_HERMES_THRESHOLDS } from "../hermes/threshold-evaluator";

describe("quorum evaluator", () => {
  it("passes when providers agree within tolerance", () => {
    const result = evaluateQuorum("0xabc", "USDC/WETH", [
      {
        provider_key: "a",
        liquidity_usd: 1_000_000,
        health: {
          provider_key: "a",
          latency_ms: 100,
          success_rate: 0.99,
          error_rate: 0.01,
          staleness_seconds: 10,
          quorum_eligible: true,
        },
      },
      {
        provider_key: "b",
        liquidity_usd: 1_020_000,
        health: {
          provider_key: "b",
          latency_ms: 120,
          success_rate: 0.98,
          error_rate: 0.02,
          staleness_seconds: 15,
          quorum_eligible: true,
        },
      },
    ]);
    expect(result.passed).toBe(true);
    expect(result.eligible_providers).toBe(2);
    expect(result.quality_score).toBeGreaterThan(0.5);
  });

  it("fails when deviation exceeds tolerance", () => {
    const result = evaluateQuorum("0xabc", "USDC/WETH", [
      {
        provider_key: "a",
        liquidity_usd: 1_000_000,
        health: {
          provider_key: "a",
          latency_ms: 100,
          success_rate: 0.99,
          error_rate: 0.01,
          staleness_seconds: 10,
          quorum_eligible: true,
        },
      },
      {
        provider_key: "b",
        liquidity_usd: 500_000,
        health: {
          provider_key: "b",
          latency_ms: 120,
          success_rate: 0.98,
          error_rate: 0.02,
          staleness_seconds: 15,
          quorum_eligible: true,
        },
      },
    ]);
    expect(result.passed).toBe(false);
    expect(result.reasons[0]).toMatch(/deviation/i);
  });

  it("computes pass rate", () => {
    const rate = computeQuorumPassRate([
      { passed: true } as never,
      { passed: false } as never,
      { passed: true } as never,
    ]);
    expect(rate).toBe(66.67);
  });
});

describe("threshold evaluator", () => {
  it("flags low liquidity pools", () => {
    const alerts = evaluateThresholdAlerts(
      [{ liquidity_usd: 50_000, quality_score: 0.8, quorum_passed: true }],
      DEFAULT_HERMES_THRESHOLDS,
    );
    expect(alerts.some((a) => a.threshold_key === "min_liquidity_usd")).toBe(true);
  });
});
