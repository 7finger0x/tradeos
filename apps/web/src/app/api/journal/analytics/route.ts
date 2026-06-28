import { NextResponse } from "next/server";
import {
  computeTradeAnalytics,
  filterTradesByPeriod,
  generateJournalSummary,
  startOfDay,
  startOfWeek,
} from "@tradeos/core";
import { requireApiSession, isSessionError } from "@/lib/auth/session";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession();
    if (isSessionError(session)) return session;
    const { supabase, userId, tenantId } = session;

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") ?? "daily";

    const { data: trades, error } = await supabase
      .from("trades")
      .select("net_pnl, r_multiple, setup_id, entry_time")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const now = new Date();
    const periodStart =
      period === "weekly" ? startOfWeek(now) : startOfDay(now);
    const periodEnd = now;

    const periodTrades = filterTradesByPeriod(trades ?? [], periodStart, periodEnd);
    const allAnalytics = computeTradeAnalytics(trades ?? []);
    const periodAnalytics = computeTradeAnalytics(periodTrades);

    const label = period === "weekly" ? "Weekly" : "Daily";
    const summaryText = generateJournalSummary(periodAnalytics, label);

    const periodStartStr = periodStart.toISOString().slice(0, 10);

    await supabase.from("journal_summaries").upsert(
      {
        tenant_id: tenantId,
        user_id: userId,
        period_type: period === "weekly" ? "weekly" : "daily",
        period_start: periodStartStr,
        period_end: periodEnd.toISOString().slice(0, 10),
        metrics: periodAnalytics,
        summary_text: summaryText,
      },
      { onConflict: "tenant_id,user_id,period_type,period_start" },
    );

    return NextResponse.json({
      all_time: allAnalytics,
      period: periodAnalytics,
      summary: summaryText,
      period_type: period,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
