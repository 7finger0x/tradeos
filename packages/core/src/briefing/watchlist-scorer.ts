import type { WatchlistCandidate } from "../schemas/briefing";

export type WatchlistScoreInput = {
  symbol: string;
  change_pct: number;
  relative_volume: number;
  momentum_score: number;
  has_earnings_today: boolean;
  user_historical_win_rate?: number;
  user_trade_count?: number;
};

export function scoreWatchlistCandidate(input: WatchlistScoreInput): WatchlistCandidate {
  const catalyst = input.has_earnings_today ? 1.5 : 0.5;
  const momentum = Math.max(0, input.momentum_score);
  const relVol = Math.min(input.relative_volume, 3);
  const userEdge =
    input.user_trade_count && input.user_trade_count >= 5 && input.user_historical_win_rate
      ? input.user_historical_win_rate / 100
      : 0.3;

  const score = Number(
    (momentum * 0.35 + relVol * 0.25 + catalyst * 0.2 + userEdge * 0.2).toFixed(4),
  );

  const reasons: string[] = [];
  if (input.relative_volume >= 1.3) reasons.push("elevated volume");
  if (input.change_pct > 1) reasons.push("strong momentum");
  if (input.has_earnings_today) reasons.push("earnings catalyst");
  if (userEdge > 0.55) reasons.push("positive historical edge");

  const caution: string[] = [];
  if (input.has_earnings_today) caution.push("earnings volatility");
  if (input.relative_volume < 0.9) caution.push("thin liquidity");

  return {
    symbol: input.symbol,
    score,
    rank: 0,
    reason: reasons.length ? reasons.join(", ") : "baseline liquidity",
    setup_fit: input.change_pct > 0 ? "momentum continuation" : "watch for reversal",
    caution_notes: caution.join("; ") || undefined,
    relative_volume: input.relative_volume,
    momentum_score: input.momentum_score,
    catalyst_score: catalyst,
    user_edge_score: userEdge,
  };
}

export function rankWatchlistCandidates(
  candidates: WatchlistCandidate[],
  limit = 8,
): WatchlistCandidate[] {
  return [...candidates]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((c, i) => ({ ...c, rank: i + 1 }));
}
