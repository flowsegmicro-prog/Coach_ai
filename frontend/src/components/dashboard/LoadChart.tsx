import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { HistoryPoint } from '@/types';
import { formatShortDate } from '@/lib/utils';

interface Props {
  data: HistoryPoint[];
}

export function LoadChart({ data }: Props) {
  // Build optimal band (CC * 0.8 to CC * 1.3) — we display it as the area between two derived series
  const chartData = data.map((d) => {
    const lower = d.chronicLoad !== null ? d.chronicLoad * 0.8 : null;
    const upper = d.chronicLoad !== null ? d.chronicLoad * 1.3 : null;
    return {
      ...d,
      bandLower: lower,
      bandHeight: lower !== null && upper !== null ? upper - lower : null,
    };
  });

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer>
        <ComposedChart data={chartData} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => formatShortDate(d)}
            tick={{ fontSize: 11, fill: '#64748B' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 12, borderColor: '#E2E8F0', fontSize: 12 }}
            formatter={(value: number, name: string) => {
              const labels: Record<string, string> = {
                acuteLoad: 'Charge aiguë',
                chronicLoad: 'Charge chronique',
              };
              return [Math.round(value), labels[name] ?? name];
            }}
            labelFormatter={(d: string) => formatShortDate(d)}
          />
          <Legend
            verticalAlign="top"
            height={28}
            iconType="circle"
            wrapperStyle={{ fontSize: 12, color: '#64748B' }}
            formatter={(name) => {
              const map: Record<string, string> = {
                acuteLoad: 'Charge aiguë',
                chronicLoad: 'Charge chronique',
                bandHeight: 'Emprise optimale',
              };
              return map[name] ?? name;
            }}
          />
          {/* Optimal band rendered as stacked invisible+visible Area pair */}
          <Area
            type="monotone"
            dataKey="bandLower"
            stackId="band"
            stroke="none"
            fill="transparent"
            isAnimationActive={false}
            legendType="none"
          />
          <Area
            type="monotone"
            dataKey="bandHeight"
            stackId="band"
            stroke="none"
            fill="#22C55E"
            fillOpacity={0.12}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="chronicLoad"
            stroke="#94A3B8"
            strokeWidth={2}
            dot={{ r: 3, fill: '#94A3B8' }}
            connectNulls
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="acuteLoad"
            stroke="#2563EB"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#2563EB' }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
