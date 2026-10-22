import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Portfolio as PortfolioT } from "../types";

export default function Portfolio() {
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["portfolio", currency],
    queryFn: () => api.portfolio(currency).then((r) => r.data as PortfolioT),
    refetchInterval: 30_000,
  });
  const { data: txs, isLoading: txLoading, isError: txError } = useQuery({
    queryKey: ["transactions", currency],
    queryFn: () => api.transactions(currency).then((r) => r.data),
    refetchInterval: 30_000,
  });

  const money = (value: number) => new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency", currency, maximumFractionDigits: 2,
  }).format(value);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">My Paper Portfolio</h1>
          <p className="mt-1 text-xs text-text2">Virtual trading account · values refresh every 30 seconds</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-bg p-1">
          {(["INR", "USD"] as const).map((item) => (
            <button key={item} onClick={() => setCurrency(item)} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${currency === item ? "bg-amber text-black" : "text-text2 hover:text-text"}`}>{item}</button>
          ))}
          <button onClick={() => refetch()} className="rounded-md px-3 py-1.5 text-xs text-text2 hover:text-text">Refresh</button>
        </div>
      </div>

      {isLoading && !data && <p className="text-sm text-text2">Loading {currency} portfolio…</p>}
      {isError && !data && <div role="alert" className="card text-sm text-down">Could not load your portfolio. Check that the backend and market-data provider are available, then retry.</div>}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              ["Total Value", data.total_value], ["Invested", data.invested], ["Cash", data.cash_balance],
              ["Total P/L", data.total_pl], ["Return", data.return_pct],
            ].map(([label, raw]) => {
              const value = Number(raw);
              return (
                <div key={String(label)} className="card">
                  <div className="text-xs text-text2">{label}</div>
                  <div className="mt-1 text-sm font-medium tabular-nums">{label === "Return" ? `${value.toFixed(2)}%` : money(value)}</div>
                </div>
              );
            })}
          </div>

          <div className="card overflow-x-auto">
            <h2 className="mb-2 text-sm font-semibold text-text2">Holdings · {currency}</h2>
            <table className="w-full min-w-[640px] text-xs">
              <thead><tr className="text-text2"><th className="py-2 text-left">Ticker</th><th>Qty</th><th>Avg Price</th><th>Current</th><th>Value</th><th>P/L</th></tr></thead>
              <tbody>
                {data.holdings.map((h) => (
                  <tr key={h.ticker} className="border-t border-border/50">
                    <td className="py-2">{h.ticker}</td>
                    <td className="text-center">{h.quantity}</td>
                    <td className="text-center">{money(h.avg_buy_price)}</td>
                    <td className="text-center">{money(h.current_price)}</td>
                    <td className="text-center">{money(h.market_value)}</td>
                    <td className={`text-center ${h.pl >= 0 ? "text-up" : "text-down"}`}>{money(h.pl)} ({h.pl_pct.toFixed(2)}%)</td>
                  </tr>
                ))}
                {data.holdings.length === 0 && <tr><td colSpan={6} className="py-3 text-center text-text2">No holdings in your {currency} account yet. Place a paper trade from a stock page.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="card overflow-x-auto">
            <h2 className="mb-2 text-sm font-semibold text-text2">Transaction History · {currency}</h2>
            {txError && <p role="alert" className="text-sm text-down">Could not load transaction history.</p>}
            <table className="w-full min-w-[640px] text-xs">
              <thead><tr className="text-text2"><th className="py-2 text-left">Date</th><th>Side</th><th>Stock ID</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead>
              <tbody>
                {(txs ?? []).map((t: any) => (
                  <tr key={t.id} className="border-t border-border/50">
                    <td className="py-2">{t.executed_at ? new Date(t.executed_at).toLocaleString() : "—"}</td>
                    <td className={t.side === "BUY" ? "text-up" : "text-down"}>{t.side}</td>
                    <td className="text-center">{t.stock_id}</td>
                    <td className="text-center">{t.quantity}</td>
                    <td className="text-center">{money(t.price)}</td>
                    <td className="text-center">{money(t.amount)}</td>
                  </tr>
                ))}
                {!txLoading && (!txs || txs.length === 0) && <tr><td colSpan={6} className="py-3 text-center text-text2">No transactions in this account yet.</td></tr>}
                {txLoading && <tr><td colSpan={6} className="py-3 text-center text-text2">Loading transactions…</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
