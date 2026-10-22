import { useState } from "react";
import { api } from "../api/client";
import type { Quote } from "../types";

export default function TradeModal({
  quote, side, onClose, onDone,
}: { quote: Quote; side: "BUY" | "SELL"; onClose: () => void; onDone: () => void }) {
  const [mode, setMode] = useState<"qty" | "amount">("amount");
  const [value, setValue] = useState("10000");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const qty = mode === "qty" ? Number(value) : Number(value) / quote.price;
  const total = qty * quote.price;

  async function confirm() {
    setSubmitting(true);
    setError(null);
    try {
      if (side === "BUY") {
        await api.buy({
          ticker: quote.ticker,
          quantity: mode === "qty" ? Number(value) : undefined,
          amount: mode === "amount" ? Number(value) : undefined,
          currency: quote.currency,
        });
      } else {
        await api.sell({ ticker: quote.ticker, quantity: qty, currency: quote.currency });
      }
      onDone();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? "Order failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="card w-[360px]">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">{side} {quote.ticker} (Paper)</h3>
          <button onClick={onClose} className="text-text2">✕</button>
        </div>
        <div className="text-sm text-text2 mb-2">Current price: {quote.price} {quote.currency}</div>
        <div className="flex gap-2 mb-2 text-xs">
          <button onClick={() => setMode("amount")} className={`px-2 py-1 rounded ${mode === "amount" ? "bg-amber/20 text-amber" : "bg-white/5"}`}>By amount</button>
          <button onClick={() => setMode("qty")} className={`px-2 py-1 rounded ${mode === "qty" ? "bg-amber/20 text-amber" : "bg-white/5"}`}>By quantity</button>
        </div>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full bg-bg border border-border rounded-md px-3 py-2 mb-2 text-sm"
          placeholder={mode === "amount" ? "Amount" : "Quantity"}
        />
        <div className="text-xs text-text2 mb-3">
          Est. quantity: {qty.toFixed(4)} • Est. total: {total.toFixed(2)} {quote.currency}
        </div>
        {error && <div className="text-down text-xs mb-2">{error}</div>}
        <button
          onClick={confirm}
          disabled={submitting || !value}
          className="w-full bg-amber text-black rounded-md py-2 text-sm font-medium disabled:opacity-50"
        >
          {submitting ? "Placing..." : `CONFIRM PAPER ${side}`}
        </button>
        <p className="text-[10px] text-text2 mt-2">Virtual money only. No real trades are ever placed.</p>
      </div>
    </div>
  );
}
