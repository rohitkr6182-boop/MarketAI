import type { IndexQuote } from "../types";

export default function MarketCard({ idx }: { idx: IndexQuote }) {
  const up = idx.change_pct >= 0;
  return (
    <div className="card flex flex-col gap-1 min-w-[150px]">
      <span className="text-xs text-text2">{idx.name}</span>
      <span className="text-lg font-semibold tabular-nums">{idx.value.toLocaleString()}</span>
      <span className={up ? "pill-pos w-fit" : "pill-neg w-fit"}>
        {up ? "+" : ""}{idx.change_pct.toFixed(2)}%
      </span>
    </div>
  );
}
