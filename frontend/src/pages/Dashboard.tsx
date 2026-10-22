import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity, ArrowDownRight, ArrowUpRight, BriefcaseBusiness, Clock3,
  Globe2, RefreshCw, Sparkles, WalletCards, TrendingUp, BarChart3,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import MarketCard from "../components/MarketCard";
import LiveNewsPanel from "../components/LiveNewsPanel";
import SimpleChart from "../components/SimpleChart";
import type { IndexQuote, Portfolio } from "../types";

const ranges = ["1D", "1W", "1M", "3M", "6M", "1Y"];
const symbols = ["TCS", "INFY", "RELIANCE", "HDFCBANK", "AAPL", "MSFT", "NVDA", "GOOGL"];
const indianStocks = ["RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "INFY", "BHARTIARTL", "ITC", "LT"];

const money = (value?: number) =>
  value == null ? "—" : value.toLocaleString("en-IN", { maximumFractionDigits: 2 });

function StatCard({
  label, value, detail, icon: Icon, tone = "amber",
}: {
  label: string; value: string; detail: string; icon: typeof WalletCards;
  tone?: "amber" | "green" | "blue" | "red";
}) {
  const tones = {
    amber: "bg-amber/10 text-amber ring-amber/15",
    green: "bg-up/10 text-up ring-up/15",
    blue: "bg-sky-400/10 text-sky-300 ring-sky-400/15",
    red: "bg-down/10 text-down ring-down/15",
  };
  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs font-medium tracking-wide text-text2">{label}</div>
        <div className={`rounded-xl p-2 ring-1 ${tones[tone]}`}><Icon size={17} /></div>
      </div>
      <div className="mt-4 text-2xl font-semibold tracking-tight text-text tabular-nums">{value}</div>
      <div className="mt-2 text-xs text-text2">{detail}</div>
    </div>
  );
}

export default function Dashboard() {
  const [ticker, setTicker] = useState("TCS");
  const [range, setRange] = useState("6M");
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const indicesQuery = useQuery({
    queryKey: ["indices"],
    queryFn: () => api.indices().then((r) => r.data as IndexQuote[]),
    refetchInterval: 15_000,
  });
  const portfolioQuery = useQuery({
    queryKey: ["portfolio", "INR"],
    queryFn: () => api.portfolio("INR").then((r) => r.data as Portfolio),
  });
  const indianStocksQuery = useQuery({
    queryKey: ["dashboard", "indian-stocks"],
    queryFn: async () => {
      const results = await Promise.allSettled(indianStocks.map(async (symbol) => {
        const response = await api.quote(symbol);
        return response.data as { ticker: string; name: string; price: number; change_pct: number | null; currency: string; source?: string };
      }));
      return results
        .filter((result): result is PromiseFulfilledResult<{ ticker: string; name: string; price: number; change_pct: number | null; currency: string; source?: string }> => result.status === "fulfilled")
        .map((result) => result.value);
    },
    refetchInterval: 15_000,
  });
  const quoteQuery = useQuery({
    queryKey: ["quote", ticker],
    queryFn: () => api.quote(ticker).then((r) => r.data as { ticker: string; price: number; currency: string; source?: string }),
    retry: 1,
    refetchInterval: 15_000,
  });
  const historyQuery = useQuery({
    queryKey: ["history", ticker, range],
    queryFn: () => api.history(ticker, range).then((r) => r.data as { date: string; open: number; high: number; low: number; close: number; volume?: number }[]),
    retry: 1,
    refetchInterval: range === "1D" ? 15_000 : 60_000,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    const updatedAt = Math.max(
      historyQuery.dataUpdatedAt,
      indianStocksQuery.dataUpdatedAt,
      indicesQuery.dataUpdatedAt,
    );
    if (updatedAt > 0) {
      setLastUpdated(new Date(updatedAt));
    }
  }, [
    historyQuery.dataUpdatedAt,
    indianStocksQuery.dataUpdatedAt,
    indicesQuery.dataUpdatedAt,
  ]);

  const portfolio = portfolioQuery.data;
  const history = Array.isArray(historyQuery.data) ? historyQuery.data : [];
  const latest = history[history.length - 1];
  const first = history[0];
  const displayedPrice = latest ? latest.close : quoteQuery.data?.price;
  const displayedPriceLabel = latest
    ? (historyQuery.dataUpdatedAt > 0 ? "Historical close" : "Price")
    : quoteQuery.data?.source === "mock" ? "Demo quote · not live" : quoteQuery.data ? "Latest quote · history unavailable" : "Price unavailable";
  const historyErrorDetail = (historyQuery.error as { response?: { data?: { detail?: string } }; message?: string } | null)?.response?.data?.detail
    ?? (historyQuery.error as { message?: string } | null)?.message;
  const chartChange = history.length > 1 && latest && first ? latest.close - first.close : undefined;
  const chartChangePct = chartChange != null && first?.close ? (chartChange / first.close) * 100 : undefined;
  const greeting = new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening";

  const refreshAll = async () => {
    await Promise.all([indicesQuery.refetch(), portfolioQuery.refetch(), indianStocksQuery.refetch(), historyQuery.refetch()]);
    setLastUpdated(new Date());
  };

  return (
    <div className="dashboard-shell space-y-6">
      <section className="dashboard-hero">
        <div className="relative z-[1] flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber/20 bg-amber/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber">
              <span className="live-dot" /> Market intelligence workspace
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-text sm:text-4xl">Good {greeting}<span className="text-amber">.</span></h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-text2">Your market pulse, portfolio health, and watchlist — all in one place.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-border/80 bg-bg/60 px-3 py-2">
              <div className="flex items-center gap-2 text-xs text-text2"><Clock3 size={14} /> Last refreshed</div>
              <div className="mt-1 text-sm font-medium text-text">{lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
            </div>
            <button onClick={refreshAll} disabled={indicesQuery.isFetching || portfolioQuery.isFetching || historyQuery.isFetching} className="inline-flex items-center gap-2 rounded-xl bg-amber px-4 py-3 text-sm font-semibold text-[#17120a] transition hover:bg-amber/90 disabled:cursor-wait disabled:opacity-60">
              <RefreshCw size={15} className={indicesQuery.isFetching || portfolioQuery.isFetching || historyQuery.isFetching ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>
        <div className="hero-grid" aria-hidden="true" />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="chart-panel min-w-0">
          <div className="flex flex-col gap-4 border-b border-border/70 px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="section-kicker"><Activity size={14} /> PRICE PERFORMANCE</div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <select aria-label="Select stock symbol" value={ticker} onChange={(e) => setTicker(e.target.value)} className="rounded-lg border border-border bg-bgElev px-3 py-2 text-base font-semibold text-text outline-none focus:border-amber">
                  {symbols.map((symbol) => <option key={symbol} value={symbol}>{symbol}</option>)}
                </select>
                <span className="text-xs text-text2">{range} historical view</span>
              </div>
              <div className="mt-3 flex flex-wrap items-baseline gap-3">
                <span className="text-2xl font-semibold tracking-tight text-text tabular-nums">{displayedPrice == null ? "—" : money(displayedPrice)}</span>
                {!latest && displayedPrice != null && <span className="text-[11px] text-text2">{displayedPriceLabel}</span>}
                {chartChangePct != null && (
                  <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ${chartChangePct >= 0 ? "bg-up/10 text-up" : "bg-down/10 text-down"}`}>
                    {chartChangePct >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                    {chartChangePct >= 0 ? "+" : ""}{chartChangePct.toFixed(2)}%
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-text2">{range === "1D" && !indianStocks.includes(ticker) ? "Latest available intraday bars · refreshes every 15 seconds while the page is active" : range === "1D" ? "Daily provider data only for this Indian ticker; intraday history is not available from the current integration" : "Historical closing prices · refreshes every minute"}</p>
            </div>
            <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-bg/60 p-1">
              {ranges.map((item) => (
                <button key={item} onClick={() => setRange(item)} className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${range === item ? "bg-amber text-[#17120a]" : "text-text2 hover:bg-white/5 hover:text-text"}`}>{item}</button>
              ))}
            </div>
          </div>
          <div className="px-2 pb-3 pt-4 sm:px-4">
            {historyQuery.isLoading ? (
              <div className="flex h-[300px] flex-col items-center justify-center gap-3 rounded-xl bg-bgElev/30 text-sm text-text2" role="status" aria-live="polite">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-amber/30 border-t-amber" />
                <p>Loading {ticker} price history ({range})…</p>
                <p className="text-xs">Waiting for the configured market-data provider.</p>
              </div>
            ) : historyQuery.isError ? (
              <div className="flex h-[300px] flex-col items-center justify-center gap-2 text-center text-sm text-text2">
                <BarChart3 size={28} className="text-amber" />
                <p>Could not load historical prices for {ticker} ({range}).</p>
                <p className="max-w-md text-xs">{historyErrorDetail || "The data provider may be unavailable, rejecting its API key, or limiting this request. Check the backend logs for the exact cause."}</p>
                <button onClick={() => historyQuery.refetch()} className="text-amber hover:underline">Try again</button>
              </div>
            ) : history.length ? (
              <SimpleChart data={history} range={range} />
            ) : (
              <div className="flex h-[300px] flex-col items-center justify-center gap-2 text-center text-sm text-text2">
                <BarChart3 size={28} className="text-amber" />
                <p>No historical chart data is available for {ticker} in this range.</p>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 px-5 py-3">
            <span className="text-xs text-text2">Chart refreshes automatically; 1D uses intraday bars where the provider supports them. Prices may be delayed by the data provider.</span>
            <Link to={`/stocks/${ticker}`} className="inline-flex items-center gap-1 text-xs font-semibold text-amber hover:text-amber/80">View {ticker} details <ArrowUpRight size={13} /></Link>
          </div>
        </div>
        <div className="min-w-0 xl:max-h-[540px]">
          <LiveNewsPanel />
        </div>
      </section>


      <section aria-label="Portfolio overview" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Portfolio value" value={portfolio ? `₹${money(portfolio.total_value)}` : "Loading…"} detail="Your total demo account value" icon={WalletCards} tone="amber" />
        <StatCard label="Available cash" value={portfolio ? `₹${money(portfolio.cash_balance)}` : "Loading…"} detail="Available demo buying power" icon={BriefcaseBusiness} tone="blue" />
        <StatCard label="Total profit / loss" value={portfolio ? `${portfolio.total_pl >= 0 ? "+" : "−"}₹${money(Math.abs(portfolio.total_pl))}` : "—"} detail={portfolio ? "Across your demo portfolio" : "Portfolio data unavailable"} icon={portfolio && portfolio.total_pl < 0 ? ArrowDownRight : ArrowUpRight} tone={portfolio && portfolio.total_pl < 0 ? "red" : "green"} />
        <StatCard label="Portfolio return" value={portfolio ? `${portfolio.return_pct >= 0 ? "+" : ""}${portfolio.return_pct.toFixed(2)}%` : "—"} detail="Return on your demo portfolio" icon={TrendingUp} tone={portfolio && portfolio.return_pct < 0 ? "red" : "green"} />
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="section-kicker"><Globe2 size={14} /> MARKET PULSE</div>
            <h2 className="mt-1 text-lg font-semibold text-text">Market overview</h2>
          </div>
          <Link to="/global" className="text-xs font-medium text-amber transition hover:text-amber/80">Explore global markets ↗</Link>
        </div>
        {indicesQuery.isError ? (
          <div className="rounded-xl border border-border bg-bgCard p-4 text-sm text-text2">Market indices are temporarily unavailable. Try refreshing in a moment.</div>
        ) : (indicesQuery.data ?? []).length ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {(indicesQuery.data ?? []).slice(0, 4).map((idx) => <MarketCard key={idx.key} idx={idx} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl border border-border bg-bgCard/80" />)}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="section-kicker"><Activity size={14} /> NSE STOCKS</div>
            <h2 className="mt-1 text-lg font-semibold text-text">Popular Indian stocks</h2>
            <p className="mt-1 text-xs text-text2">Indian equities · INR prices · demo data unless a live provider is configured</p>
          </div>
          <Link to="/markets" className="text-xs font-medium text-amber hover:text-amber/80">Browse markets ↗</Link>
        </div>
        {indianStocksQuery.isError ? (
          <div className="rounded-xl border border-border bg-bgCard p-4 text-sm text-text2">
            Indian stock quotes could not load. Check that the backend is running, then use Refresh.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {indianStocks.map((symbol) => {
              const quote = (indianStocksQuery.data ?? []).find((item) => item.ticker === symbol);
              const up = (quote?.change_pct ?? 0) >= 0;
              return (
                <Link key={symbol} to={`/stocks/${symbol}`} className="stat-card group block">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-text">{symbol}</div>
                      <div className="mt-1 min-h-8 text-xs leading-4 text-text2">{quote?.name ?? (symbol === "TCS" ? "Tata Consultancy Services" : symbol === "INFY" ? "Infosys" : symbol === "RELIANCE" ? "Reliance Industries" : symbol === "HDFCBANK" ? "HDFC Bank" : symbol === "ICICIBANK" ? "ICICI Bank" : symbol === "BHARTIARTL" ? "Bharti Airtel" : symbol === "ITC" ? "ITC Ltd" : symbol === "LT" ? "Larsen & Toubro" : "Infosys")}</div>
                    </div>
                    <span className="rounded-lg bg-white/5 px-2 py-1 text-[10px] font-semibold tracking-wide text-text2">NSE</span>
                  </div>
                  <div className="mt-4 text-xl font-semibold tabular-nums text-text">{quote ? `₹${money(quote.price)}` : indianStocksQuery.isLoading ? "Loading…" : "—"}</div>
                  <div className={`mt-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${up ? "bg-up/10 text-up" : "bg-down/10 text-down"}`}>
                    {quote ? (up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />) : null}
                    {quote ? `${up ? "+" : ""}${(quote.change_pct ?? 0).toFixed(2)}%` : "Quote unavailable"}
                  </div>
                  <div className="mt-3 text-[11px] text-text2 transition group-hover:text-amber">View stock details ↗</div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Link to="/portfolio" className="feature-tile group">
          <div className="feature-icon bg-amber/10 text-amber"><WalletCards size={19} /></div>
          <div className="mt-4 flex items-center justify-between gap-2"><h3 className="font-semibold text-text">Portfolio & trades</h3><ArrowUpRight size={16} className="text-text2 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-amber" /></div>
          <p className="mt-1 text-sm leading-5 text-text2">Review holdings, transactions, and demo performance.</p>
        </Link>
        <Link to="/screener" className="feature-tile group">
          <div className="feature-icon bg-sky-400/10 text-sky-300"><BarChart3 size={19} /></div>
          <div className="mt-4 flex items-center justify-between gap-2"><h3 className="font-semibold text-text">Stock screener</h3><ArrowUpRight size={16} className="text-text2 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-amber" /></div>
          <p className="mt-1 text-sm leading-5 text-text2">Explore stocks and narrow your research with filters.</p>
        </Link>
        <Link to="/ai" className="feature-tile group">
          <div className="feature-icon bg-violet-400/10 text-violet-300"><Sparkles size={19} /></div>
          <div className="mt-4 flex items-center justify-between gap-2"><h3 className="font-semibold text-text">AI market assistant</h3><ArrowUpRight size={16} className="text-text2 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-amber" /></div>
          <p className="mt-1 text-sm leading-5 text-text2">Ask questions about stocks, sectors, and your portfolio.</p>
        </Link>
      </section>
    </div>
  );
}
