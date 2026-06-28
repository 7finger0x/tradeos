import type { MarketDataProvider, MarketSnapshot, SymbolQuote } from "./types";

const UNIVERSE = [
  "AAPL", "MSFT", "NVDA", "TSLA", "AMD", "META", "AMZN", "GOOGL",
  "SPY", "QQQ", "COST", "CRM", "NFLX", "PLTR", "SMCI",
];

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function pseudoChange(symbol: string, day: string): number {
  const seed = hashSeed(`${symbol}:${day}`);
  return ((seed % 401) - 200) / 100;
}

function pseudoRelVolume(symbol: string, day: string): number {
  const seed = hashSeed(`${symbol}:rv:${day}`);
  return 0.8 + (seed % 120) / 100;
}

export class MockMarketDataProvider implements MarketDataProvider {
  readonly name = "mock";

  async getMarketSnapshot(): Promise<MarketSnapshot> {
    const day = new Date().toISOString().slice(0, 10);
    const spyChange = pseudoChange("SPY", day);
    const qqqChange = pseudoChange("QQQ", day);
    const vix = 14 + (hashSeed(day) % 180) / 10;

    let regime: MarketSnapshot["regime"] = "range_bound";
    if (vix >= 20) regime = "high_volatility";
    else if (vix <= 13) regime = "low_volatility";
    else if (spyChange > 0.5 && qqqChange > 0.5) regime = "trend_up";
    else if (spyChange < -0.5 && qqqChange < -0.5) regime = "trend_down";
    else if (spyChange > 0) regime = "risk_on";
    else regime = "risk_off";

    return {
      as_of: new Date().toISOString(),
      indices: [
        {
          symbol: "SPY",
          name: "S&P 500 ETF",
          price: 540 + spyChange,
          change_pct: spyChange,
          prior_close: 540,
        },
        {
          symbol: "QQQ",
          name: "Nasdaq 100 ETF",
          price: 470 + qqqChange,
          change_pct: qqqChange,
          prior_close: 470,
        },
        {
          symbol: "DIA",
          name: "Dow ETF",
          price: 390 + pseudoChange("DIA", day),
          change_pct: pseudoChange("DIA", day),
          prior_close: 390,
        },
      ],
      vix,
      vix_change_pct: pseudoChange("VIX", day),
      regime,
      sector_leaders: ["Technology", "Communication Services"],
      sector_laggards: ["Utilities", "Real Estate"],
    };
  }

  async getSymbolQuotes(symbols: string[]): Promise<SymbolQuote[]> {
    const day = new Date().toISOString().slice(0, 10);
    const list = symbols.length > 0 ? symbols : UNIVERSE;

    return list.map((symbol) => {
      const change = pseudoChange(symbol, day);
      const relVol = pseudoRelVolume(symbol, day);
      return {
        symbol,
        price: 100 + hashSeed(symbol) % 400,
        change_pct: change,
        relative_volume: relVol,
        momentum_score: Number((change * relVol).toFixed(2)),
      };
    });
  }
}

export function createMarketProvider(): MarketDataProvider {
  const provider = process.env.MARKET_DATA_PROVIDER ?? "mock";
  if (provider === "mock") {
    return new MockMarketDataProvider();
  }
  return new MockMarketDataProvider();
}
