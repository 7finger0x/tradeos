export type TradeAnalyticsInput = {
  net_pnl: number | null;
  r_multiple: number | null;
  setup_id?: string | null;
  entry_time: string;
};

export type TradeAnalytics = {
  trade_count: number;
  win_count: number;
  loss_count: number;
  breakeven_count: number;
  win_rate: number;
  total_net_pnl: number;
  average_win: number;
  average_loss: number;
  average_r: number;
  expectancy: number;
  profit_factor: number;
  largest_win: number;
  largest_loss: number;
};

export function computeTradeAnalytics(trades: TradeAnalyticsInput[]): TradeAnalytics {
  const closed = trades.filter((t) => t.net_pnl !== null);
  const wins = closed.filter((t) => (t.net_pnl ?? 0) > 0);
  const losses = closed.filter((t) => (t.net_pnl ?? 0) < 0);
  const breakeven = closed.filter((t) => (t.net_pnl ?? 0) === 0);

  const totalWin = wins.reduce((s, t) => s + (t.net_pnl ?? 0), 0);
  const totalLoss = Math.abs(losses.reduce((s, t) => s + (t.net_pnl ?? 0), 0));
  const totalNet = closed.reduce((s, t) => s + (t.net_pnl ?? 0), 0);

  const rValues = closed
    .map((t) => t.r_multiple)
    .filter((r): r is number => r !== null && r !== undefined);

  const winRate = closed.length > 0 ? wins.length / closed.length : 0;
  const avgWin = wins.length > 0 ? totalWin / wins.length : 0;
  const avgLoss = losses.length > 0 ? totalLoss / losses.length : 0;
  const avgR = rValues.length > 0 ? rValues.reduce((a, b) => a + b, 0) / rValues.length : 0;
  const expectancy =
    closed.length > 0 ? winRate * avgWin - (1 - winRate) * avgLoss : 0;
  const profitFactor = totalLoss > 0 ? totalWin / totalLoss : totalWin > 0 ? Infinity : 0;

  return {
    trade_count: trades.length,
    win_count: wins.length,
    loss_count: losses.length,
    breakeven_count: breakeven.length,
    win_rate: Number((winRate * 100).toFixed(2)),
    total_net_pnl: Number(totalNet.toFixed(2)),
    average_win: Number(avgWin.toFixed(2)),
    average_loss: Number(-avgLoss.toFixed(2)),
    average_r: Number(avgR.toFixed(2)),
    expectancy: Number(expectancy.toFixed(2)),
    profit_factor: profitFactor === Infinity ? 999 : Number(profitFactor.toFixed(2)),
    largest_win: wins.length ? Math.max(...wins.map((t) => t.net_pnl ?? 0)) : 0,
    largest_loss: losses.length ? Math.min(...losses.map((t) => t.net_pnl ?? 0)) : 0,
  };
}

export function filterTradesByPeriod(
  trades: TradeAnalyticsInput[],
  periodStart: Date,
  periodEnd: Date,
): TradeAnalyticsInput[] {
  return trades.filter((t) => {
    const d = new Date(t.entry_time);
    return d >= periodStart && d <= periodEnd;
  });
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
}
