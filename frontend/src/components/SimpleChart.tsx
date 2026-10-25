import { useMemo, useState } from "react";

type PriceBar = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

const formatPrice = (value: number) =>
  value.toLocaleString("en-IN", { maximumFractionDigits: 2 });

const formatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

const shortDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(5, 10);
  return date.toLocaleDateString("en-IN", { month: "short", day: "2-digit", timeZone: "UTC" });
};

export default function SimpleChart({
  data,
  range = "6M",
}: {
  data: PriceBar[];
  range?: string;
}) {
  const width = 1000;
  const height = 390;
  const left = 76;
  const right = 22;
  const top = 22;
  const priceBottom = 264;
  const volumeTop = 300;
  const volumeBottom = 344;
  const dateY = 368;
  const plotWidth = width - left - right;
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const valid = useMemo(
    () => data
      .filter((item) =>
        Number.isFinite(new Date(item.date).getTime()) &&
        [item.open, item.high, item.low, item.close].every(Number.isFinite)
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [data],
  );

  if (!valid.length) {
    return <div className="flex h-[390px] items-center justify-center text-sm text-text2">No valid price data is available for this range.</div>;
  }

  // Daily providers often serialize dates as midnight timestamps (e.g. 2026-10-22T00:00:00).
  // Those are daily bars, not intraday ticks, so don't label them all as 12:00 AM.
  const hasRealIntradayTimes = valid.some((item) => {
    const match = item.date.match(/[T ](\\d{2}):(\\d{2})/);
    return Boolean(match && (Number(match[1]) !== 0 || Number(match[2]) !== 0));
  });
  const intraday = range.toUpperCase() === "1D" && hasRealIntradayTimes;
  const rawMin = Math.min(...valid.map((item) => item.close));
  const rawMax = Math.max(...valid.map((item) => item.close));
  const spread = rawMax - rawMin || Math.max(Math.abs(rawMax) * 0.02, 1);
  const min = rawMin - spread * 0.12;
  const max = rawMax + spread * 0.12;
  const y = (value: number) => priceBottom - ((value - min) / (max - min)) * (priceBottom - top);
  const slot = plotWidth / Math.max(valid.length - 1, 1);
  const x = (index: number) => valid.length === 1 ? left + plotWidth / 2 : left + slot * index;
  const points = valid.map((item, index) => ({ x: x(index), y: y(item.close), item }));
  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${priceBottom} L ${points[0].x} ${priceBottom} Z`;
  const gridValues = Array.from({ length: 5 }, (_, index) => max - ((max - min) * index) / 4);
  const maxVolume = Math.max(...valid.map((item) => item.volume ?? 0), 1);
  const volumeWidth = Math.max(1.5, Math.min(9, plotWidth / valid.length * 0.55));
  const labelIndices = Array.from(new Set(
    [0, Math.floor((valid.length - 1) * 0.25), Math.floor((valid.length - 1) * 0.5), Math.floor((valid.length - 1) * 0.75), valid.length - 1],
  ));
  const hovered = hoverIndex == null ? null : valid[hoverIndex];
  const hoveredX = hoverIndex == null ? null : x(hoverIndex);
  const hoveredY = hovered ? y(hovered.close) : null;
  const tooltipX = hoveredX == null ? 0 : Math.max(left + 4, Math.min(hoveredX - 140, width - right - 286));
  const tooltipY = hoveredY == null ? 0 : Math.max(top + 4, Math.min(hoveredY - 84, priceBottom - 100));
  const hoveredDate = hovered ? (intraday ? formatTime(hovered.date) : shortDate(hovered.date)) : "";

  return (
    <div className="w-full" role="img" aria-label="Stock price line chart with gold price line, shaded price area, volume bars, and hover details">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-3 text-[11px] text-text2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-amber-400" /> Closing price</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-sky-400/80" /> Volume</span>
        </div>
        <span>{valid.length} price points</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[330px] w-full cursor-crosshair sm:h-[390px]"
        preserveAspectRatio="none"
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const chartX = ((event.clientX - rect.left) / rect.width) * width;
          if (chartX < left || chartX > width - right) return;
          const index = valid.length === 1
            ? 0
            : Math.max(0, Math.min(valid.length - 1, Math.round((chartX - left) / slot)));
          setHoverIndex(index);
        }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="goldPriceArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d7a83f" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#d7a83f" stopOpacity="0.015" />
          </linearGradient>
          <clipPath id="priceAreaClip"><rect x={left} y={top} width={plotWidth} height={priceBottom - top} /></clipPath>
        </defs>

        {gridValues.map((value, index) => {
          const yy = y(value);
          return <g key={index}>
            <line x1={left} x2={width - right} y1={yy} y2={yy} stroke="#342d20" strokeDasharray="4 5" />
            <text x={left - 10} y={yy + 4} textAnchor="end" fill="#a7a19a" fontSize="12">{formatPrice(value)}</text>
          </g>;
        })}

        <g clipPath="url(#priceAreaClip)">
          <path d={areaPath} fill="url(#goldPriceArea)" />
          <path d={linePath} fill="none" stroke="#d7a83f" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {points.map((point, index) => (
            <circle key={`point-${point.item.date}-${index}`} cx={point.x} cy={point.y} r={hoverIndex === index ? 5 : 0} fill="#f1d28a" stroke="#171717" strokeWidth="2">
              <title>{`${shortDate(point.item.date)} · ${formatPrice(point.item.close)}`}</title>
            </circle>
          ))}
        </g>

        {valid.map((item, index) => {
          const barX = x(index) - volumeWidth / 2;
          const barHeight = ((item.volume ?? 0) / maxVolume) * (volumeBottom - volumeTop);
          return <rect key={`volume-${item.date}-${index}`} x={barX} y={volumeBottom - barHeight} width={volumeWidth} height={Math.max(barHeight, 0.5)} fill="#b88c32" opacity="0.7" rx="0.8">
            <title>{`Volume: ${(item.volume ?? 0).toLocaleString("en-IN")}`}</title>
          </rect>;
        })}

        {hovered && hoveredX != null && hoveredY != null && <>
          <line x1={hoveredX} x2={hoveredX} y1={top} y2={volumeBottom} stroke="#d7a83f" strokeDasharray="4 4" strokeWidth="1.2" opacity="0.9" />
          <line x1={left} x2={width - right} y1={hoveredY} y2={hoveredY} stroke="#d7a83f" strokeDasharray="3 5" strokeWidth="1" opacity="0.5" />
          <circle cx={hoveredX} cy={hoveredY} r="5" fill="#f1d28a" stroke="#171717" strokeWidth="2" />
          <rect x={tooltipX} y={tooltipY} width="280" height="72" rx="9" fill="#111111" stroke="#65532d" strokeWidth="1" opacity="0.98" />
          <text x={tooltipX + 12} y={tooltipY + 18} fill="#f1f0eb" fontSize="12" fontWeight="600">{hoveredDate}</text>
          <text x={tooltipX + 12} y={tooltipY + 39} fill="#d7a83f" fontSize="13" fontWeight="600">Close {formatPrice(hovered.close)}</text>
          <text x={tooltipX + 12} y={tooltipY + 57} fill="#a7a19a" fontSize="10">Volume {(hovered.volume ?? 0).toLocaleString("en-IN")}</text>
        </>}

        <line x1={left} x2={width - right} y1={volumeBottom} y2={volumeBottom} stroke="#342d20" />
        <text x={left - 10} y={volumeTop + 4} textAnchor="end" fill="#a7a19a" fontSize="11">{maxVolume >= 1_000_000 ? `${(maxVolume / 1_000_000).toFixed(1)}M` : maxVolume >= 1_000 ? `${(maxVolume / 1_000).toFixed(1)}K` : maxVolume.toFixed(0)}</text>
        <text x={left - 10} y={volumeBottom} textAnchor="end" fill="#a7a19a" fontSize="11">0</text>

        {labelIndices.map((index) => <text key={valid[index].date} x={x(index)} y={dateY} textAnchor={index === 0 ? "start" : index === valid.length - 1 ? "end" : "middle"} fill="#a7a19a" fontSize="12">
          {intraday ? formatTime(valid[index].date) : shortDate(valid[index].date)}
        </text>)}
      </svg>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2 px-3 text-[11px] text-text2">
        <span>Gold closing-price graph · volume by period</span>
        <span>{intraday ? "Times shown in local time · hover for details" : "Hover over the graph for date, closing price and volume"}</span>
      </div>
    </div>
  );
}
