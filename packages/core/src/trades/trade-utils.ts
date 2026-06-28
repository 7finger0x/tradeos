import type { CreateTradeInput } from "../schemas/trade";

export function computeTradeFingerprint(input: {
  symbol: string;
  direction: string;
  entry_time: string;
  entry_price: number;
  quantity: number;
  broker_trade_id?: string | null;
}): string {
  if (input.broker_trade_id) {
    return `broker:${input.broker_trade_id}:${input.symbol}`.toLowerCase();
  }
  const key = [
    input.symbol.toUpperCase(),
    input.direction,
    input.entry_time,
    input.entry_price.toFixed(6),
    input.quantity.toFixed(6),
  ].join("|");
  return `fp:${key}`.toLowerCase();
}

export function computeNetPnl(input: {
  direction: "long" | "short";
  entry_price: number;
  exit_price?: number | null;
  quantity: number;
  fees?: number;
  gross_pnl?: number | null;
  net_pnl?: number | null;
}): number | null {
  if (input.net_pnl !== undefined && input.net_pnl !== null) {
    return input.net_pnl;
  }
  if (input.gross_pnl !== undefined && input.gross_pnl !== null) {
    return input.gross_pnl - (input.fees ?? 0);
  }
  if (input.exit_price === undefined || input.exit_price === null) {
    return null;
  }
  const gross =
    input.direction === "long"
      ? (input.exit_price - input.entry_price) * input.quantity
      : (input.entry_price - input.exit_price) * input.quantity;
  return gross - (input.fees ?? 0);
}

export function computeRMultiple(
  netPnl: number | null,
  riskAmount?: number | null,
): number | null {
  if (netPnl === null || !riskAmount || riskAmount <= 0) {
    return null;
  }
  return Number((netPnl / riskAmount).toFixed(4));
}

export function normalizeTradeInput(
  input: CreateTradeInput,
): CreateTradeInput & { trade_fingerprint: string; net_pnl: number | null; r_multiple: number | null } {
  const net_pnl = computeNetPnl(input);
  const r_multiple =
    input.r_multiple ?? computeRMultiple(net_pnl, input.risk_amount ?? null);

  return {
    ...input,
    symbol: input.symbol.toUpperCase(),
    net_pnl,
    r_multiple,
    trade_fingerprint: computeTradeFingerprint({
      symbol: input.symbol,
      direction: input.direction,
      entry_time: input.entry_time,
      entry_price: input.entry_price,
      quantity: input.quantity,
      broker_trade_id: input.broker_trade_id,
    }),
  };
}
