import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { NewsItem } from "../types";

const pillClass: Record<string, string> = { positive: "pill-pos", neutral: "pill-neu", negative: "pill-neg" };

export default function NewsPage() {
  const { data } = useQuery({ queryKey: ["news", "all"], queryFn: () => api.marketNews(60).then((r) => r.data as NewsItem[]) });
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-lg font-semibold">Live News</h1>
      {(data ?? []).map((n) => (
        <div key={n.id} className="card">
          <div className="flex items-center gap-2 text-xs text-text2 mb-1">
            <span>{new Date(n.published_at).toTimeString().slice(0, 5)}</span>
            <span className={pillClass[n.sentiment]}>{n.sentiment}</span>
            <span>{n.source}</span>
            <span>• {n.ticker} • {n.sector}</span>
          </div>
          <div className="text-sm">{n.headline}</div>
        </div>
      ))}
    </div>
  );
}
