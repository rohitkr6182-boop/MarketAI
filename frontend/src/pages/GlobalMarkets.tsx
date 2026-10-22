import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import MarketCard from "../components/MarketCard";
import type { IndexQuote } from "../types";

export default function GlobalMarkets() {
  const { data } = useQuery({ queryKey: ["indices", "all"], queryFn: () => api.indices().then((r) => r.data as IndexQuote[]) });
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Global Markets</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(data ?? []).map((idx) => <MarketCard key={idx.key} idx={idx} />)}
      </div>
      <p className="text-xs text-text2">Simulated index levels — mock data provider.</p>
    </div>
  );
}
