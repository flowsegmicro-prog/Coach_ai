import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { HistoryPoint } from '@/types';
import { formatShortDate } from '@/lib/utils';

export function FormChart({ data }: { data: HistoryPoint[] }) {
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="form-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22C55E" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => formatShortDate(d)}
            tick={{ fontSize: 11, fill: '#64748B' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11, fill: '#64748B' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ borderRadius: 12, borderColor: '#E2E8F0', fontSize: 12 }}
            formatter={(value: number) => [`${value}%`, 'État de forme']}
            labelFormatter={(d: string) => formatShortDate(d)}
          />
          <Area
            type="monotone"
            dataKey="formPercentage"
            stroke="#22C55E"
            strokeWidth={2}
            fill="url(#form-fill)"
            connectNulls
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
