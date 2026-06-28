import { describe, expect, it } from "vitest";
import { parseTradeCsv } from "../import/csv-parser";

describe("parseTradeCsv", () => {
  it("parses generic CSV format", () => {
    const csv = `symbol,direction,entry_time,exit_time,entry_price,exit_price,quantity,fees,net_pnl
AAPL,long,2026-06-01T14:30:00Z,2026-06-01T15:00:00Z,190.5,192.0,100,1.5,148.5`;

    const result = parseTradeCsv(csv, "generic");
    expect(result.trades).toHaveLength(1);
    expect(result.trades[0]?.symbol).toBe("AAPL");
    expect(result.trades[0]?.direction).toBe("long");
    expect(result.errors).toHaveLength(0);
  });

  it("parses thinkorswim-style CSV format", () => {
    const csv = `Exec Time,Symbol,Side,Qty,Price,Net Price,Order ID
6/1/26 14:30,AAPL,BUY,100,190.50,150.00,ORD-123`;

    const result = parseTradeCsv(csv, "thinkorswim");
    expect(result.trades).toHaveLength(1);
    expect(result.trades[0]?.symbol).toBe("AAPL");
    expect(result.trades[0]?.broker).toBe("thinkorswim");
  });

  it("reports errors for invalid rows", () => {
    const csv = `symbol,direction,entry_time,entry_price,quantity
,buy,,,`;

    const result = parseTradeCsv(csv, "generic");
    expect(result.trades).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
