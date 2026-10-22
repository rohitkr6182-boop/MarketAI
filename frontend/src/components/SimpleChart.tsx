type PriceBar = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

const formatPrice = (value: number) =>
  value.toLocaleString("en-US", { maximumFractionDigits: 2 });

const formatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
};

const shortDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(5, 10);
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", timeZone: "UTC" });
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
  const left = 62;
  const right = 18;
  const top = 18;
  const priceBottom = 250;
  const volumeTop = 292;
  const volumeBottom = 342;
  const dateY = 366;
  const plotWidth = width - left - right;
  if (!data.length) {
    return (
      <div className="flex h-[390px] items-center justify-center text-sm text-text2">
        No historical price data available for this range.
      </div>
    );
  }

  const valid = data
    .filter((item) => Number.isFinite(item.close) && Number.isFinite(new Date(item.date).getTime()))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  if (!valid.length) {
    return (
      <div className="flex h-[390px] items-center justify-center text-sm text-text2">
        Price data is unavailable for this range.
      </div>
    );
  }

  const intraday = range.toUpperCase() === "1D" && valid.some((item) => item.date.includes("T"));
  const prices = valid.map((item) => item.close);
  const rawMin = Math.min(...prices);
  const rawMax = Math.max(...prices);
  const spread = rawMax - rawMin || Math.max(Math.abs(rawMax) * 0.02, 1);
  const min = rawMin - spread * 0.12;
  const max = rawMax + spread * 0.12;
  const y = (value: number) => priceBottom - ((value - min) / (max - min)) * (priceBottom - top);
  const slot = plotWidth / Math.max(valid.length - 1, 1);
  const x = (index: number) => left + slot * index;
  const points = valid.map((item, index) => [x(index), y(item.close)] as const);
  const linePath = points.map(([px, py], index) => `${index === 0 ? "M" : "L"} ${px.toFixed(2)} ${py.toFixed(2)}`).join(" ");
  const areaPath = `${linePath} L ${x(valid.length - 1).toFixed(2)} ${priceBottom} L ${left} ${priceBottom} Z`;
  const gridValues = Array.from({ length: 5 }, (_, index) => max - ((max - min) * index) / 4);
  const maxVolume = Math.max(...valid.map((item) => item.volume ?? 0), 1);
  const volumeSlot = plotWidth / valid.length;
  const volumeWidth = Math.max(1.5, Math.min(8, volumeSlot * 0.62));
  const labelIndices = Array.from(new Set(
    [0, Math.floor((valid.length - 1) * 0.25), Math.floor((valid.length - 1) * 0.5), Math.floor((valid.length - 1) * 0.75), valid.length - 1],
  ));

  return (
    <div className="w-full" role="img" aria-label={intraday ? "Intraday stock price line chart with volume" : "Historical stock price line chart with shaded area and trading volume bars"}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[390px] w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="priceAreaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#28c99a" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#28c99a" stopOpacity="0.015" />
          </linearGradient>
          <clipPath id="pricePlotClip">
            <rect x={left} y={top} width={plotWidth} height={priceBottom - top} />
          </clipPath>
        </defs>

        {gridValues.map((value, index) => {
          const yy = y(value);
          return (
            <g key={index}>
              <line x1={left} x2={width - right} y1={yy} y2={yy} stroke="#283247" strokeDasharray="4 5" />
              <text x={left - 10} y={yy + 4} textAnchor="end" fill="#93a0ba" fontSize="12">{formatPrice(value)}</text>
            </g>
          );
        })}

        <g clipPath="url(#pricePlotClip)">
          <path d={areaPath} fill="url(#priceAreaFill)" />
          <path d={linePath} fill="none" stroke="#35d6a0" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {points.map(([px, py], index) => (
            <circle key={`point-${valid[index].date}`} cx={px} cy={py} r={intraday && index === valid.length - 1 ? 4 : 1.5} fill="#35d6a0">
              <title>{`${new Date(valid[index].date).toLocaleString("en-US", { timeZone: "America/New_York" })} · Price ${formatPrice(valid[index].close)}`}</title>
            </circle>
          ))}
        </g>

        {valid.map((item, index) => {
          const barX = left + volumeSlot * index + (volumeSlot - volumeWidth) / 2;
          const barHeight = ((item.volume ?? 0) / maxVolume) * (volumeBottom - volumeTop);
          const up = item.close >= item.open;
          return (
            <g key={`volume-${item.date}-${index}`}>
              <title>{`${new Date(item.date).toLocaleString("en-US", { timeZone: "America/New_York" })} · Close ${formatPrice(item.close)} · Volume ${(item.volume ?? 0).toLocaleString("en-US")}`}</title>
              <rect
                x={barX}
                y={volumeBottom - barHeight}
                width={volumeWidth}
                height={Math.max(barHeight, 0.5)}
                fill={up ? "#28c99a" : "#f16f76"}
                opacity="0.8"
                rx="0.8"
              />
            </g>
          );
        })}

        <line x1={left} x2={width - right} y1={volumeBottom} y2={volumeBottom} stroke="#283247" />
        <text x={left - 10} y={volumeTop + 4} textAnchor="end" fill="#93a0ba" fontSize="11">{Math.round(maxVolume / 1_000_000)}M</text>
        <text x={left - 10} y={volumeBottom} textAnchor="end" fill="#93a0ba" fontSize="11">0</text>

        {labelIndices.map((index) => (
          <text key={valid[index].date} x={x(index)} y={dateY} textAnchor={index === 0 ? "start" : index === valid.length - 1 ? "end" : "middle"} fill="#93a0ba" fontSize="12">
            {intraday ? formatTime(valid[index].date) : shortDate(valid[index].date)}
          </text>
        ))}
      </svg>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3 px-3 text-[11px] text-text2">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-up" /> Closing price</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-up/80" /> Trading volume</span>
        </div>
        <span>{intraday ? "Times shown in US Eastern time · hover points/bars for details" : "Hover the volume bars for daily close and volume"}</span>
      </div>
    </div>
  );
}
