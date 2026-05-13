import { useQuery } from '@tanstack/react-query';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '@/lib/api';
import { formatShortDate } from '@/lib/utils';

export default function LoadPerformance() {
  const { data, isLoading } = useQuery({
    queryKey: ['history', 90],
    queryFn: () => api.history(90),
  });
  const { data: weekly } = useQuery({ queryKey: ['weekly', 12], queryFn: () => api.weekly(12) });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-app-ink">Charge & performance</h1>
        <p className="mt-1 text-sm text-app-muted">Analyse longue durée de ton entraînement.</p>
      </div>

      <div className="card p-5">
        <h2 className="mb-4 text-base font-semibold">RCAC sur 90 jours</h2>
        {isLoading || !data ? (
          <div className="h-[260px] flex items-center justify-center text-app-muted text-sm">Chargement…</div>
        ) : (
          <div className="h-[280px] w-full">
            <ResponsiveContainer>
              <LineChart
                data={data.daily.map((d) => ({
                  date: d.date,
                  acwr: d.chronicLoad && d.chronicLoad > 0 ? d.acuteLoad / d.chronicLoad : null,
                }))}
                margin={{ top: 10, right: 16, bottom: 0, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d: string) => formatShortDate(d)}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis domain={[0, 2]} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: '#E2E8F0', fontSize: 12 }}
                  formatter={(v: number) => [v.toFixed(2), 'RCAC']}
                  labelFormatter={(d: string) => formatShortDate(d)}
                />
                <ReferenceArea y1={0.8} y2={1.3} fill="#22C55E" fillOpacity={0.1} />
                <ReferenceLine y={1.5} stroke="#EF4444" strokeDasharray="4 2" />
                <Line
                  type="monotone"
                  dataKey="acwr"
                  stroke="#6366F1"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="card p-5">
        <h2 className="mb-4 text-base font-semibold">Modèle de Banister</h2>
        {isLoading || !data ? (
          <div className="h-[280px] flex items-center justify-center text-app-muted text-sm">Chargement…</div>
        ) : (
          <div className="h-[320px] w-full">
            <ResponsiveContainer>
              <LineChart data={data.daily} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
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
                  formatter={(v: number, name: string) => {
                    const labels: Record<string, string> = {
                      fitness: 'Fitness',
                      fatigue: 'Fatigue',
                      form: 'Forme',
                    };
                    return [Math.round(v), labels[name] ?? name];
                  }}
                  labelFormatter={(d: string) => formatShortDate(d)}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, color: '#64748B' }}
                  formatter={(name) => {
                    const map: Record<string, string> = { fitness: 'Fitness', fatigue: 'Fatigue', form: 'Forme' };
                    return map[name] ?? name;
                  }}
                />
                <Line type="monotone" dataKey="fitness" stroke="#22C55E" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="fatigue" stroke="#F59E0B" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="form" stroke="#6366F1" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="card p-5">
        <h2 className="mb-4 text-base font-semibold">Monotonie & contrainte hebdomadaires</h2>
        {!weekly ? (
          <div className="h-[240px] flex items-center justify-center text-app-muted text-sm">Chargement…</div>
        ) : (
          <div className="h-[260px] w-full">
            <ResponsiveContainer>
              <LineChart data={weekly.weekly} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="weekStart"
                  tickFormatter={(d: string) => formatShortDate(d)}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: '#E2E8F0', fontSize: 12 }}
                  labelFormatter={(d: string) => formatShortDate(d)}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, color: '#64748B' }}
                  formatter={(name) => (name === 'monotony' ? 'Monotonie' : 'Contrainte')}
                />
                <ReferenceLine yAxisId="left" y={2} stroke="#EF4444" strokeDasharray="4 2" />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="monotony"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="strain"
                  stroke="#6366F1"
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
