import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_HERMES_THRESHOLDS,
  evaluateQuorum,
  recordAuditEvent,
} from "@tradeos/core";
import { fetchMultiProviderSnapshots } from "@tradeos/integrations";

type IngestResult = {
  observations_inserted: number;
  health_records_inserted: number;
  quorum_results: Array<{
    pool_address: string;
    token_pair: string;
    passed: boolean;
    quality_score: number;
  }>;
};

const DEFAULT_CHAIN = "ethereum-mainnet";

export async function ensureHermesProviders(
  supabase: SupabaseClient,
  tenantId: string,
  chainId: string,
): Promise<Map<string, string>> {
  const keys = [
    { key: `${chainId}-rpc-alpha`, name: "Alpha RPC" },
    { key: `${chainId}-rpc-beta`, name: "Beta RPC" },
    { key: `${chainId}-rpc-gamma`, name: "Gamma RPC" },
  ];

  const idByKey = new Map<string, string>();

  for (const p of keys) {
    const { data } = await supabase
      .from("hermes_providers")
      .upsert(
        {
          tenant_id: tenantId,
          provider_key: p.key,
          provider_type: "mock",
          chain_id: chainId,
          display_name: p.name,
          status: "active",
        },
        { onConflict: "tenant_id,provider_key" },
      )
      .select("id, provider_key")
      .single();

    if (data) idByKey.set(data.provider_key as string, data.id as string);
  }

  return idByKey;
}

export async function ensureDefaultThresholds(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<void> {
  for (const t of DEFAULT_HERMES_THRESHOLDS) {
    await supabase.from("hermes_risk_thresholds").upsert(
      {
        tenant_id: tenantId,
        threshold_key: t.threshold_key,
        label: t.label,
        value: t.value,
        unit: t.unit,
        severity: t.severity,
        enabled: t.enabled,
      },
      { onConflict: "tenant_id,threshold_key" },
    );
  }
}

export async function ingestHermesLiquidity(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  chainId: string = DEFAULT_CHAIN,
): Promise<IngestResult> {
  await supabase.from("hermes_agent_state").upsert(
    {
      tenant_id: tenantId,
      agent_name: "liquidity_ingest",
      status: "running",
      last_run_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id,agent_name" },
  );

  const providerIds = await ensureHermesProviders(supabase, tenantId, chainId);
  await ensureDefaultThresholds(supabase, tenantId);

  const snapshots = await fetchMultiProviderSnapshots(chainId);
  const now = new Date().toISOString();
  let healthCount = 0;

  for (const snap of snapshots) {
    const providerId = providerIds.get(snap.provider_key);
    if (!providerId) continue;

    await supabase.from("hermes_provider_health").insert({
      tenant_id: tenantId,
      provider_id: providerId,
      recorded_at: now,
      latency_ms: snap.health.latency_ms,
      success_rate: snap.health.success_rate,
      error_rate: snap.health.error_rate,
      staleness_seconds: snap.health.staleness_seconds,
      quorum_eligible: snap.health.quorum_eligible,
      metrics: snap.health.metrics ?? {},
    });
    healthCount++;
  }

  const poolKeys = new Set<string>();
  for (const snap of snapshots) {
    for (const pool of snap.pools) {
      poolKeys.add(`${pool.pool_address}|${pool.token_pair}`);
    }
  }

  const quorumResults: IngestResult["quorum_results"] = [];
  let obsCount = 0;

  for (const key of poolKeys) {
    const [poolAddress, tokenPair] = key.split("|");
    const readings = snapshots
      .map((snap) => {
        const pool = snap.pools.find(
          (p) => p.pool_address === poolAddress && p.token_pair === tokenPair,
        );
        if (!pool) return null;
        return {
          provider_key: snap.provider_key,
          liquidity_usd: pool.liquidity_usd,
          health: snap.health,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    const quorum = evaluateQuorum(poolAddress!, tokenPair!, readings);

    for (const snap of snapshots) {
      const pool = snap.pools.find(
        (p) => p.pool_address === poolAddress && p.token_pair === tokenPair,
      );
      if (!pool) continue;
      const providerId = providerIds.get(snap.provider_key);
      if (!providerId) continue;

      await supabase.from("hermes_liquidity_observations").insert({
        tenant_id: tenantId,
        provider_id: providerId,
        chain_id: pool.chain_id,
        pool_address: pool.pool_address,
        token_pair: pool.token_pair,
        liquidity_usd: pool.liquidity_usd,
        volume_24h_usd: pool.volume_24h_usd,
        spread_bps: pool.spread_bps,
        depth_score: pool.depth_score,
        quality_score: quorum.quality_score,
        quorum_passed: quorum.passed,
        observed_at: now,
        raw_payload: { provider_key: snap.provider_key, quorum },
      });
      obsCount++;
    }

    quorumResults.push({
      pool_address: poolAddress!,
      token_pair: tokenPair!,
      passed: quorum.passed,
      quality_score: quorum.quality_score,
    });
  }

  await supabase.from("hermes_agent_state").upsert(
    {
      tenant_id: tenantId,
      agent_name: "liquidity_ingest",
      status: "idle",
      last_run_at: now,
      metadata: { observations: obsCount, health_records: healthCount },
    },
    { onConflict: "tenant_id,agent_name" },
  );

  await supabase.from("hermes_operator_actions").insert({
    tenant_id: tenantId,
    operator_id: userId,
    action_type: "liquidity_ingest",
    target_type: "chain",
    payload: { chain_id: chainId, observations: obsCount, quorum_results: quorumResults },
    status: "completed",
  });

  await recordAuditEvent(supabase, {
    tenant_id: tenantId,
    actor_id: userId,
    action: "hermes.liquidity_ingest",
    resource_type: "hermes_liquidity_observations",
    after_state: { chain_id: chainId, count: obsCount },
  });

  return {
    observations_inserted: obsCount,
    health_records_inserted: healthCount,
    quorum_results: quorumResults,
  };
}
