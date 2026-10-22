import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { Quote } from "../types";

export default function Watchlist() {
  const { data } = useQuery({ queryKey: ["watchlist"], queryFn: () => api.watchlist().then((r) => r.data as Quote[]) });
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Watchlist</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(data ?? []).map((q) => (
          <Link to={`/stocks/${q.ticker}`} key={q.ticker} className="card flex justify-between items-center hover:bg-bgHover">
            <div>
              <div className="font-medium">{q.ticker}</div>
              <div className="text-xs text-text2">{q.name}</div>
            </div>
            <div className="text-right">
              <div className="tabular-nums">{q.price}</div>
              <div className={q.change_pct >= 0 ? "pill-pos" : "pill-neg"}>{q.change_pct >= 0 ? "+" : ""}{q.change_pct}%</div>
            </div>
          </Link>
        ))}
        {data && data.length === 0 && <p className="text-text2 text-sm">No stocks in your watchlist yet.</p>}
      </div>
    </div>
  );
}
