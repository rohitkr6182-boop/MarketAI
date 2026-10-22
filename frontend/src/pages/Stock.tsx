import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import SimpleChart from "../components/SimpleChart";
import TradeModal from "../components/TradeModal";
import type { Quote } from "../types";

export default function Stock() {
  const { ticker = "" } = useParams();
  const qc = useQueryClient();
  const [modal, setModal] = useState<"BUY" | "SELL" | null>(null);
  const [range, setRange] = useState("6M");

  const { data: quote } = useQuery({ queryKey: ["quote", ticker], queryFn: () => api.quote(ticker).then((r) => r.data as Quote), refetchInterval: 10_000 });
  const { data: history } = useQuery({ queryKey: ["history", ticker, range], queryFn: () => api.history(ticker, range).then((r) => r.data) });
  const { data: technical } = useQuery({ queryKey: ["technical", ticker], queryFn: () => api.technical(ticker).then((r) => r.data) });
  const { data: financials } = useQuery({ queryKey: ["financials", ticker], queryFn: () => api.financials(ticker).then((r) => r.data) });
  const { data: news } = useQuery({ queryKey: ["news", ticker], queryFn: () => api.companyNews(ticker).then((r) => r.data) });
  const { data: profile } = useQuery({ queryKey: ["profile", ticker], queryFn: () => api.profile(ticker).then((r) => r.data) });
  const { data: analyst } = useQuery({ queryKey: ["analyst", ticker], queryFn: () => api.analyst(ticker).then((r) => r.data).catch(() => null) });

  if (!quote) return <p className="text-text2">Loading…</p>;

  const latestRsi = technical?.rsi?.filter((v: number | null) => v != null).slice(-1)[0];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{quote.ticker} <span className="text-text2 font-normal text-sm">{quote.name}</span></h1>
          <p className="text-text2 text-xs">{quote.sector} • {quote.exchange}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-semibold tabular-nums">{quote.price} {quote.currency}</span>
            <span className={quote.change_pct >= 0 ? "pill-pos" : "pill-neg"}>{quote.change_pct >= 0 ? "+" : ""}{quote.change_pct}%</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => api.addWatchlist(ticker)} className="text-xs bg-white/5 rounded-md px-3 py-2">⭐ Watchlist</button>
          <button onClick={() => setModal("BUY")} className="text-xs bg-up/20 text-up rounded-md px-3 py-2 font-medium">BUY</button>
          <button onClick={() => setModal("SELL")} className="text-xs bg-down/20 text-down rounded-md px-3 py-2 font-medium">SELL</button>
        </div>
      </div>

      <div className="card">
        <div className="flex gap-1 mb-2 text-xs">
          {["1D", "1W", "1M", "6M", "1Y", "5Y", "MAX"].map((r) => (
            <button key={r} onClick={() => setRange(r)} className={`px-2 py-1 rounded ${range === r ? "bg-amber/20 text-amber" : "bg-white/5 text-text2"}`}>{r}</button>
          ))}
        </div>
        {history && <SimpleChart data={history as any} />}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ["Day High", quote.day_high ?? "—"], ["Day Low", quote.day_low ?? "—"], ["Prev Close", quote.prev_close ?? "—"],
          ["52W High", quote.week52_high ?? "—"], ["52W Low", quote.week52_low ?? "—"],
          ["Volume", quote.volume == null ? "—" : quote.volume.toLocaleString()],
          ["Market Cap", quote.market_cap == null ? "—" : quote.market_cap.toLocaleString()], ["P/E", quote.pe ?? "—"],
        ].map(([label, val]) => (
          <div key={label as string} className="card py-2">
            <div className="text-xs text-text2">{label}</div>
            <div className="text-sm font-medium">{val}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-text2 mb-2">Technical Analysis</h2>
        {latestRsi != null && (
          <p className="text-sm">
            RSI: <b>{latestRsi}</b> — {latestRsi >= 70 ? "overbought territory (momentum strongly positive)"
              : latestRsi <= 30 ? "oversold territory (momentum strongly negative)"
              : "a neutral-to-moderate reading"}. This alone does not predict future price movement.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="text-sm font-semibold text-text2 mb-2">Company Profile</h2>
          {profile && (
            <ul className="text-sm flex flex-col gap-1">
              <li>Founded: {profile.founded_year}</li>
              <li>HQ: {profile.headquarters}</li>
              <li>CEO: {profile.ceo}</li>
              <li>Employees: {profile.employees?.toLocaleString()}</li>
              <li className="text-text2 text-xs mt-1">{profile.description}</li>
              <li className="text-text3 text-xs">Demo data — last updated {profile.last_updated?.slice(0, 10)}</li>
            </ul>
          )}
        </div>
        <div className="card">
          <h2 className="text-sm font-semibold text-text2 mb-2">Analyst Ratings (external opinion)</h2>
          {analyst ? (
            <p className="text-sm">Buy {analyst.buy} • Hold {analyst.hold} • Sell {analyst.sell} — target avg {analyst.target_avg}</p>
          ) : <p className="text-text2 text-sm">No analyst data.</p>}
        </div>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-text2 mb-2">Financials (Annual)</h2>
        <table className="w-full text-xs">
          <thead><tr className="text-text2"><th className="text-left py-1">Period</th><th>Revenue</th><th>Net Income</th><th>EPS</th></tr></thead>
          <tbody>
            {(financials ?? []).map((f: any) => (
              <tr key={f.fiscal_period} className="border-t border-border/50">
                <td className="py-1">{f.fiscal_period}</td>
                <td className="text-center">{f.revenue.toLocaleString()}</td>
                <td className="text-center">{f.net_income.toLocaleString()}</td>
                <td className="text-center">{f.eps}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-text2 mb-2">Latest {ticker} News</h2>
        <div className="flex flex-col gap-2">
          {(news ?? []).map((n: any) => (
            <div key={n.id} className="text-sm border-b border-border/50 pb-2 last:border-0">
              <div className="text-text2 text-xs">{new Date(n.published_at).toTimeString().slice(0, 5)} • {n.source} • {n.sentiment}</div>
              {n.headline}
            </div>
          ))}
        </div>
      </div>

      {modal && (
        <TradeModal quote={quote} side={modal} onClose={() => setModal(null)} onDone={() => qc.invalidateQueries()} />
      )}
    </div>
  );
}
