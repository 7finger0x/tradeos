import { computeTradeAnalytics, type TradeAnalytics } from "./trade-analytics";

export type StrategyTradeInput = {
  net_pnl: number | null;
  r_multiple: number | null;
  setup_id?: string | null;
  symbol: string;
  entry_time: string;
  emotion?: string | null;
};

export type SetupRef = {
  id: string;
  name: string;
};

export type GroupedAnalyticsRow = {
  key: string;
  label: string;
  trade_count: number;
  analytics: TradeAnalytics;
};

const UNASSIGNED_SETUP_KEY = "__unassigned__";

export function computeSetupLeaderboard(
  trades: StrategyTradeInput[],
  setups: SetupRef[],
): GroupedAnalyticsRow[] {
  const setupNameById = new Map(setups.map((s) => [s.id, s.name]));
  const groups = new Map<string, StrategyTradeInput[]>();

  for (const trade of trades) {
    const key = trade.setup_id ?? UNASSIGNED_SETUP_KEY;
    const bucket = groups.get(key) ?? [];
    bucket.push(trade);
    groups.set(key, bucket);
  }

  const rows: GroupedAnalyticsRow[] = [];

  for (const [key, groupTrades] of groups) {
    const label =
      key === UNASSIGNED_SETUP_KEY
        ? "Unassigned"
        : (setupNameById.get(key) ?? "Unknown setup");
    rows.push({
      key,
      label,
      trade_count: groupTrades.length,
      analytics: computeTradeAnalytics(groupTrades),
    });
  }

  return rows.sort((a, b) => b.analytics.expectancy - a.analytics.expectancy);
}

export function computeSymbolBreakdown(trades: StrategyTradeInput[]): GroupedAnalyticsRow[] {
  const groups = new Map<string, StrategyTradeInput[]>();

  for (const trade of trades) {
    const key = trade.symbol.toUpperCase();
    const bucket = groups.get(key) ?? [];
    bucket.push(trade);
    groups.set(key, bucket);
  }

  return [...groups.entries()]
    .map(([key, groupTrades]) => ({
      key,
      label: key,
      trade_count: groupTrades.length,
      analytics: computeTradeAnalytics(groupTrades),
    }))
    .sort((a, b) => b.analytics.total_net_pnl - a.analytics.total_net_pnl);
}

const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function computeWeekdayBreakdown(trades: StrategyTradeInput[]): GroupedAnalyticsRow[] {
  const groups = new Map<number, StrategyTradeInput[]>();

  for (const trade of trades) {
    const day = new Date(trade.entry_time).getUTCDay();
    const bucket = groups.get(day) ?? [];
    bucket.push(trade);
    groups.set(day, bucket);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([day, groupTrades]) => ({
      key: String(day),
      label: WEEKDAY_LABELS[day] ?? `Day ${day}`,
      trade_count: groupTrades.length,
      analytics: computeTradeAnalytics(groupTrades),
    }));
}

export function computeEmotionBreakdown(trades: StrategyTradeInput[]): GroupedAnalyticsRow[] {
  const withEmotion = trades.filter((t) => t.emotion && t.emotion.trim().length > 0);
  const groups = new Map<string, StrategyTradeInput[]>();

  for (const trade of withEmotion) {
    const key = trade.emotion!.trim().toLowerCase();
    const bucket = groups.get(key) ?? [];
    bucket.push(trade);
    groups.set(key, bucket);
  }

  return [...groups.entries()]
    .map(([key, groupTrades]) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      trade_count: groupTrades.length,
      analytics: computeTradeAnalytics(groupTrades),
    }))
    .sort((a, b) => b.trade_count - a.trade_count);
}
