interface GaugeProps {
  value: number; // 0-100
  color?: string;
  label?: string;
}

export function Gauge({ value, color = '#22C55E', label }: GaugeProps) {
  const radius = 52;
  const circumference = Math.PI * radius;
  const offset = circumference * (1 - value / 100);
  return (
    <div className="relative flex h-32 w-full items-end justify-center">
      <svg viewBox="0 0 140 80" className="h-full w-full">
        <path
          d={`M 18 70 A ${radius} ${radius} 0 0 1 122 70`}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d={`M 18 70 A ${radius} ${radius} 0 0 1 122 70`}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-2 flex flex-col items-center">
        <div className="flex items-baseline gap-0.5">
          <span className="text-3xl font-semibold text-app-ink leading-none">{value}</span>
          <span className="text-sm text-app-muted">%</span>
        </div>
        {label && <div className="mt-1 text-sm font-medium" style={{ color }}>{label}</div>}
      </div>
    </div>
  );
}
