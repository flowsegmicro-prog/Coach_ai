import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatShortDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { AcwrZone } from '@/types';

const ZONE_LABEL: Record<AcwrZone, string> = {
  SOUS_CHARGE: 'Sous-charge',
  OPTIMAL: 'Optimale',
  VIGILANCE: 'Vigilance',
  RISQUE: 'Risque',
};
const ZONE_COLOR: Record<AcwrZone, string> = {
  SOUS_CHARGE: 'bg-app-bg text-app-muted',
  OPTIMAL: 'bg-ok/10 text-ok',
  VIGILANCE: 'bg-warn/10 text-warn',
  RISQUE: 'bg-danger/10 text-danger',
};

export default function Analyses() {
  const { data, isLoading } = useQuery({ queryKey: ['weekly', 12], queryFn: () => api.weekly(12) });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-app-ink">Analyses</h1>
        <p className="mt-1 text-sm text-app-muted">Récapitulatif hebdomadaire de tes 12 dernières semaines.</p>
      </div>

      <div className="card overflow-hidden">
        {isLoading || !data ? (
          <div className="p-6 text-sm text-app-muted">Chargement…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-app-border bg-app-bg/60 text-xs uppercase text-app-muted">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Semaine</th>
                <th className="px-4 py-3 text-right font-medium">Séances</th>
                <th className="px-4 py-3 text-right font-medium">Charge totale</th>
                <th className="px-4 py-3 text-right font-medium">Monotonie</th>
                <th className="px-4 py-3 text-right font-medium">Contrainte</th>
                <th className="px-4 py-3 text-right font-medium">RCAC fin</th>
                <th className="px-4 py-3 text-right font-medium">Zone</th>
              </tr>
            </thead>
            <tbody>
              {data.weekly.map((row) => (
                <tr key={row.weekStart} className="border-b border-app-border/60 last:border-0">
                  <td className="px-4 py-3 text-app-ink">
                    {formatShortDate(row.weekStart)} → {formatShortDate(row.weekEnd)}
                  </td>
                  <td className="px-4 py-3 text-right">{row.sessionCount}</td>
                  <td className="px-4 py-3 text-right font-medium">{row.totalLoad} UA</td>
                  <td className="px-4 py-3 text-right">{row.monotony ?? '—'}</td>
                  <td className="px-4 py-3 text-right">{row.strain}</td>
                  <td className="px-4 py-3 text-right">{row.endOfWeekAcwr ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    {row.endOfWeekAcwrZone ? (
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', ZONE_COLOR[row.endOfWeekAcwrZone])}>
                        {ZONE_LABEL[row.endOfWeekAcwrZone]}
                      </span>
                    ) : (
                      <span className="text-app-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
