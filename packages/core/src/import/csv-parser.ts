import type { ParsedCsvTrade } from "../schemas/trade";

export type CsvFormat = "generic" | "thinkorswim";

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  result.push(current.trim());
  return result;
}

function parseCsv(content: string): { headers: string[]; rows: string[][] } {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { headers: [], rows: [] };
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const rows = lines.slice(1).map(parseCsvLine);
  return { headers, rows };
}

function getCell(row: string[], headers: string[], ...keys: string[]): string {
  for (const key of keys) {
    const idx = headers.indexOf(key.toLowerCase());
    if (idx >= 0 && row[idx]) {
      return row[idx];
    }
  }
  return "";
}

function parseNumber(value: string): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[$,\s]/g, "");
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function parseDirection(value: string): "long" | "short" | null {
  const v = value.toLowerCase();
  if (["buy", "long", "b", "bot", "buy to open"].some((k) => v.includes(k))) {
    return "long";
  }
  if (["sell", "short", "s", "sld", "sell to close"].some((k) => v.includes(k))) {
    return "short";
  }
  return null;
}

function toIsoDate(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function parseGenericRow(headers: string[], row: string[]): ParsedCsvTrade | null {
  const symbol = getCell(row, headers, "symbol", "ticker", "instrument");
  const directionRaw = getCell(row, headers, "direction", "side", "action");
  const entryTime = getCell(row, headers, "entry_time", "entry date", "date", "open time");
  const exitTime = getCell(row, headers, "exit_time", "exit date", "close time");
  const entryPrice = parseNumber(getCell(row, headers, "entry_price", "entry", "open price", "price"));
  const exitPrice = parseNumber(getCell(row, headers, "exit_price", "exit", "close price"));
  const quantity = parseNumber(getCell(row, headers, "quantity", "qty", "size", "shares"));
  const fees = parseNumber(getCell(row, headers, "fees", "commission")) ?? 0;
  const netPnl = parseNumber(getCell(row, headers, "net_pnl", "pnl", "p/l", "profit", "net profit"));
  const grossPnl = parseNumber(getCell(row, headers, "gross_pnl", "gross p/l"));
  const brokerTradeId = getCell(row, headers, "trade_id", "id", "order id") || null;

  const direction = parseDirection(directionRaw);
  const entryIso = toIsoDate(entryTime);

  if (!symbol || !direction || !entryIso || entryPrice === null || quantity === null) {
    return null;
  }

  return {
    symbol: symbol.toUpperCase(),
    direction,
    entry_time: entryIso,
    exit_time: exitTime ? toIsoDate(exitTime) : null,
    entry_price: entryPrice,
    exit_price: exitPrice,
    quantity,
    fees,
    gross_pnl: grossPnl,
    net_pnl: netPnl,
    broker_trade_id: brokerTradeId,
    broker: "csv_generic",
  };
}

function parseThinkorswimRow(headers: string[], row: string[]): ParsedCsvTrade | null {
  const symbol = getCell(row, headers, "symbol");
  const side = getCell(row, headers, "side");
  const execTime = getCell(row, headers, "exec time", "execution time", "date");
  const price = parseNumber(getCell(row, headers, "price"));
  const qty = parseNumber(getCell(row, headers, "qty", "quantity"));
  const net = parseNumber(getCell(row, headers, "net price", "amount", "p/l"));
  const orderId = getCell(row, headers, "order id", "exec id") || null;

  const direction = parseDirection(side);
  const entryIso = toIsoDate(execTime);

  if (!symbol || !direction || !entryIso || price === null || qty === null) {
    return null;
  }

  return {
    symbol: symbol.toUpperCase(),
    direction,
    entry_time: entryIso,
    exit_time: null,
    entry_price: price,
    exit_price: null,
    quantity: Math.abs(qty),
    fees: 0,
    gross_pnl: net,
    net_pnl: net,
    broker_trade_id: orderId,
    broker: "thinkorswim",
  };
}

export function detectCsvFormat(headers: string[]): CsvFormat {
  const joined = headers.join("|");
  if (joined.includes("exec time") || joined.includes("order id")) {
    return "thinkorswim";
  }
  return "generic";
}

export type CsvParseResult = {
  format: CsvFormat;
  trades: ParsedCsvTrade[];
  errors: { row: number; message: string }[];
};

export function parseTradeCsv(content: string, format?: CsvFormat): CsvParseResult {
  const { headers, rows } = parseCsv(content);
  const detected = format ?? detectCsvFormat(headers);
  const trades: ParsedCsvTrade[] = [];
  const errors: { row: number; message: string }[] = [];

  rows.forEach((row, index) => {
    const parsed =
      detected === "thinkorswim"
        ? parseThinkorswimRow(headers, row)
        : parseGenericRow(headers, row);

    if (!parsed) {
      errors.push({ row: index + 2, message: "Could not parse required trade fields" });
      return;
    }
    trades.push(parsed);
  });

  return { format: detected, trades, errors };
}
