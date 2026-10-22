import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import MarketCard from "../components/MarketCard";
import LiveNewsPanel from "../components/LiveNewsPanel";
import SimpleChart from "../components/SimpleChart";
import type { IndexQuote, Portfolio } from "../types";

export default function Dashboard() {
  const { data: indices } = useQuery({
    queryKey: ["indices"],
    queryFn: () => api.indices().then((r) => r.data as IndexQuote[]),
    refetchInterval: 15_000,
  });
  const { data: portfolio } = useQuery({
    queryKey: ["portfolio", "INR"],
    queryFn: () => api.portfolio("INR").then((r) => r.data as Portfolio),
  });
  const { data: history } = useQuery({
    queryKey: ["history", "TCS"],
    queryFn: () => api.history("TCS", "6M").then((r) => r.data),
  });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">Good {new Date().getHours() < 17 ? "afternoon" : "evening"}</h1>
        <p className="text-text2 text-sm">
          Demo cash: {portfolio?.cash_balance?.toLocaleString() ?? "…"} INR • Portfolio: {portfolio?.total_value?.toLocaleString() ?? "…"} INR
        </p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {(indices ?? []).map((idx) => <MarketCard key={idx.key} idx={idx} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="card">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-semibold text-text2">TCS — 6M</h2>
            <Link to="/stocks/TCS" className="text-xs text-amber">Open company page →</Link>
          </div>
          {history && <SimpleChart data={history as any} />}
        </div>
        <LiveNewsPanel />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="text-sm font-semibold text-text2 mb-2">AI MARKET ASSISTANT</h2>
          <p className="text-sm text-text2 mb-2">Ask about any stock, sector, or your portfolio.</p>
          <Link to="/ai" className="text-amber text-sm">Open AI Assistant →</Link>
        </div>
        <div className="card">
          <h2 className="text-sm font-semibold text-text2 mb-2">MY PORTFOLIO</h2>
          {portfolio ? (
            <div className="text-sm flex flex-col gap-1">
              <div>Total value: <b>{portfolio.total_value.toLocaleString()} INR</b></div>
              <div className={portfolio.total_pl >= 0 ? "text-up" : "text-down"}>
                P/L: {portfolio.total_pl >= 0 ? "+" : ""}{portfolio.total_pl.toLocaleString()} ({portfolio.return_pct.toFixed(2)}%)
              </div>
              <Link to="/portfolio" className="text-amber text-xs mt-1">View portfolio →</Link>
            </div>
          ) : <p className="text-text2 text-sm">Loading…</p>}
        </div>
      </div>
    </div>
  );
}
