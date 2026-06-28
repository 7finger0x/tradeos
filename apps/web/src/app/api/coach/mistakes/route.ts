import { NextResponse } from "next/server";
import { analyzeMistakeCosts } from "@tradeos/core";
import { requireApiSession, isSessionError } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await requireApiSession();
    if (isSessionError(session)) return session;
    const { supabase, userId, tenantId } = session;

    const [tradesRes, libraryRes] = await Promise.all([
      supabase
        .from("trades")
        .select("mistake_tags, net_pnl")
        .eq("tenant_id", tenantId)
        .eq("user_id", userId),
      supabase.from("mistake_library").select("code, title, description, category, typical_cost_hint"),
    ]);

    if (tradesRes.error) {
      return NextResponse.json({ error: tradesRes.error.message }, { status: 500 });
    }

    const costs = analyzeMistakeCosts(
      (tradesRes.data ?? []).map((t) => ({
        mistake_tags: t.mistake_tags ?? [],
        net_pnl: t.net_pnl !== null ? Number(t.net_pnl) : null,
      })),
      libraryRes.data ?? [],
    );

    return NextResponse.json({
      library: libraryRes.data ?? [],
      costs,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
