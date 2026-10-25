import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, BriefcaseBusiness, ChartNoAxesCombined,
  ChevronDown, CircleHelp, Clock3, Globe2, LayoutDashboard, Newspaper, RefreshCw,
  Search, Settings2, Sparkles, Star, Wallet, WalletCards, TrendingUp, BarChart3,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import SimpleChart from "../components/SimpleChart";
import type { IndexQuote, Portfolio } from "../types";

const symbols = ["TCS", "INFY", "RELIANCE", "HDFCBANK", "AAPL", "MSFT", "NVDA", "GOOGL"];
const indianStocks = ["RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "INFY", "BHARTIARTL", "ITC", "LT"];
const ranges = ["1D", "1W", "1M", "3M", "6M", "1Y"];
const money = (value?: number, currency = "INR") => value == null ? "—" : new Intl.NumberFormat(currency === "USD" ? "en-US" : "en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
const shortMoney = (value?: number) => value == null ? "—" : new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);

function Change({ value }: { value?: number | null }) {
  if (value == null) return <span className="text-xs text-text2">—</span>;
  const positive = value >= 0;
  return <span className={`inline-flex items-center gap-1 text-xs font-semibold ${positive ? "text-up" : "text-down"}`}>{positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{positive ? "+" : ""}{value.toFixed(2)}%</span>;
}

function Metric({ label, value, note, icon: Icon, tone = "gold" }: { label: string; value: string; note: string; icon: typeof Wallet; tone?: "gold" | "green" | "blue" | "red" }) {
  const toneClass = { gold: "text-amber bg-amber/10", green: "text-up bg-up/10", blue: "text-sky-300 bg-sky-300/10", red: "text-down bg-down/10" }[tone];
  return <div className="stat-card min-w-0"><div className="flex items-center justify-between gap-2"><span className="text-xs text-text2">{label}</span><span className={`rounded-lg p-2 ${toneClass}`}><Icon size={16} /></span></div><div className="mt-3 truncate text-xl font-semibold tracking-tight text-text tabular-nums">{value}</div><div className="mt-2 text-[11px] text-text2">{note}</div></div>;
}

export default function Dashboard() {
  const [ticker, setTicker] = useState("TCS");
  const [range, setRange] = useState("1M");
  const [search, setSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const indicesQuery = useQuery({ queryKey: ["indices"], queryFn: () => api.indices().then((r) => r.data as IndexQuote[]), refetchInterval: 15000 });
  const portfolioQuery = useQuery({ queryKey: ["portfolio", "INR"], queryFn: () => api.portfolio("INR").then((r) => r.data as Portfolio), refetchInterval: 30000 });
  const indianStocksQuery = useQuery({
    queryKey: ["dashboard", "indian-stocks"],
    queryFn: async () => {
      const results = await Promise.allSettled(indianStocks.map(async (symbol) => {
        const response = await api.quote(symbol);
        return response.data as { ticker: string; name: string; price: number; change_pct: number | null; currency: string; source?: string };
      }));
      return results.filter((r): r is PromiseFulfilledResult<{ ticker: string; name: string; price: number; change_pct: number | null; currency: string; source?: string }> => r.status === "fulfilled").map((r) => r.value);
    }, refetchInterval: 15000,
  });
  const quoteQuery = useQuery({ queryKey: ["quote", ticker], queryFn: () => api.quote(ticker).then((r) => r.data as { ticker: string; price: number; currency: string; source?: string }), retry: 1, refetchInterval: 15000, refetchOnWindowFocus: true, refetchOnReconnect: true });
  const historyQuery = useQuery({ queryKey: ["history", ticker, range], queryFn: () => api.history(ticker, range).then((r) => r.data as { date: string; open: number; high: number; low: number; close: number; volume?: number }[]), retry: 1, refetchInterval: range === "1D" ? 15000 : 60000, refetchIntervalInBackground: false });

  useEffect(() => {
    const stamp = Math.max(quoteQuery.dataUpdatedAt, historyQuery.dataUpdatedAt, indianStocksQuery.dataUpdatedAt, indicesQuery.dataUpdatedAt);
    if (stamp > 0) setLastUpdated(new Date(stamp));
  }, [quoteQuery.dataUpdatedAt, historyQuery.dataUpdatedAt, indianStocksQuery.dataUpdatedAt, indicesQuery.dataUpdatedAt]);

  const portfolio = portfolioQuery.data;
  const history = Array.isArray(historyQuery.data) ? historyQuery.data : [];
  const latest = history[history.length - 1];
  const first = history[0];
  const currentPrice = quoteQuery.data?.price ?? latest?.close;
  const changePct = history.length > 1 && first?.close ? ((latest!.close - first.close) / first.close) * 100 : undefined;
  const holdings = portfolio?.holdings ?? [];
  const allocation = useMemo(() => holdings.map((h) => ({ ticker: h.ticker, value: Number(h.market_value) || 0 })).filter((h) => h.value > 0).sort((a, b) => b.value - a.value).slice(0, 5), [holdings]);
  const allocationTotal = allocation.reduce((sum, h) => sum + h.value, 0);
  const topStocks = [...(indianStocksQuery.data ?? [])].sort((a, b) => (b.change_pct ?? -Infinity) - (a.change_pct ?? -Infinity));
  const filteredStocks = (indianStocksQuery.data ?? []).filter((s) => `${s.ticker} ${s.name}`.toLowerCase().includes(search.toLowerCase()));
  const refreshAll = async () => { await Promise.all([indicesQuery.refetch(), portfolioQuery.refetch(), indianStocksQuery.refetch(), quoteQuery.refetch(), historyQuery.refetch()]); setLastUpdated(new Date()); };
  const errorDetail = (historyQuery.error as { response?: { data?: { detail?: string } }; message?: string } | null)?.response?.data?.detail ?? (historyQuery.error as { message?: string } | null)?.message;

  return (
    <div className="dashboard-shell space-y-5">
      <section className="dashboard-hero !py-5 sm:!py-6">
        <div className="relative z-[1] flex flex-wrap items-center justify-between gap-4">
          <div><div className="section-kicker"><Activity size={14} /> MARKET TERMINAL <span className="live-dot ml-1" /></div><h1 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">Portfolio Manager</h1><p className="mt-1 text-xs text-text2">Your markets, holdings and performance in one workspace.</p></div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex min-w-[210px] items-center gap-2 rounded-xl border border-border bg-bg/80 px-3 py-2.5"><Search size={15} className="text-text2" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assets…" className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text2" /></label>
            <button onClick={refreshAll} disabled={quoteQuery.isFetching || historyQuery.isFetching} className="inline-flex items-center gap-2 rounded-xl border border-border bg-bg/80 px-3 py-2.5 text-sm text-text transition hover:border-amber/40 disabled:opacity-60"><RefreshCw size={15} className={quoteQuery.isFetching || historyQuery.isFetching ? "animate-spin" : ""} /><span className="hidden sm:inline">Refresh</span></button>
            <button aria-label="Notifications" className="rounded-xl border border-border bg-bg/80 p-2.5 text-text2 hover:text-amber"><Bell size={16} /></button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Current balance" value={portfolio ? money(portfolio.total_value) : "Loading…"} note="Paper portfolio value" icon={WalletCards} tone="gold" />
        <Metric label="Today's / total P&L" value={portfolio ? money(portfolio.total_pl) : "—"} note="Across your current holdings" icon={TrendingUp} tone={portfolio && portfolio.total_pl < 0 ? "red" : "green"} />
        <Metric label="Available cash" value={portfolio ? money(portfolio.cash_balance) : "—"} note="Virtual buying power" icon={Wallet} tone="blue" />
        <Metric label="Portfolio return" value={portfolio ? `${portfolio.return_pct >= 0 ? "+" : ""}${portfolio.return_pct.toFixed(2)}%` : "—"} note="Since portfolio inception" icon={ChartNoAxesCombined} tone={portfolio && portfolio.return_pct < 0 ? "red" : "green"} />
      </section>

      <section className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <div className="chart-panel">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/70 px-4 py-4 sm:px-5">
              <div><div className="section-kicker"><ChartNoAxesCombined size={14} /> PRICE PERFORMANCE</div><div className="mt-2 flex flex-wrap items-center gap-3"><select aria-label="Select stock symbol" value={ticker} onChange={(e) => setTicker(e.target.value)} className="rounded-lg border border-border bg-bgElev px-3 py-2 text-sm font-semibold text-text outline-none focus:border-amber">{symbols.map((s) => <option key={s} value={s}>{s}</option>)}</select><span className="text-xs text-text2">{range} price history</span></div><div className="mt-3 flex flex-wrap items-baseline gap-3"><span className="text-2xl font-bold tracking-tight text-text tabular-nums">{currentPrice == null ? "—" : money(currentPrice, quoteQuery.data?.currency === "USD" ? "USD" : "INR")}</span><Change value={changePct} /><span className="text-[11px] text-text2">{quoteQuery.data?.source ? `Source: ${quoteQuery.data.source}` : "Historical price"}</span></div></div>
              <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-bg p-1">{ranges.map((r) => <button key={r} onClick={() => setRange(r)} className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${range === r ? "bg-amber text-[#17120a]" : "text-text2 hover:bg-white/5 hover:text-text"}`}>{r}</button>)}</div>
            </div>
            <div className="px-2 pb-3 pt-3 sm:px-4">
              {historyQuery.isLoading ? <div className="flex h-[300px] items-center justify-center text-sm text-text2">Loading {ticker} history…</div> :
              historyQuery.isError ? <div className="flex h-[300px] flex-col items-center justify-center gap-2 text-center text-sm text-text2"><BarChart3 size={28} className="text-amber" /><p>Could not load historical prices for {ticker}.</p><p className="max-w-md text-xs">{errorDetail || "Check the backend logs and configured market-data provider."}</p><button onClick={() => historyQuery.refetch()} className="rounded-lg bg-amber px-4 py-2 font-semibold text-[#17120a]">Try again</button></div> :
              history.length ? <SimpleChart data={history} range={range} /> : <div className="flex h-[300px] items-center justify-center text-sm text-text2">No historical data available for this symbol.</div>}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 px-4 py-3 text-[11px] text-text2 sm:px-5"><span><Clock3 size={12} className="mr-1 inline" /> Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · data may be delayed</span><Link to={`/stocks/${ticker}`} className="font-semibold text-amber hover:underline">View {ticker} details ↗</Link></div>
          </div>

          <div className="chart-panel overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-4 py-4 sm:px-5"><div><div className="section-kicker"><BriefcaseBusiness size={14} /> YOUR ASSETS</div><h2 className="mt-1 text-base font-semibold text-text">Holdings & positions</h2></div><Link to="/portfolio" className="text-xs font-semibold text-amber hover:underline">Manage portfolio ↗</Link></div>
            <div className="overflow-x-auto"><table className="screener-table w-full min-w-[650px] text-left text-xs"><thead className="text-text2"><tr><th className="px-4 py-3 font-medium">Asset</th><th className="px-3 py-3 text-right font-medium">Quantity</th><th className="px-3 py-3 text-right font-medium">Last price</th><th className="px-3 py-3 text-right font-medium">Market value</th><th className="px-4 py-3 text-right font-medium">P/L</th></tr></thead><tbody>{holdings.slice(0, 7).map((h) => <tr key={h.ticker} className="border-t border-border/50"><td className="px-4 py-3"><Link to={`/stocks/${h.ticker}`} className="flex items-center gap-3 hover:text-amber"><span className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber/15 bg-amber/10 text-[10px] font-bold text-amber">{h.ticker.slice(0, 2)}</span><span><span className="block font-semibold text-text">{h.ticker}</span><span className="block text-[10px] text-text2">Equity</span></span></Link></td><td className="px-3 py-3 text-right tabular-nums text-text2">{h.quantity}</td><td className="px-3 py-3 text-right tabular-nums text-text">{money(h.current_price)}</td><td className="px-3 py-3 text-right tabular-nums text-text">{money(h.market_value)}</td><td className={`px-4 py-3 text-right tabular-nums ${h.pl >= 0 ? "text-up" : "text-down"}`}>{money(h.pl)}<span className="mt-1 block text-[10px]">{h.pl_pct >= 0 ? "+" : ""}{h.pl_pct.toFixed(2)}%</span></td></tr>)}{holdings.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-text2">No holdings yet. Open a stock page to place a paper trade.</td></tr>}</tbody></table></div>
          </div>
        </div>

        <aside className="min-w-0 space-y-4">
          <div className="chart-panel p-4 sm:p-5"><div className="flex items-center justify-between gap-2"><div><div className="section-kicker"><Activity size={13} /> SELECTED ASSET</div><h2 className="mt-2 text-lg font-semibold text-text">{quoteQuery.data?.ticker ?? ticker}</h2><p className="text-xs text-text2">{ticker === "TCS" ? "Tata Consultancy Services" : ticker === "AAPL" ? "Apple Inc." : ticker === "MSFT" ? "Microsoft Corporation" : ticker}</p></div><span className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber/20 bg-amber/10 text-amber"><TrendingUp size={21} /></span></div><div className="mt-4 flex items-baseline gap-2"><span className="text-2xl font-bold text-text tabular-nums">{currentPrice == null ? "—" : money(currentPrice, quoteQuery.data?.currency === "USD" ? "USD" : "INR")}</span><Change value={changePct} /></div><div className="mt-4 grid grid-cols-2 gap-2">{[{ label: "Open", value: latest?.open }, { label: "Day high", value: latest?.high }, { label: "Day low", value: latest?.low }, { label: "Volume", value: latest?.volume }].map((m) => <div key={m.label} className="rounded-xl border border-border/70 bg-bg/50 p-3"><div className="text-[10px] text-text2">{m.label}</div><div className="mt-1 truncate text-sm font-semibold text-text tabular-nums">{m.value == null ? "—" : m.label === "Volume" ? shortMoney(m.value) : money(m.value, quoteQuery.data?.currency === "USD" ? "USD" : "INR")}</div></div>)}</div><Link to={`/stocks/${ticker}`} className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-amber/25 bg-amber/10 px-3 py-2.5 text-xs font-semibold text-amber hover:bg-amber/15">Open asset research <ChevronDown size={14} className="-rotate-90" /></Link></div>

          <div className="chart-panel p-4 sm:p-5"><div className="flex items-center justify-between"><div><div className="section-kicker"><Wallet size={13} /> ASSET ALLOCATION</div><h2 className="mt-1 text-base font-semibold text-text">Portfolio mix</h2></div><Link to="/portfolio" aria-label="View portfolio" className="text-text2 hover:text-amber"><Settings2 size={16} /></Link></div>
            {allocation.length ? <><div className="mt-4 flex items-center gap-4"><div className="relative h-28 w-28 shrink-0 rounded-full" style={{ background: `conic-gradient(${allocation.map((a, i) => { const colors = ["#e8b54a", "#42bd88", "#6aa8e8", "#bc8bf4", "#ed786e"]; const start = allocation.slice(0, i).reduce((sum, x) => sum + x.value, 0) / allocationTotal * 100; const end = (allocation.slice(0, i + 1).reduce((sum, x) => sum + x.value, 0) / allocationTotal) * 100; return `${colors[i % colors.length]} ${start}% ${end}%`; }).join(", ")})` }}><div className="absolute inset-[23%] flex flex-col items-center justify-center rounded-full bg-bgCard"><span className="text-[9px] text-text2">INVESTED</span><span className="text-sm font-bold text-text">{shortMoney(allocationTotal)}</span></div></div><div className="min-w-0 flex-1 space-y-2">{allocation.slice(0, 4).map((a, i) => <div key={a.ticker} className="flex items-center justify-between gap-2 text-[11px]"><span className="flex min-w-0 items-center gap-2 text-text2"><span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: ["#e8b54a", "#42bd88", "#6aa8e8", "#bc8bf4"][i] }} />{a.ticker}</span><span className="font-semibold text-text">{(a.value / allocationTotal * 100).toFixed(1)}%</span></div>)}</div></div></> : <p className="py-7 text-center text-xs text-text2">Add paper holdings to see your allocation.</p>}
          </div>

          <div className="chart-panel p-4 sm:p-5"><div className="flex items-center justify-between"><div><div className="section-kicker"><TrendingUp size={13} /> TOP MOVERS</div><h2 className="mt-1 text-base font-semibold text-text">Market watch</h2></div><Link to="/markets" className="text-[11px] font-semibold text-amber hover:underline">All stocks ↗</Link></div><div className="mt-3 space-y-1">{topStocks.slice(0, 5).map((s) => <Link key={s.ticker} to={`/stocks/${s.ticker}`} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition hover:bg-white/[.035]"><span className="flex min-w-0 items-center gap-2"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[9px] font-bold text-text2">{s.ticker.slice(0, 2)}</span><span className="min-w-0"><span className="block text-xs font-semibold text-text">{s.ticker}</span><span className="block truncate text-[10px] text-text2">{s.name}</span></span></span><span className="text-right"><span className="block text-xs font-medium text-text tabular-nums">{money(s.price)}</span><Change value={s.change_pct} /></span></Link>)}</div></div>
        </aside>
      </section>

      <section className="space-y-3"><div className="flex items-end justify-between gap-3"><div><div className="section-kicker"><Globe2 size={14} /> MARKET INDICES</div><h2 className="mt-1 text-base font-semibold text-text">Market overview</h2></div><Link to="/global" className="text-xs font-semibold text-amber hover:underline">Global markets ↗</Link></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{(indicesQuery.data ?? []).slice(0, 4).map((idx) => <Link key={idx.key} to="/markets" className="stat-card"><div className="flex items-center justify-between gap-2"><span className="text-xs text-text2">{idx.name}</span><ChartNoAxesCombined size={15} className="text-amber" /></div><div className="mt-3 text-lg font-semibold text-text tabular-nums">{idx.value.toLocaleString("en-US", { maximumFractionDigits: 2 })}</div><div className="mt-1"><Change value={idx.change_pct} /></div></Link>)}</div></section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3"><Link to="/screener" className="feature-tile group"><div className="feature-icon bg-amber/10 text-amber"><BarChart3 size={19} /></div><h3 className="mt-3 font-semibold text-text">Market screener</h3><p className="mt-1 text-xs text-text2">Find stocks by price and market movement.</p></Link><Link to="/watchlist" className="feature-tile group"><div className="feature-icon bg-sky-400/10 text-sky-300"><Star size={19} /></div><h3 className="mt-3 font-semibold text-text">Watchlist</h3><p className="mt-1 text-xs text-text2">Keep your important symbols close.</p></Link><Link to="/ai" className="feature-tile group"><div className="feature-icon bg-violet-400/10 text-violet-300"><Sparkles size={19} /></div><h3 className="mt-3 font-semibold text-text">AI research assistant</h3><p className="mt-1 text-xs text-text2">Explore company and sector questions.</p></Link></section>
    </div>
  );
}
