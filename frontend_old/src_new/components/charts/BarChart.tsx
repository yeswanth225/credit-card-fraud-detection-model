import { useState } from 'react';

interface BarChartProps {
  labels: string[];
  values: number[];
  secondaryValues?: number[];
  height?: number;
  formatValue?: (v: number) => string;
  accentColor?: string;
}

export function BarChart({
  labels,
  values,
  secondaryValues,
  height = 240,
  formatValue = (v) => String(v),
  accentColor = '#EF4444',
}: BarChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const width = 800;
  const padding = { top: 20, right: 20, bottom: 40, left: 44 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(...values, ...(secondaryValues ?? []), 1);
  const barWidth = (chartW / labels.length) * 0.6;
  const gap = (chartW / labels.length) * 0.4;
  const groupWidth = chartW / labels.length;

  const tickValues = Array.from({ length: 5 }, (_, i) => (maxVal / 4) * i);

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
        {tickValues.map((tv, i) => {
          const y = padding.top + chartH - (tv / maxVal) * chartH;
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#F4F4F5" strokeWidth={1} />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" className="fill-ink-400 text-[10px]">
                {formatValue(tv)}
              </text>
            </g>
          );
        })}

        {labels.map((label, i) => {
          const x = padding.left + i * groupWidth + gap / 2;
          const val = values[i] ?? 0;
          const barH = (val / maxVal) * chartH;
          const y = padding.top + chartH - barH;
          const isHover = hoverIdx === i;

          return (
            <g key={i} onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)}>
              {secondaryValues && (
                <rect
                  x={x}
                  y={padding.top + chartH - ((secondaryValues[i] ?? 0) / maxVal) * chartH}
                  width={barWidth}
                  height={((secondaryValues[i] ?? 0) / maxVal) * chartH}
                  fill="#E4E4E7"
                  rx={3}
                  className="transition-opacity"
                  style={{ opacity: isHover ? 1 : 0.6 }}
                />
              )}
              <rect
                x={secondaryValues ? x : x + (groupWidth - barWidth) / 2 - gap / 2}
                y={y}
                width={barWidth}
                height={barH}
                fill={accentColor}
                rx={3}
                className="transition-opacity"
                style={{ opacity: isHover ? 1 : 0.85 }}
              />
              <text
                x={padding.left + i * groupWidth + groupWidth / 2}
                y={height - 12}
                textAnchor="middle"
                className="fill-ink-400 text-[10px]"
                transform={labels.length > 6 ? `rotate(-25, ${padding.left + i * groupWidth + groupWidth / 2}, ${height - 12})` : undefined}
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>

      {hoverIdx !== null && (
        <div
          className="pointer-events-none absolute rounded-lg border border-ink-200 bg-white px-3 py-2 shadow-elevated"
          style={{
            left: `${((padding.left + hoverIdx * groupWidth + groupWidth / 2) / width) * 100}%`,
            top: 8,
            transform: 'translateX(-50%)',
          }}
        >
          <p className="mb-1 text-[10px] font-medium text-ink-400">{labels[hoverIdx]}</p>
          <div className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full" style={{ background: accentColor }} />
            <span className="text-ink-500">Fraud:</span>
            <span className="font-medium tabular-nums text-ink-900">{formatValue(values[hoverIdx] ?? 0)}</span>
          </div>
          {secondaryValues && (
            <div className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full bg-ink-200" />
              <span className="text-ink-500">Total:</span>
              <span className="font-medium tabular-nums text-ink-900">{formatValue(secondaryValues[hoverIdx] ?? 0)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
