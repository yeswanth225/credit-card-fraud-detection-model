interface GaugeProps {
  value: number;
  size?: number;
  label?: string;
}

export function ConfidenceGauge({ value, size = 160, label = 'Confidence' }: GaugeProps) {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - value * circumference;
  const center = size / 2;

  const color = value > 0.75 ? '#0A0A0A' : value > 0.5 ? '#52525B' : '#A1A1AA';

  return (
    <div className="relative flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#E4E4E7"
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums text-ink-950">
          {(value * 100).toFixed(1)}%
        </span>
        <span className="mt-0.5 text-xs font-medium text-ink-500">{label}</span>
      </div>
    </div>
  );
}

interface RadialProgressProps {
  value: number;
  max?: number;
  size?: number;
  label: string;
  sublabel?: string;
}

export function RadialProgress({ value, max = 1, size = 120, label, sublabel }: RadialProgressProps) {
  const pct = Math.min(value / max, 1);
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - pct * circumference;
  const center = size / 2;

  return (
    <div className="relative flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#E4E4E7" strokeWidth={stroke} />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#0A0A0A"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold tabular-nums text-ink-950">
          {(pct * 100).toFixed(1)}%
        </span>
        {sublabel && <span className="text-[10px] text-ink-400">{sublabel}</span>}
      </div>
      <span className="mt-2 text-xs font-medium text-ink-600">{label}</span>
    </div>
  );
}
