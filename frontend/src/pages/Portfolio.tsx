import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Portfolio as PortfolioT } from "../types";

export default function Portfolio() {
  const { data } = useQuery({ queryKey: ["portfolio", "INR"], queryFn: () => api.portfolio("INR").then((r) => r.data as PortfolioT) });
  const { data: txs } = useQuery({ queryKey: ["transactions", "INR"], queryFn: () => api.transactions("INR").then((r) => r.data) });

  if (!data) return <p className="text-text2">Loading…</p>;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-lg font-semibold">My Portfolio</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          ["Total Value", data.total_value], ["Invested", data.invested], ["Cash", data.cash_balance],
          ["Total P/L", data.total_pl], ["Return %", data.return_pct + "%"],
        ].map(([label, val]) => (
          <div key={label as string} className="card">
            <div className="text-xs text-text2">{label}</div>
            <div className="text-sm font-medium">{typeof val === "number" ? val.toLocaleString() : val}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-text2 mb-2">Holdings</h2>
        <table className="w-full text-xs">
          <thead><tr className="text-text2"><th className="text-left py-1">Ticker</th><th>Qty</th><th>Avg Price</th><th>Current</th><th>Value</th><th>P/L</th></tr></thead>
          <tbody>
            {data.holdings.map((h) => (
              <tr key={h.ticker} className="border-t border-border/50">
                <td className="py-1">{h.ticker}</td>
                <td className="text-center">{h.quantity}</td>
                <td className="text-center">{h.avg_buy_price}</td>
                <td className="text-center">{h.current_price}</td>
                <td className="text-center">{h.market_value.toLocaleString()}</td>
                <td className={`text-center ${h.pl >= 0 ? "text-up" : "text-down"}`}>{h.pl >= 0 ? "+" : ""}{h.pl} ({h.pl_pct}%)</td>
              </tr>
            ))}
            {data.holdings.length === 0 && <tr><td colSpan={6} className="text-text2 py-3 text-center">No holdings yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-text2 mb-2">Transaction History</h2>
        <table className="w-full text-xs">
          <thead><tr className="text-text2"><th className="text-left py-1">Date</th><th>Side</th><th>Stock ID</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead>
          <tbody>
            {(txs ?? []).map((t: any) => (
              <tr key={t.id} className="border-t border-border/50">
                <td className="py-1">{t.executed_at?.slice(0, 16).replace("T", " ")}</td>
                <td className={t.side === "BUY" ? "text-up" : "text-down"}>{t.side}</td>
                <td className="text-center">{t.stock_id}</td>
                <td className="text-center">{t.quantity}</td>
                <td className="text-center">{t.price}</td>
                <td className="text-center">{t.amount}</td>
              </tr>
            ))}
            {(!txs || txs.length === 0) && <tr><td colSpan={6} className="text-text2 py-3 text-center">No transactions yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
