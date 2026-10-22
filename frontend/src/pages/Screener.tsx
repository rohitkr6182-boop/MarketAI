import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Quote } from "../types";

type SortKey = "change_pct" | "price" | "market_cap" | "ticker";
type SearchResult = { ticker: string; name: string; exchange: string; sector: string };

const POPULAR = ["TCS", "INFY", "RELIANCE", "HDFCBANK", "AAPL", "MSFT", "NVDA", "GOOGL"];

export default function Screener() {
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("All sectors");
  const [direction, setDirection] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("change_pct");

  const { data: stocks = [], isLoading, isError } = useQuery({
    queryKey: ["screener", search.trim().toUpperCase()],
    queryFn: async () => {
      const q = search.trim();
      const results = q
        ? (await api.search(q)).data as SearchResult[]
        : POPULAR.map((ticker) => ({ ticker, name: ticker, exchange: "", sector: "" }));
      const quotes = await Promise.all(
        results.map(async (item) => {
          try {
            return (await api.quote(item.ticker)).data as Quote;
          } catch {
            return null;
          }
        }),
      );
      return quotes.filter((quote): quote is Quote => quote !== null);
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const sectors = useMemo(
    () => ["All sectors", ...Array.from(new Set(stocks.map((stock) => stock.sector))).sort()],
    [stocks],
  );

  const filtered = useMemo(() => stocks
    .filter((stock) => sector === "All sectors" || stock.sector === sector)
    .filter((stock) => direction === "all" || (direction === "gainers" ? stock.change_pct >= 0 : stock.change_pct < 0))
    .sort((a, b) => {
      if (sortBy === "ticker") return a.ticker.localeCompare(b.ticker);
      return b[sortBy] - a[sortBy];
    }), [stocks, sector, direction, sortBy]);

  const money = (value: number, currency: string) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">Stock Screener</h1>
        <p className="text-sm text-text2 mt-1">Search stocks, compare price movement, and filter by sector. Data availability depends on your configured market provider.</p>
      </div>

      <div className="card grid grid-cols-1 md:grid-cols-4 gap-3">
        <label className="flex flex-col gap-1 text-xs text-text2 md:col-span-2">
          Search by ticker or company
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Try TCS, Apple, or Reliance"
            className="rounded-md border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-amber"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-text2">
          Sector
          <select value={sector} onChange={(event) => setSector(event.target.value)} className="rounded-md border border-border bg-bg px-3 py-2 text-sm text-text">
            {sectors.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-text2">
          Daily movement
          <select value={direction} onChange={(event) => setDirection(event.target.value)} className="rounded-md border border-border bg-bg px-3 py-2 text-sm text-text">
            <option value="all">All stocks</option>
            <option value="gainers">Gainers</option>
            <option value="losers">Losers</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-text2">
          Sort results
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortKey)} className="rounded-md border border-border bg-bg px-3 py-2 text-sm text-text">
            <option value="change_pct">Daily change (%)</option>
            <option value="market_cap">Market capitalization</option>
            <option value="price">Share price</option>
            <option value="ticker">Ticker (A–Z)</option>
          </select>
        </label>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-text2">{filtered.length} stock{filtered.length === 1 ? "" : "s"} matched</p>
        <span className="text-xs text-text2">Refreshes every 30 seconds</span>
      </div>

      {isLoading && <p className="text-sm text-text2">Loading stock data…</p>}
      {isError && <p role="alert" className="card text-sm text-down">Could not load stocks. Check that the MarketAI API is running, then try again.</p>}
      {!isLoading && !isError && filtered.length === 0 && (
        <div className="card text-sm text-text2">{search ? "No stocks matched that search. Try a ticker such as TCS or AAPL." : "No stocks match these filters."}</div>
      )}

      {filtered.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs text-text2 border-b border-border">
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
                <th className="px-4 py-3 text-right font-medium">Change</th>
                <th className="px-4 py-3 font-medium">Sector</th>
                <th className="px-4 py-3 text-right font-medium">Market cap</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((stock) => (
                <tr key={stock.ticker} className="border-b border-border/60 last:border-0 hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <Link to={`/stocks/${stock.ticker}`} className="font-medium hover:text-amber">{stock.ticker}</Link>
                    <div className="text-xs text-text2">{stock.name}</div>
                    <div className="text-[11px] text-text2">{stock.exchange}</div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{money(stock.price, stock.currency)}</td>
                  <td className={`px-4 py-3 text-right tabular-nums ${stock.change_pct >= 0 ? "text-up" : "text-down"}`}>
                    {stock.change_pct >= 0 ? "+" : ""}{stock.change_pct.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-text2">{stock.sector}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 2 }).format(stock.market_cap)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-text2">MarketAI is an educational paper-trading project. Quotes may be simulated demo data and are not investment advice.</p>
    </div>
  );
}
