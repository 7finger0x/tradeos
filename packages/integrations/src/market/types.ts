export type IndexQuote = {
  symbol: string;
  name: string;
  price: number;
  change_pct: number;
  prior_close: number;
};

export type MarketSnapshot = {
  as_of: string;
  indices: IndexQuote[];
  vix: number;
  vix_change_pct: number;
  regime: "trend_up" | "trend_down" | "range_bound" | "high_volatility" | "low_volatility" | "risk_on" | "risk_off";
  sector_leaders: string[];
  sector_laggards: string[];
};

export type SymbolQuote = {
  symbol: string;
  price: number;
  change_pct: number;
  relative_volume: number;
  momentum_score: number;
};

export type EconomicEvent = {
  event_date: string;
  title: string;
  impact: string;
  event_time?: string | null;
  forecast?: string | null;
};

export type EarningsEvent = {
  event_date: string;
  symbol: string;
  company_name?: string | null;
  timing?: string | null;
  eps_estimate?: number | null;
};

export interface MarketDataProvider {
  readonly name: string;
  getMarketSnapshot(): Promise<MarketSnapshot>;
  getSymbolQuotes(symbols: string[]): Promise<SymbolQuote[]>;
}
