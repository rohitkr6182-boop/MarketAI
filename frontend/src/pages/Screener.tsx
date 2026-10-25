import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownRight, ArrowUpRight, BarChart3, Search, SlidersHorizontal,
  RefreshCw, TrendingUp, TrendingDown, X, Activity,
} from "lucide-react";
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

  const { data: stocks = [], isLoading, isError, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["screener", search.trim().toUpperCase()],
    queryFn: async () => {
      const q = search.trim();
      const results = q
        ? (await api.search(q)).data as SearchResult[]
        : POPULAR.map((ticker) => ({ ticker, name: ticker, exchange: "", sector: "" }));
      const quotes = await Promise.all(results.map(async (item) => {
        try {
          return (await api.quote(item.ticker)).data as Quote;
        } catch {
          return null;
        }
      }));
      return quotes.filter((quote): quote is Quote => quote !== null);
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const sectors = useMemo(
    () => ["All sectors", ...Array.from(new Set(stocks.map((stock) => stock.sector).filter(Boolean))).sort()],
    [stocks],
  );

  const filtered = useMemo(() => stocks
    .filter((stock) => sector === "All sectors" || stock.sector === sector)
    .filter((stock) => direction === "all" || (direction === "gainers" ? stock.change_pct >= 0 : stock.change_pct < 0))
    .sort((a, b) => {
      if (sortBy === "ticker") return a.ticker.localeCompare(b.ticker);
      return (Number(b[sortBy]) || 0) - (Number(a[sortBy]) || 0);
    }), [stocks, sector, direction, sortBy]);

  const money = (value: number, currency: string) => {
    try {
      return new Intl.NumberFormat("en-IN", { style: "currency", currency: currency || "USD", maximumFractionDigits: 2 }).format(value);
    } catch {
      return `${currency || ""} ${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
    }
  };
  const compact = (value: number) => value > 0
    ? new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 2 }).format(value)
    : "—";

  return (
    <div className="space-y-6">
      <section className="dashboard-hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="relative z-[1] flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber/20 bg-amber/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[.16em] text-amber">
              <SlidersHorizontal size={13} /> Research tools
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-text sm:text-4xl">Stock screener<span className="text-amber">.</span></h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-text2">Find companies, compare market movement, and narrow your research with clear, live-query filters.</p>
          </div>
          <button onClick={() => refetch()} disabled={isFetching} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-bg/70 px-4 py-3 text-sm font-semibold text-text transition hover:border-amber/40 hover:text-amber disabled:opacity-60">
            <RefreshCw size={15} className={isFetching ? "animate-spin" : ""} /> Refresh quotes
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Screener summary">
        <div className="stat-card">
          <div className="flex items-center justify-between text-xs text-text2"><span>Matching stocks</span><BarChart3 size={16} className="text-amber" /></div>
          <div className="mt-3 text-2xl font-semibold tabular-nums text-text">{filtered.length}</div>
          <div className="mt-1 text-xs text-text2">Based on current filters</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between text-xs text-text2"><span>Gainers in results</span><TrendingUp size={16} className="text-up" /></div>
          <div className="mt-3 text-2xl font-semibold tabular-nums text-text">{stocks.filter((stock) => stock.change_pct > 0).length}</div>
          <div className="mt-1 text-xs text-text2">Positive reported daily change</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between text-xs text-text2"><span>Losers in results</span><TrendingDown size={16} className="text-down" /></div>
          <div className="mt-3 text-2xl font-semibold tabular-nums text-text">{stocks.filter((stock) => stock.change_pct < 0).length}</div>
          <div className="mt-1 text-xs text-text2">Negative reported daily change</div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-bgCard/90 p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-text"><SlidersHorizontal size={16} className="text-amber" /> Screen and filter</div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="flex flex-col gap-2 text-xs font-medium text-text2 xl:col-span-2">
            Search by ticker or company
            <span className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text2" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try TCS, Apple, or Reliance" className="screener-input pl-10 pr-10" />
              {search && <button type="button" aria-label="Clear search" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-text2 hover:text-text"><X size={15} /></button>}
            </span>
          </label>
          <label className="flex flex-col gap-2 text-xs font-medium text-text2">
            Sector
            <select value={sector} onChange={(event) => setSector(event.target.value)} className="screener-input">
              {sectors.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-xs font-medium text-text2">
            Daily movement
            <select value={direction} onChange={(event) => setDirection(event.target.value)} className="screener-input">
              <option value="all">Gainers and losers</option>
              <option value="gainers">Gainers only</option>
              <option value="losers">Losers only</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-xs font-medium text-text2">
            Sort results
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortKey)} className="screener-input">
              <option value="change_pct">Daily change (%)</option>
              <option value="market_cap">Market capitalization</option>
              <option value="price">Share price</option>
              <option value="ticker">Ticker (A–Z)</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-4 text-xs text-text2">
          <span>{search ? `Search: “${search}”` : "Popular market watch"} · {filtered.length} result{filtered.length === 1 ? "" : "s"}</span>
          <button onClick={() => { setSearch(""); setSector("All sectors"); setDirection("all"); setSortBy("change_pct"); }} className="font-semibold text-amber hover:text-amber/80">Reset filters</button>
        </div>
      </section>

      {isError && <div role="alert" className="rounded-xl border border-down/25 bg-down/5 p-4 text-sm text-down">Could not load stocks. Check that the MarketAI API is running, then try again.</div>}
      {isLoading && <div className="rounded-xl border border-border bg-bgCard p-8 text-center text-sm text-text2"><RefreshCw size={18} className="mx-auto mb-3 animate-spin text-amber" />Loading market quotes…</div>}
      {!isLoading && !isError && filtered.length === 0 && (
        <div className="rounded-xl border border-border bg-bgCard p-8 text-center">
          <Search size={22} className="mx-auto mb-3 text-text2" />
          <p className="font-medium text-text">No matching stocks</p>
          <p className="mt-1 text-sm text-text2">Try another search or reset your filters.</p>
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-border bg-bgCard/90">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
            <div><h2 className="font-semibold text-text">Market results</h2><p className="mt-1 text-xs text-text2">Quotes refresh automatically every 30 seconds.</p></div>
            <div className="flex items-center gap-2 text-xs text-text2"><span className="live-dot" /> {isFetching ? "Updating quotes…" : "Auto refresh enabled"}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="screener-table w-full min-w-[720px] text-sm">
              <thead><tr className="border-b border-border text-left text-[10px] font-bold uppercase tracking-[.13em] text-text2">
                <th className="px-5 py-4">Company</th><th className="px-5 py-4 text-right">Last price</th><th className="px-5 py-4 text-right">Day change</th><th className="px-5 py-4">Sector</th><th className="px-5 py-4 text-right">Market cap</th><th className="px-5 py-4 text-right"> </th>
              </tr></thead>
              <tbody>
                {filtered.map((stock) => {
                  const up = stock.change_pct >= 0;
                  return <tr key={stock.ticker} className="border-b border-border/60 last:border-0">
                    <td className="px-5 py-4">
                      <Link to={`/stocks/${stock.ticker}`} className="group flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-bg text-[10px] font-bold text-text2">{stock.ticker.slice(0, 4)}</span>
                        <span className="min-w-0"><span className="block font-semibold text-text group-hover:text-amber">{stock.ticker}</span><span className="mt-0.5 block max-w-[220px] truncate text-xs text-text2">{stock.name}</span><span className="mt-0.5 block text-[10px] text-text2">{stock.exchange || "Market listing"}</span></span>
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-right font-medium tabular-nums text-text">{money(stock.price, stock.currency)}</td>
                    <td className="px-5 py-4 text-right"><span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold tabular-nums ${up ? "bg-up/10 text-up" : "bg-down/10 text-down"}`}>{up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{up ? "+" : ""}{stock.change_pct.toFixed(2)}%</span></td>
                    <td className="px-5 py-4 text-xs text-text2">{stock.sector || "—"}</td>
                    <td className="px-5 py-4 text-right tabular-nums text-text2">{compact(stock.market_cap)}</td>
                    <td className="px-5 py-4 text-right"><Link to={`/stocks/${stock.ticker}`} className="text-xs font-semibold text-amber hover:text-amber/80">Details ↗</Link></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3 text-[11px] text-text2">
            <span className="inline-flex items-center gap-2"><Activity size={13} /> {dataUpdatedAt ? `Last updated ${new Date(dataUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Waiting for first quote"}</span>
            <span>Quotes depend on the configured provider and may be delayed or demo data.</span>
          </div>
        </section>
      )}

      <p className="text-xs leading-5 text-text2">MarketAI is an educational market research and paper-trading project. Verify quote source and exchange session before making decisions; this screener is not investment advice.</p>
    </div>
  );
}