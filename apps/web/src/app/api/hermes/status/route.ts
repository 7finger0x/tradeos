import { NextResponse } from "next/server";
import {
  computeQuorumPassRate,
  evaluateThresholdAlerts,
} from "@tradeos/core";
import { requireApiSession, isSessionError } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await requireApiSession();
    if (isSessionError(session)) return session;
    const { supabase, tenantId } = session;

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [agentsRes, providersRes, obsRes, thresholdsRes] = await Promise.all([
      supabase
        .from("hermes_agent_state")
        .select("agent_name, status, last_run_at, metadata")
        .eq("tenant_id", tenantId),
      supabase
        .from("hermes_providers")
        .select("id, provider_key, status, chain_id")
        .eq("tenant_id", tenantId),
      supabase
        .from("hermes_liquidity_observations")
        .select("liquidity_usd, spread_bps, quality_score, quorum_passed, observed_at")
        .eq("tenant_id", tenantId)
        .gte("observed_at", since)
        .order("observed_at", { ascending: false })
        .limit(200),
      supabase
        .from("hermes_risk_thresholds")
        .select("threshold_key, label, value, unit, severity, enabled")
        .eq("tenant_id", tenantId),
    ]);

    const ingestAgent = agentsRes.data?.find((a) => a.agent_name === "liquidity_ingest");
    const providers = providersRes.data ?? [];
    const observations = obsRes.data ?? [];

    const providerIds = providers.map((p) => p.id);
    let healthyCount = 0;
    if (providerIds.length > 0) {
      const { data: healthRows } = await supabase
        .from("hermes_provider_health")
        .select("provider_id, success_rate, quorum_eligible")
        .in("provider_id", providerIds)
        .gte("recorded_at", since)
        .order("recorded_at", { ascending: false });

      const latestByProvider = new Map<string, { success_rate: number; quorum_eligible: boolean }>();
      for (const row of healthRows ?? []) {
        if (!latestByProvider.has(row.provider_id as string)) {
          latestByProvider.set(row.provider_id as string, {
            success_rate: Number(row.success_rate),
            quorum_eligible: row.quorum_eligible as boolean,
          });
        }
      }
      healthyCount = [...latestByProvider.values()].filter(
        (h) => h.quorum_eligible && h.success_rate >= 0.9,
      ).length;
    }

    const quorumPassRate = computeQuorumPassRate(
      observations.map((o) => ({ passed: o.quorum_passed as boolean } as never)),
    );

    const thresholds = (thresholdsRes.data ?? []).map((t) => ({
      threshold_key: t.threshold_key as string,
      label: t.label as string,
      value: Number(t.value),
      unit: t.unit as string,
      severity: t.severity as string,
      enabled: t.enabled as boolean,
    }));

    const alerts = evaluateThresholdAlerts(
      observations.map((o) => ({
        liquidity_usd: Number(o.liquidity_usd),
        spread_bps: o.spread_bps !== null ? Number(o.spread_bps) : null,
        quality_score: Number(o.quality_score),
        quorum_passed: o.quorum_passed as boolean,
      })),
      thresholds,
    );

    return NextResponse.json({
      summary: {
        agent_status: ingestAgent?.status ?? "idle",
        last_run_at: ingestAgent?.last_run_at ?? null,
        provider_count: providers.length,
        healthy_providers: healthyCount,
        observation_count_24h: observations.length,
        quorum_pass_rate: quorumPassRate,
        threshold_alerts: alerts.length,
      },
      alerts,
      agents: agentsRes.data ?? [],
      providers,
      recent_observations: observations.slice(0, 10),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
