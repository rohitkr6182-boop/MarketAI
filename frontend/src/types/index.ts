export interface Quote {
  ticker: string; name: string; exchange: string; sector: string; currency: string;
  price: number; prev_close: number; change: number; change_pct: number;
  day_high: number; day_low: number; week52_high: number; week52_low: number;
  volume: number; market_cap: number; pe: number; pb: number; eps: number;
  dividend_yield: number; beta: number; source: string;
}

export interface IndexQuote {
  key: string; name: string; value: number; change: number; change_pct: number;
  sparkline: number[]; source: string;
}

export interface NewsItem {
  id: number; headline: string; source: string; ticker: string; sector: string;
  sentiment: "positive" | "neutral" | "negative"; published_at: string;
}

export interface PortfolioHolding {
  ticker: string; quantity: number; avg_buy_price: number; current_price: number;
  market_value: number; pl: number; pl_pct: number;
}

export interface Portfolio {
  cash_balance: number; invested: number; market_value: number; total_value: number;
  total_pl: number; return_pct: number; holdings: PortfolioHolding[]; currency: string;
}

export interface ChatResponse {
  reply: string; tools_used: string[]; data: unknown;
}
