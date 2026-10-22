import axios from "axios";

const client = axios.create({
  baseURL: "/api",
  headers: { Authorization: "Bearer demo" },
});

export default client;

export const api = {
  indices: (region?: string) => client.get("/market/indices", { params: { region } }),
  search: (q: string) => client.get("/search", { params: { q } }),
  quote: (ticker: string) => client.get(`/stocks/${ticker}`),
  history: (ticker: string, range = "6M") => client.get(`/stocks/${ticker}/history`, { params: { range } }),
  technical: (ticker: string, range = "6M") => client.get(`/stocks/${ticker}/technical`, { params: { range } }),
  financials: (ticker: string, period = "annual") => client.get(`/stocks/${ticker}/financials`, { params: { period } }),
  companyNews: (ticker: string) => client.get(`/stocks/${ticker}/news`),
  analyst: (ticker: string) => client.get(`/stocks/${ticker}/analyst`),
  profile: (ticker: string) => client.get(`/company/${ticker}`),
  marketNews: (limit = 30) => client.get("/news", { params: { limit } }),
  sectors: () => client.get("/sectors"),
  portfolio: (currency = "INR") => client.get("/portfolio", { params: { currency } }),
  transactions: (currency = "INR") => client.get("/transactions", { params: { currency } }),
  buy: (payload: { ticker: string; quantity?: number; amount?: number; currency?: string }) =>
    client.post("/orders/buy", payload),
  sell: (payload: { ticker: string; quantity: number; currency?: string }) =>
    client.post("/orders/sell", payload),
  watchlist: () => client.get("/watchlist"),
  addWatchlist: (ticker: string) => client.post("/watchlist", { ticker }),
  removeWatchlist: (ticker: string) => client.delete(`/watchlist/${ticker}`),
  alerts: () => client.get("/alerts"),
  createAlert: (payload: { ticker: string; alert_type: string; threshold?: number; direction?: string }) =>
    client.post("/alerts", payload),
  chat: (message: string, context_ticker?: string) => client.post("/chat", { message, context_ticker }),
};
