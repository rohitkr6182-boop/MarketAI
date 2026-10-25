import { useState } from "react";

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
  const right = 20;
  const top = 20;
  const priceBottom = 258;
  const volumeTop = 294;
  const volumeBottom = 342;
  const dateY = 366;
  const plotWidth = width - left - right;
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const valid = data
    .filter((item) =>
      Number.isFinite(new Date(item.date).getTime()) &&
      [item.open, item.high, item.low, item.close].every(Number.isFinite) &&
      item.high >= item.low
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (!valid.length) {
    return <div className="flex h-[390px] items-center justify-center text-sm text-text2">No valid OHLC price data is available for this range.</div>;
  }

  const intraday = range.toUpperCase() === "1D" && valid.some((item) => item.date.includes("T"));
  const rawMin = Math.min(...valid.map((item) => item.low));
  const rawMax = Math.max(...valid.map((item) => item.high));
  const spread = rawMax - rawMin || Math.max(Math.abs(rawMax) * 0.02, 1);
  const min = rawMin - spread * 0.1;
  const max = rawMax + spread * 0.1;
  const y = (value: number) => priceBottom - ((value - min) / (max - min)) * (priceBottom - top);
  const slot = plotWidth / valid.length;
  const x = (index: number) => left + slot * index + slot / 2;
  const candleWidth = Math.max(2, Math.min(12, slot * 0.62));
  const gridValues = Array.from({ length: 5 }, (_, index) => max - ((max - min) * index) / 4);
  const maxVolume = Math.max(...valid.map((item) => item.volume ?? 0), 1);
  const volumeWidth = Math.max(1.5, Math.min(9, slot * 0.62));
  const labelIndices = Array.from(new Set(
    [0, Math.floor((valid.length - 1) * 0.25), Math.floor((valid.length - 1) * 0.5), Math.floor((valid.length - 1) * 0.75), valid.length - 1],
  ));
  const hovered = hoverIndex == null ? null : valid[hoverIndex];
  const hoveredX = hoverIndex == null ? null : x(hoverIndex);
  const hoveredY = hovered ? y((hovered.open + hovered.close) / 2) : null;
  const tooltipX = hoveredX == null ? 0 : Math.max(left + 4, Math.min(hoveredX - 140, width - right - 286));
  const tooltipY = hoveredY == null ? 0 : Math.max(top + 4, Math.min(hoveredY - 80, priceBottom - 100));
  const hoveredDate = hovered ? (intraday ? formatTime(hovered.date) : shortDate(hovered.date)) : "";
  const upCount = valid.filter((item) => item.close >= item.open).length;

  return (
    <div className="w-full" role="img" aria-label="Stock candlestick chart showing open, high, low, close prices and trading volume">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-3 text-[11px] text-text2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-up" /> Bullish</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-down" /> Bearish</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-sky-400/80" /> Volume</span>
        </div>
        <span>{valid.length} candles · {upCount} higher closes</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[330px] w-full cursor-crosshair sm:h-[390px]"
        preserveAspectRatio="none"
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const chartX = ((event.clientX - rect.left) / rect.width) * width;
          if (chartX < left || chartX > width - right) return;
          const index = Math.max(0, Math.min(valid.length - 1, Math.floor((chartX - left) / slot)));
          setHoverIndex(index);
        }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <clipPath id="candlePriceClip"><rect x={left} y={top} width={plotWidth} height={priceBottom - top} /></clipPath>
        </defs>

        {gridValues.map((value, index) => {
          const yy = y(value);
          return <g key={index}>
            <line x1={left} x2={width - right} y1={yy} y2={yy} stroke="#283247" strokeDasharray="4 5" />
            <text x={left - 10} y={yy + 4} textAnchor="end" fill="#93a0ba" fontSize="12">{formatPrice(value)}</text>
          </g>;
        })}

        <g clipPath="url(#candlePriceClip)">
          {valid.map((item, index) => {
            const cx = x(index);
            const openY = y(item.open);
            const closeY = y(item.close);
            const highY = y(item.high);
            const lowY = y(item.low);
            const up = item.close >= item.open;
            const color = up ? "#28c99a" : "#f16f76";
            const bodyY = Math.min(openY, closeY);
            const bodyHeight = Math.max(Math.abs(closeY - openY), 1.4);
            return <g key={`candle-${item.date}-${index}`}>
              <title>{`${new Date(item.date).toLocaleString()} · O ${formatPrice(item.open)} · H ${formatPrice(item.high)} · L ${formatPrice(item.low)} · C ${formatPrice(item.close)}`}</title>
              <line x1={cx} x2={cx} y1={highY} y2={lowY} stroke={color} strokeWidth={Math.max(1, Math.min(2, slot * 0.12))} />
              <rect x={cx - candleWidth / 2} y={bodyY} width={candleWidth} height={bodyHeight} fill={color} stroke={color} strokeWidth="0.8" rx="0.6" />
            </g>;
          })}
        </g>

        {valid.map((item, index) => {
          const barX = x(index) - volumeWidth / 2;
          const barHeight = ((item.volume ?? 0) / maxVolume) * (volumeBottom - volumeTop);
          const up = item.close >= item.open;
          return <rect key={`volume-${item.date}-${index}`} x={barX} y={volumeBottom - barHeight} width={volumeWidth} height={Math.max(barHeight, 0.5)} fill={up ? "#28c99a" : "#f16f76"} opacity="0.75" rx="0.8">
            <title>{`Volume: ${(item.volume ?? 0).toLocaleString("en-IN")}`}</title>
          </rect>;
        })}

        {hovered && hoveredX != null && hoveredY != null && <>
          <line x1={hoveredX} x2={hoveredX} y1={top} y2={volumeBottom} stroke="#d6deeb" strokeDasharray="4 4" strokeWidth="1.2" opacity="0.8" />
          <circle cx={hoveredX} cy={hoveredY} r="4" fill="#e7ebf3" stroke="#101827" strokeWidth="2" />
          <rect x={tooltipX} y={tooltipY} width="280" height="88" rx="9" fill="#0b1220" stroke="#64748b" strokeWidth="1" opacity="0.98" />
          <text x={tooltipX + 12} y={tooltipY + 17} fill="#e2e8f0" fontSize="12" fontWeight="600">{hoveredDate}</text>
          <text x={tooltipX + 12} y={tooltipY + 36} fill="#cbd5e1" fontSize="11">Open {formatPrice(hovered.open)} · High {formatPrice(hovered.high)}</text>
          <text x={tooltipX + 12} y={tooltipY + 52} fill="#cbd5e1" fontSize="11">Low {formatPrice(hovered.low)} · Close {formatPrice(hovered.close)}</text>
          <text x={tooltipX + 12} y={tooltipY + 70} fill="#94a3b8" fontSize="10">Volume {(hovered.volume ?? 0).toLocaleString("en-IN")}</text>
        </>}

        <line x1={left} x2={width - right} y1={volumeBottom} y2={volumeBottom} stroke="#283247" />
        <text x={left - 10} y={volumeTop + 4} textAnchor="end" fill="#93a0ba" fontSize="11">{maxVolume >= 1_000_000 ? `${(maxVolume / 1_000_000).toFixed(1)}M` : maxVolume >= 1_000 ? `${(maxVolume / 1_000).toFixed(1)}K` : maxVolume.toFixed(0)}</text>
        <text x={left - 10} y={volumeBottom} textAnchor="end" fill="#93a0ba" fontSize="11">0</text>

        {labelIndices.map((index) => <text key={valid[index].date} x={x(index)} y={dateY} textAnchor={index === 0 ? "start" : index === valid.length - 1 ? "end" : "middle"} fill="#93a0ba" fontSize="12">
          {intraday ? formatTime(valid[index].date) : shortDate(valid[index].date)}
        </text>)}
      </svg>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2 px-3 text-[11px] text-text2">
        <span>OHLC candlesticks · volume by candle</span>
        <span>{intraday ? "Times shown in your local time · hover for details" : "Hover over the chart for date, OHLC and volume"}</span>
      </div>
    </div>
  );
}