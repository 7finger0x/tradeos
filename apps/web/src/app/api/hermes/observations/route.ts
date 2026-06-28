import { NextResponse } from "next/server";
import { requireApiSession, isSessionError } from "@/lib/auth/session";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession();
    if (isSessionError(session)) return session;
    const { supabase, tenantId } = session;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);

    const { data, error } = await supabase
      .from("hermes_liquidity_observations")
      .select(
        "id, chain_id, pool_address, token_pair, liquidity_usd, volume_24h_usd, spread_bps, quality_score, quorum_passed, observed_at, hermes_providers(provider_key, display_name)",
      )
      .eq("tenant_id", tenantId)
      .order("observed_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ observations: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
