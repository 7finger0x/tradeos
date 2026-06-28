import type { HermesRiskThreshold } from "../schemas/hermes";

export type ObservationForThreshold = {
  liquidity_usd: number;
  spread_bps?: number | null;
  quality_score: number;
  quorum_passed: boolean;
};

export type ThresholdAlert = {
  threshold_key: string;
  label: string;
  severity: string;
  message: string;
  observed_value: number;
  threshold_value: number;
};

export function evaluateThresholdAlerts(
  observations: ObservationForThreshold[],
  thresholds: HermesRiskThreshold[],
): ThresholdAlert[] {
  const alerts: ThresholdAlert[] = [];
  const enabled = thresholds.filter((t) => t.enabled);

  for (const threshold of enabled) {
    if (threshold.threshold_key === "min_liquidity_usd") {
      const low = observations.filter((o) => o.liquidity_usd < threshold.value);
      if (low.length > 0) {
        alerts.push({
          threshold_key: threshold.threshold_key,
          label: threshold.label,
          severity: threshold.severity,
          message: `${low.length} pool(s) below minimum liquidity`,
          observed_value: Math.min(...low.map((o) => o.liquidity_usd)),
          threshold_value: threshold.value,
        });
      }
    }

    if (threshold.threshold_key === "max_spread_bps") {
      const wide = observations.filter(
        (o) => o.spread_bps !== null && o.spread_bps !== undefined && o.spread_bps > threshold.value,
      );
      if (wide.length > 0) {
        alerts.push({
          threshold_key: threshold.threshold_key,
          label: threshold.label,
          severity: threshold.severity,
          message: `${wide.length} pool(s) exceed spread limit`,
          observed_value: Math.max(...wide.map((o) => o.spread_bps!)),
          threshold_value: threshold.value,
        });
      }
    }

    if (threshold.threshold_key === "min_quality_score") {
      const weak = observations.filter((o) => o.quality_score < threshold.value);
      if (weak.length > 0) {
        alerts.push({
          threshold_key: threshold.threshold_key,
          label: threshold.label,
          severity: threshold.severity,
          message: `${weak.length} observation(s) below quality floor`,
          observed_value: Math.min(...weak.map((o) => o.quality_score)),
          threshold_value: threshold.value,
        });
      }
    }

    if (threshold.threshold_key === "min_quorum_pass_rate") {
      const total = observations.length;
      const passed = observations.filter((o) => o.quorum_passed).length;
      const rate = total > 0 ? (passed / total) * 100 : 0;
      if (rate < threshold.value) {
        alerts.push({
          threshold_key: threshold.threshold_key,
          label: threshold.label,
          severity: threshold.severity,
          message: `Quorum pass rate ${rate.toFixed(1)}% below floor`,
          observed_value: rate,
          threshold_value: threshold.value,
        });
      }
    }
  }

  return alerts;
}

export const DEFAULT_HERMES_THRESHOLDS: HermesRiskThreshold[] = [
  {
    threshold_key: "min_liquidity_usd",
    label: "Minimum pool liquidity",
    value: 100_000,
    unit: "usd",
    severity: "high",
    enabled: true,
  },
  {
    threshold_key: "max_spread_bps",
    label: "Maximum spread",
    value: 50,
    unit: "bps",
    severity: "medium",
    enabled: true,
  },
  {
    threshold_key: "min_quality_score",
    label: "Minimum observation quality",
    value: 0.6,
    unit: "score",
    severity: "medium",
    enabled: true,
  },
  {
    threshold_key: "min_quorum_pass_rate",
    label: "Minimum quorum pass rate",
    value: 80,
    unit: "percent",
    severity: "high",
    enabled: true,
  },
];
