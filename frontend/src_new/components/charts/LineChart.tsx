import { useState, useMemo } from 'react';

export interface LineChartSeries {
  name: string;
  color: string;
  data: number[];
  dashed?: boolean;
}

interface LineChartProps {
  labels: string[];
  series: LineChartSeries[];
  height?: number;
  formatValue?: (v: number) => string;
}

export function LineChart({ labels, series, height = 240, formatValue = (v) => String(v) }: LineChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const width = 800;
  const padding = { top: 20, right: 20, bottom: 32, left: 44 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const allValues = series.flatMap((s) => s.data);
  const maxVal = Math.max(...allValues, 1);
  const minVal = 0;
  const range = maxVal - minVal || 1;

  const xStep = chartW / Math.max(labels.length - 1, 1);

  const points = useMemo(
    () =>
      series.map((s) =>
        s.data.map((val, i) => ({
          x: padding.left + i * xStep,
          y: padding.top + chartH - ((val - minVal) / range) * chartH,
          val,
        })),
      ),
    [series, xStep, chartH, range, padding.left, padding.top],
  );

  const yTicks = 4;
  const tickValues = Array.from({ length: yTicks + 1 }, (_, i) => (maxVal / yTicks) * i);

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height }}
        onMouseLeave={() => setHoverIdx(null)}
      >
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
          if (labels.length > 15 && i % Math.ceil(labels.length / 8) !== 0 && i !== labels.length - 1) return null;
          const x = padding.left + i * xStep;
          return (
            <text key={i} x={x} y={height - 10} textAnchor="middle" className="fill-ink-400 text-[10px]">
              {label}
            </text>
          );
        })}

        {points.map((pts, si) => {
          const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
          const seriesData = series[si];
          return (
            <g key={si}>
              <path
                d={path}
                fill="none"
                stroke={seriesData.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray={seriesData.dashed ? '4 4' : undefined}
                style={{ transition: 'opacity 0.2s' }}
              />
              {pts.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={hoverIdx === i ? 4 : 0}
                  fill={seriesData.color}
                  className="transition-all"
                />
              ))}
            </g>
          );
        })}

        {hoverIdx !== null && (
          <line
            x1={padding.left + hoverIdx * xStep}
            y1={padding.top}
            x2={padding.left + hoverIdx * xStep}
            y2={padding.top + chartH}
            stroke="#A1A1AA"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}

        {labels.map((_, i) => (
          <rect
            key={i}
            x={padding.left + i * xStep - xStep / 2}
            y={padding.top}
            width={xStep}
            height={chartH}
            fill="transparent"
            onMouseEnter={() => setHoverIdx(i)}
          />
        ))}
      </svg>

      {hoverIdx !== null && (
        <div
          className="pointer-events-none absolute rounded-lg border border-ink-200 bg-white px-3 py-2 shadow-elevated"
          style={{
            left: `${((padding.left + hoverIdx * xStep) / width) * 100}%`,
            top: 8,
            transform: 'translateX(-50%)',
          }}
        >
          <p className="mb-1 text-[10px] font-medium text-ink-400">{labels[hoverIdx]}</p>
          {series.map((s, si) => (
            <div key={si} className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              <span className="text-ink-500">{s.name}:</span>
              <span className="font-medium tabular-nums text-ink-900">{formatValue(s.data[hoverIdx] ?? 0)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
