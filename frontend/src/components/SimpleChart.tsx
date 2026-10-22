type Candle = { date: string; open: number; high: number; low: number; close: number; volume?: number };

const formatPrice = (value: number) => value.toLocaleString("en-IN", { maximumFractionDigits: 2 });

export default function SimpleChart({ data }: { data: Candle[] }) {
  const width = 1000;
  const height = 320;
  const left = 18;
  const right = 18;
  const top = 18;
  const bottom = 34;
  const plotHeight = height - top - bottom;
  const values = data.flatMap((item) => [item.high, item.low]).filter(Number.isFinite);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || Math.max(Math.abs(max) * 0.02, 1);
  const y = (value: number) => top + ((max + spread * 0.04 - value) / (spread * 1.08)) * plotHeight;
  const plotWidth = width - left - right;
  const slot = plotWidth / Math.max(data.length, 1);
  const candleWidth = Math.max(2, Math.min(12, slot * 0.62));
  const gridValues = Array.from({ length: 5 }, (_, i) => max + spread * 0.04 - (spread * 1.08 * i) / 4);

  if (!data.length) return <div className="flex h-[320px] items-center justify-center text-sm text-text2">No candle data available.</div>;

  return (
    <div className="w-full" role="img" aria-label="Candlestick price chart showing open, high, low, and close prices">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[320px] w-full" preserveAspectRatio="none">
        {gridValues.map((value, index) => {
          const yy = y(value);
          return (
            <g key={index}>
              <line x1={left} x2={width - right} y1={yy} y2={yy} stroke="#283247" strokeDasharray="4 5" />
              <text x={left + 2} y={yy - 4} fill="#93a0ba" fontSize="11">{formatPrice(value)}</text>
            </g>
          );
        })}
        {data.map((item, index) => {
          const cx = left + slot * index + slot / 2;
          const isUp = item.close >= item.open;
          const color = isUp ? "#28c99a" : "#f16f76";
          const bodyTop = Math.min(y(item.open), y(item.close));
          const bodyHeight = Math.max(2, Math.abs(y(item.open) - y(item.close)));
          return (
            <g key={`${item.date}-${index}`} tabIndex={0}>
              <title>{`${item.date.slice(0, 10)} · O ${formatPrice(item.open)} · H ${formatPrice(item.high)} · L ${formatPrice(item.low)} · C ${formatPrice(item.close)}${item.volume != null ? ` · Volume ${item.volume.toLocaleString("en-IN")}` : ""}`}</title>
              <line x1={cx} x2={cx} y1={y(item.high)} y2={y(item.low)} stroke={color} strokeWidth="1.5" />
              <rect x={cx - candleWidth / 2} y={bodyTop} width={candleWidth} height={bodyHeight} fill={isUp ? color : color} stroke={color} rx="0.6" />
            </g>
          );
        })}
        {data.filter((_, index) => index === 0 || index === data.length - 1 || index % Math.max(1, Math.floor(data.length / 5)) === 0).map((item) => {
          const index = data.indexOf(item);
          const cx = left + slot * index + slot / 2;
          return <text key={item.date} x={cx} y={height - 10} textAnchor="middle" fill="#93a0ba" fontSize="11">{item.date.slice(5, 10)}</text>;
        })}
      </svg>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 px-3 text-[11px] text-text2">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-up" /> Bullish close</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-down" /> Bearish close</span>
        </div>
        <span>Hover a candle for OHLC values</span>
      </div>
    </div>
  );
}
