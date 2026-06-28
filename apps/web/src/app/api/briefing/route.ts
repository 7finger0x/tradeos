import { NextResponse } from "next/server";
import {
  computeTradeAnalytics,
  generateMarketBriefing,
  rankWatchlistCandidates,
  scoreWatchlistCandidate,
} from "@tradeos/core";
import { createMarketProvider } from "@tradeos/integrations";
import { requireApiSession, isSessionError } from "@/lib/auth/session";
import { evaluateUserRisk } from "@/lib/risk/evaluate-user-risk";

export async function GET() {
  try {
    const session = await requireApiSession();
    if (isSessionError(session)) return session;
    const { supabase, userId, tenantId } = session;

    const today = new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("market_briefings")
      .select("id, briefing_date, market_regime, ai_summary, created_at")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .order("briefing_date", { ascending: false })
      .limit(30);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: todayBriefing } = await supabase
      .from("market_briefings")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .eq("briefing_date", today)
      .maybeSingle();

    return NextResponse.json({
      today: todayBriefing,
      history: data ?? [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await requireApiSession();
    if (isSessionError(session)) return session;
    const { supabase, userId, tenantId } = session;

    const briefingDate = new Date().toISOString().slice(0, 10);
    const provider = createMarketProvider();

    const [snapshot, economicRes, earningsRes, riskResult, tradesRes] =
      await Promise.all([
        provider.getMarketSnapshot(),
        supabase
          .from("economic_events")
          .select("title, impact, event_time, event_date")
          .eq("event_date", briefingDate),
        supabase
          .from("earnings_events")
          .select("symbol, company_name, timing, event_date")
          .eq("event_date", briefingDate),
        evaluateUserRisk(supabase, tenantId, userId),
        supabase
          .from("trades")
          .select("symbol, net_pnl")
          .eq("tenant_id", tenantId)
          .eq("user_id", userId)
          .order("entry_time", { ascending: false })
          .limit(200),
      ]);

    const earningsSymbols = new Set(
      (earningsRes.data ?? []).map((e) => e.symbol as string),
    );

    const quotes = await provider.getSymbolQuotes([
      ...earningsSymbols,
      "AAPL", "MSFT", "NVDA", "TSLA", "AMD", "META", "AMZN", "GOOGL", "SPY", "QQQ",
    ]);

    const symbolStats = new Map<string, { wins: number; total: number }>();
    for (const t of tradesRes.data ?? []) {
      const sym = t.symbol as string;
      const cur = symbolStats.get(sym) ?? { wins: 0, total: 0 };
      cur.total++;
      if ((t.net_pnl as number) > 0) cur.wins++;
      symbolStats.set(sym, cur);
    }

    const candidates = quotes.map((q) => {
      const stats = symbolStats.get(q.symbol);
      return scoreWatchlistCandidate({
        symbol: q.symbol,
        change_pct: q.change_pct,
        relative_volume: q.relative_volume,
        momentum_score: q.momentum_score,
        has_earnings_today: earningsSymbols.has(q.symbol),
        user_historical_win_rate:
          stats && stats.total >= 3 ? (stats.wins / stats.total) * 100 : undefined,
        user_trade_count: stats?.total,
      });
    });

    const watchlistRanked = rankWatchlistCandidates(candidates, 8);

    const topSymbols = [...symbolStats.entries()]
      .filter(([, s]) => s.total >= 3)
      .sort((a, b) => b[1].wins / b[1].total - a[1].wins / a[1].total)
      .slice(0, 3)
      .map(([sym]) => sym);

    const recentAnalytics = computeTradeAnalytics(
      (tradesRes.data ?? []).slice(0, 20).map((t) => ({
        net_pnl: t.net_pnl as number | null,
        r_multiple: null,
        entry_time: new Date().toISOString(),
      })),
    );

    const briefing = generateMarketBriefing({
      briefing_date: briefingDate,
      market_snapshot: snapshot,
      economic_events: economicRes.data ?? [],
      earnings_events: earningsRes.data ?? [],
      watchlist: watchlistRanked,
      risk_overlay: {
        ui_label: riskResult.evaluation.ui_label,
        size_multiplier: riskResult.evaluation.size_multiplier,
        allowed_risk_per_trade: riskResult.evaluation.allowed_risk_per_trade,
        reasons: riskResult.evaluation.reasons,
        daily_pnl: riskResult.metrics.daily_pnl,
      },
      trader_context: {
        top_symbols: topSymbols,
        recent_win_rate: recentAnalytics.win_rate,
      },
    });

    const { data: watchlist, error: wlError } = await supabase
      .from("watchlists")
      .upsert(
        {
          tenant_id: tenantId,
          user_id: userId,
          name: "Today",
          briefing_date: briefingDate,
        },
        { onConflict: "tenant_id,user_id,briefing_date,name" },
      )
      .select()
      .single();

    if (wlError || !watchlist) {
      return NextResponse.json({ error: wlError?.message ?? "Watchlist failed" }, { status: 500 });
    }

    await supabase.from("watchlist_symbols").delete().eq("watchlist_id", watchlist.id);

    if (watchlistRanked.length > 0) {
      await supabase.from("watchlist_symbols").insert(
        watchlistRanked.map((w) => ({
          watchlist_id: watchlist.id,
          tenant_id: tenantId,
          symbol: w.symbol,
          rank: w.rank,
          score: w.score,
          reason: w.reason,
          setup_fit: w.setup_fit ?? null,
          caution_notes: w.caution_notes ?? null,
          relative_volume: w.relative_volume,
          momentum_score: w.momentum_score,
          catalyst_score: w.catalyst_score,
          user_edge_score: w.user_edge_score,
        })),
      );
    }

    const { data: saved, error: saveError } = await supabase
      .from("market_briefings")
      .upsert(
        {
          tenant_id: tenantId,
          user_id: userId,
          briefing_date: briefingDate,
          market_regime: briefing.market_regime,
          index_context: { indices: snapshot.indices },
          volatility_context: { vix: snapshot.vix, change: snapshot.vix_change_pct },
          economic_events: economicRes.data ?? [],
          earnings_events: earningsRes.data ?? [],
          watchlist_id: watchlist.id,
          risk_overlay: {
            ui_label: riskResult.evaluation.ui_label,
            size_multiplier: riskResult.evaluation.size_multiplier,
            allowed_risk_per_trade: riskResult.evaluation.allowed_risk_per_trade,
            reasons: riskResult.evaluation.reasons,
          },
          ai_summary: briefing.ai_summary,
          sections: briefing.sections,
          process_goal: briefing.process_goal,
          avoid_conditions: briefing.avoid_conditions,
          data_source: provider.name,
        },
        { onConflict: "tenant_id,user_id,briefing_date" },
      )
      .select()
      .single();

    if (saveError) {
      return NextResponse.json({ error: saveError.message }, { status: 500 });
    }

    return NextResponse.json({
      briefing: saved,
      watchlist: watchlistRanked,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
