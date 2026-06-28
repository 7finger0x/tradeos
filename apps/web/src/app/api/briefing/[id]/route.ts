import { NextResponse } from "next/server";
import { requireApiSession, isSessionError } from "@/lib/auth/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const session = await requireApiSession();
    if (isSessionError(session)) return session;
    const { supabase, userId, tenantId } = session;

    const { data, error } = await supabase
      .from("market_briefings")
      .select("*, watchlists(id, name)")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Briefing not found" }, { status: 404 });
    }

    let symbols: unknown[] = [];
    if (data.watchlist_id) {
      const { data: wlSymbols } = await supabase
        .from("watchlist_symbols")
        .select("*")
        .eq("watchlist_id", data.watchlist_id)
        .order("rank");
      symbols = wlSymbols ?? [];
    }

    return NextResponse.json({ briefing: data, watchlist_symbols: symbols });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
