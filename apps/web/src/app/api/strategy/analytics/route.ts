import { NextResponse } from "next/server";
import {
  computeAdvancedTradeMetrics,
  computeEmotionBreakdown,
  computeSetupLeaderboard,
  computeSymbolBreakdown,
  computeTradeAnalytics,
  computeWeekdayBreakdown,
  generateStrategyInsights,
  STRATEGY_ANALYTICS_DISCLAIMER,
} from "@tradeos/core";
import { requireApiSession, isSessionError } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await requireApiSession();
    if (isSessionError(session)) return session;
    const { supabase, userId, tenantId } = session;

    const [tradesResult, setupsResult] = await Promise.all([
      supabase
        .from("trades")
        .select("net_pnl, r_multiple, setup_id, symbol, entry_time, emotion")
        .eq("tenant_id", tenantId)
        .eq("user_id", userId),
      supabase
        .from("setups")
        .select("id, name")
        .eq("tenant_id", tenantId)
        .eq("user_id", userId),
    ]);

    if (tradesResult.error) {
      return NextResponse.json({ error: tradesResult.error.message }, { status: 500 });
    }
    if (setupsResult.error) {
      return NextResponse.json({ error: setupsResult.error.message }, { status: 500 });
    }

    const trades = tradesResult.data ?? [];
    const setups = setupsResult.data ?? [];

    const overview = computeTradeAnalytics(trades);
    const advanced = computeAdvancedTradeMetrics(trades);
    const setupRows = computeSetupLeaderboard(trades, setups);
    const symbolRows = computeSymbolBreakdown(trades);
    const weekdayRows = computeWeekdayBreakdown(trades);
    const emotionRows = computeEmotionBreakdown(trades);

    const insights = generateStrategyInsights({
      overview,
      advanced,
      setups: setupRows,
      symbols: symbolRows,
    });

    return NextResponse.json({
      overview,
      advanced,
      setups: setupRows,
      symbols: symbolRows,
      weekdays: weekdayRows,
      emotions: emotionRows,
      insights,
      disclaimer: STRATEGY_ANALYTICS_DISCLAIMER,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
