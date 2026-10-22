import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { NewsItem } from "../types";

const pillClass: Record<string, string> = { positive: "pill-pos", neutral: "pill-neu", negative: "pill-neg" };

export default function LiveNewsPanel() {
  const { data } = useQuery({
    queryKey: ["news", "market"],
    queryFn: () => api.marketNews(12).then((r) => r.data as NewsItem[]),
    refetchInterval: 20_000,
  });

  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-text2 tracking-wide">🔴 LIVE NEWS</span>
      </div>
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
        {(data ?? []).map((n) => (
          <div key={n.id} className="text-sm border-b border-border/60 pb-2 last:border-0">
            <div className="flex items-center gap-2 text-xs text-text2 mb-0.5">
              <span>{new Date(n.published_at).toTimeString().slice(0, 5)}</span>
              <span className={pillClass[n.sentiment]}>{n.sentiment}</span>
            </div>
            <div>{n.headline}</div>
            <div className="text-xs text-text2 mt-0.5">{n.source} • {n.ticker}</div>
          </div>
        ))}
      </div>
      <a href="/news" className="text-xs text-amber mt-2">View all →</a>
    </div>
  );
}
