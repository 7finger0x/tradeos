import type { TradeAnalyticsInput } from "./trade-analytics";

export type EquityCurvePoint = {
  date: string;
  cumulative_pnl: number;
  trade_index: number;
};

export type StreakMetrics = {
  current_streak: number;
  current_streak_type: "win" | "loss" | "none";
  longest_win_streak: number;
  longest_loss_streak: number;
};

export type DrawdownMetrics = {
  max_drawdown: number;
  max_drawdown_pct: number;
  peak_equity: number;
};

export type AdvancedTradeMetrics = {
  equity_curve: EquityCurvePoint[];
  drawdown: DrawdownMetrics;
  streaks: StreakMetrics;
};

function closedTradesSorted(trades: TradeAnalyticsInput[]): TradeAnalyticsInput[] {
  return trades
    .filter((t) => t.net_pnl !== null)
    .slice()
    .sort((a, b) => new Date(a.entry_time).getTime() - new Date(b.entry_time).getTime());
}

export function buildEquityCurve(trades: TradeAnalyticsInput[]): EquityCurvePoint[] {
  const closed = closedTradesSorted(trades);
  let cumulative = 0;

  return closed.map((trade, index) => {
    cumulative += trade.net_pnl ?? 0;
    return {
      date: trade.entry_time.slice(0, 10),
      cumulative_pnl: Number(cumulative.toFixed(2)),
      trade_index: index + 1,
    };
  });
}

export function computeDrawdown(trades: TradeAnalyticsInput[]): DrawdownMetrics {
  const curve = buildEquityCurve(trades);
  if (curve.length === 0) {
    return { max_drawdown: 0, max_drawdown_pct: 0, peak_equity: 0 };
  }

  let peak = 0;
  let maxDrawdown = 0;

  for (const point of curve) {
    peak = Math.max(peak, point.cumulative_pnl);
    const drawdown = peak - point.cumulative_pnl;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  }

  const peakEquity = Math.max(0, peak);
  const maxDrawdownPct =
    peakEquity > 0 ? Number(((maxDrawdown / peakEquity) * 100).toFixed(2)) : 0;

  return {
    max_drawdown: Number(maxDrawdown.toFixed(2)),
    max_drawdown_pct: maxDrawdownPct,
    peak_equity: Number(peakEquity.toFixed(2)),
  };
}

export function computeStreaks(trades: TradeAnalyticsInput[]): StreakMetrics {
  const closed = closedTradesSorted(trades);
  if (closed.length === 0) {
    return {
      current_streak: 0,
      current_streak_type: "none",
      longest_win_streak: 0,
      longest_loss_streak: 0,
    };
  }

  let longestWin = 0;
  let longestLoss = 0;
  let winRun = 0;
  let lossRun = 0;

  for (const trade of closed) {
    const pnl = trade.net_pnl ?? 0;
    if (pnl > 0) {
      winRun += 1;
      lossRun = 0;
      longestWin = Math.max(longestWin, winRun);
    } else if (pnl < 0) {
      lossRun += 1;
      winRun = 0;
      longestLoss = Math.max(longestLoss, lossRun);
    } else {
      winRun = 0;
      lossRun = 0;
    }
  }

  const lastPnl = closed[closed.length - 1]?.net_pnl ?? 0;
  let currentType: StreakMetrics["current_streak_type"] = "none";
  let currentStreak = 0;

  if (lastPnl > 0) {
    currentType = "win";
    for (let i = closed.length - 1; i >= 0; i -= 1) {
      if ((closed[i]?.net_pnl ?? 0) > 0) currentStreak += 1;
      else break;
    }
  } else if (lastPnl < 0) {
    currentType = "loss";
    for (let i = closed.length - 1; i >= 0; i -= 1) {
      if ((closed[i]?.net_pnl ?? 0) < 0) currentStreak += 1;
      else break;
    }
  }

  return {
    current_streak: currentStreak,
    current_streak_type: currentType,
    longest_win_streak: longestWin,
    longest_loss_streak: longestLoss,
  };
}

export function computeAdvancedTradeMetrics(
  trades: TradeAnalyticsInput[],
): AdvancedTradeMetrics {
  return {
    equity_curve: buildEquityCurve(trades),
    drawdown: computeDrawdown(trades),
    streaks: computeStreaks(trades),
  };
}
