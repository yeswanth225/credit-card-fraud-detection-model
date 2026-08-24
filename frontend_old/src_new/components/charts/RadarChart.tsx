interface RadarChartProps {
  labels: string[];
  values: number[];
  max?: number;
  size?: number;
}

export function RadarChart({ labels, values, max = 1, size = 280 }: RadarChartProps) {
  const center = size / 2;
  const radius = size / 2 - 40;
  const levels = 4;

  const angleStep = (Math.PI * 2) / labels.length;

  const getPoint = (val: number, i: number) => {
    const r = (val / max) * radius;
    const angle = i * angleStep - Math.PI / 2;
    return {
      x: center + Math.cos(angle) * r,
      y: center + Math.sin(angle) * r,
    };
  };

  const getAxisPoint = (i: number, r = radius) => {
    const angle = i * angleStep - Math.PI / 2;
    return {
      x: center + Math.cos(angle) * r,
      y: center + Math.sin(angle) * r,
    };
  };

  const dataPath = values.map((v, i) => {
    const p = getPoint(v, i);
    return `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
  }).join(' ') + ' Z';

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full" style={{ maxWidth: size }}>
      {Array.from({ length: levels }, (_, level) => {
        const r = (radius / levels) * (level + 1);
        const pts = labels.map((_, i) => {
          const p = getAxisPoint(i, r);
          return `${p.x},${p.y}`;
        }).join(' ');
        return <polygon key={level} points={pts} fill="none" stroke="#F4F4F5" strokeWidth={1} />;
      })}

      {labels.map((_, i) => {
        const p = getAxisPoint(i);
        return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#F4F4F5" strokeWidth={1} />;
      })}

      <path d={dataPath} fill="rgba(10,10,10,0.06)" stroke="#0A0A0A" strokeWidth={2} strokeLinejoin="round" />

      {values.map((v, i) => {
        const p = getPoint(v, i);
        return <circle key={i} cx={p.x} cy={p.y} r={3} fill="#0A0A0A" />;
      })}

      {labels.map((label, i) => {
        const p = getAxisPoint(i, radius + 18);
        return (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-ink-500 text-[10px] font-medium"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}
