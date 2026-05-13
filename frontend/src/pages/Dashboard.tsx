import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Bell, Calendar, ChevronRight, Moon, Sparkles, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Gauge } from '@/components/dashboard/Gauge';
import { Sparkline } from '@/components/dashboard/Sparkline';
import { LoadChart } from '@/components/dashboard/LoadChart';
import { FormChart } from '@/components/dashboard/FormChart';
import { DISCIPLINE_COLOR, DISCIPLINE_ICON, DISCIPLINE_LABEL } from '@/lib/discipline';
import { cn, formatDateFr, formatDateTimeFr } from '@/lib/utils';
import { generateInsight } from '@/lib/insight';
import type { AcwrZone } from '@/types';

const ACWR_ZONE_COLOR: Record<AcwrZone, string> = {
  SOUS_CHARGE: 'text-app-muted',
  OPTIMAL: 'text-ok',
  VIGILANCE: 'text-warn',
  RISQUE: 'text-danger',
};
const ACWR_ZONE_LABEL: Record<AcwrZone, string> = {
  SOUS_CHARGE: 'Sous-charge',
  OPTIMAL: 'Optimale',
  VIGILANCE: 'Vigilance',
  RISQUE: 'Risque élevé',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [historyRange, setHistoryRange] = useState<7 | 30>(7);

  const dashQ = useQuery({ queryKey: ['dashboard'], queryFn: api.dashboard });
  const histQ = useQuery({
    queryKey: ['history', historyRange],
    queryFn: () => api.history(historyRange),
  });
  const formHistQ = useQuery({ queryKey: ['history', 30], queryFn: () => api.history(30) });

  if (dashQ.isLoading || !dashQ.data) {
    return <div className="text-app-muted">Chargement du dashboard…</div>;
  }
  if (dashQ.isError) {
    return <div className="text-danger">Erreur de chargement.</div>;
  }

  const m = dashQ.data;
  const gaugeColor =
    m.formStatus === 'EN_FORME' ? '#22C55E' : m.formStatus === 'NEUTRE' ? '#F59E0B' : '#EF4444';
  const formLabel =
    m.formStatus === 'EN_FORME' ? 'En forme' : m.formStatus === 'NEUTRE' ? 'Neutre' : 'Fatigué';

  // Fatigue % normalized: scale current fatigue to peak fatigue in history (sparkline)
  const fatigueMax = Math.max(...m.fatigueSparkline, 1);
  const fatiguePct = Math.round((m.fatigue / fatigueMax) * 100);

  // Performance % normalized: current fitness as % of peak fitness
  const fitnessMax = Math.max(...m.fitnessSparkline, 1);
  const perfPct = Math.round((m.fitness / fitnessMax) * 100);

  const acuteLoadQualifier =
    m.acuteLoad < 150 ? 'Légère' : m.acuteLoad < 400 ? 'Modérée' : m.acuteLoad < 700 ? 'Élevée' : 'Très élevée';

  const sessionRpeOk = m.lastSession && m.lastSession.rpe >= 4 && m.lastSession.rpe <= 7;
  const sessionMessage = m.lastSession
    ? sessionRpeOk
      ? { title: 'Séance efficace', text: "Tu as bien géré l'intensité. Continue comme ça !" }
      : m.lastSession.rpe > 7
        ? { title: 'Séance intense', text: 'Pense à bien récupérer avant la prochaine séance dure.' }
        : { title: 'Séance facile', text: 'Idéale pour la récupération active.' }
    : null;

  const today = new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-app-ink">
            Bonjour {user?.firstName ?? ''} <span className="inline-block">👋</span>
          </h1>
          <p className="mt-1 text-sm text-app-muted">Voici ton état du jour.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-app-border bg-white text-app-muted hover:bg-app-bg">
            <Bell className="h-4 w-4" />
          </button>
          <div className="flex h-9 items-center gap-2 rounded-xl border border-app-border bg-white px-3 text-sm text-app-ink">
            <Calendar className="h-4 w-4 text-app-muted" />
            {formatDateFr(today)}
          </div>
        </div>
      </div>

      {/* Row 1 — metrics */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <MetricCard label="État de forme" info="Forme = Fitness − k × Fatigue (modèle de Banister)">
          {m.formPercentage !== null ? (
            <>
              <Gauge value={m.formPercentage} color={gaugeColor} label={formLabel} />
              {m.formDelta !== null && (
                <div className="mt-1 text-center text-xs font-medium" style={{ color: gaugeColor }}>
                  {m.formDelta > 0 ? '+' : ''}
                  {m.formDelta}% vs hier
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-app-muted">
              Encore {Math.max(0, 28 - m.daysOfHistory)} j d'historique nécessaires.
            </div>
          )}
        </MetricCard>

        <MetricCard label="Charge aiguë (7J)">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold text-app-ink">{Math.round(m.acuteLoad)}</span>
            <span className="text-xs text-app-muted">UA</span>
          </div>
          <div className="mt-1 text-sm font-medium text-ok">{acuteLoadQualifier}</div>
          <Sparkline data={m.acuteSparkline} color="#22C55E" />
        </MetricCard>

        <MetricCard label="Fatigue">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold text-app-ink">{fatiguePct}</span>
            <span className="text-xs text-app-muted">%</span>
          </div>
          <div className="mt-1 text-sm font-medium text-warn">
            {fatiguePct < 60 ? 'Bonne' : fatiguePct < 85 ? 'Modérée' : 'Élevée'}
          </div>
          <Sparkline data={m.fatigueSparkline} color="#F59E0B" />
        </MetricCard>

        <MetricCard label="Performance">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold text-app-ink">{perfPct}</span>
            <span className="text-xs text-app-muted">%</span>
          </div>
          <div className="mt-1 text-sm font-medium text-ok">
            {perfPct < 50 ? 'Faible' : perfPct < 75 ? 'Bonne' : 'Excellente'}
          </div>
          <Sparkline data={m.fitnessSparkline} color="#22C55E" />
        </MetricCard>

        <MetricCard label="Récupération">
          <div className="flex flex-col items-center justify-center gap-2 py-3 text-center opacity-70">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple/10">
              <Moon className="h-6 w-6 text-purple" />
            </div>
            <div className="text-sm font-medium text-app-ink">Bientôt</div>
            <div className="text-xs text-app-muted">Sommeil & HRV</div>
          </div>
        </MetricCard>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LastSessionCard
          last={m.lastSession}
          message={sessionMessage}
        />
        <div className="card p-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold text-app-ink">Charge d'entraînement</h2>
            <select
              value={historyRange}
              onChange={(e) => setHistoryRange(Number(e.target.value) as 7 | 30)}
              className="rounded-lg border border-app-border bg-white px-2 py-1 text-xs text-app-muted"
            >
              <option value={7}>7 derniers jours</option>
              <option value={30}>30 derniers jours</option>
            </select>
          </div>
          {histQ.data ? (
            <LoadChart data={histQ.data.daily} />
          ) : (
            <div className="h-[280px] flex items-center justify-center text-app-muted text-sm">Chargement…</div>
          )}
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-5 opacity-80">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-app-ink">À venir</h2>
            <span className="rounded-full bg-app-bg px-2 py-0.5 text-[10px] font-medium text-app-muted">Bientôt</span>
          </div>
          <div className="space-y-3">
            {[
              { name: 'Sortie vélo', sub: 'Endurance', date: 'Demain', dur: '2h00', dist: '65 km' },
              { name: 'Renforcement haut du corps', sub: 'Musculation', date: '20 mai', dur: '1h00', dist: '' },
              { name: 'Intervalles', sub: 'Course à pied', date: '22 mai', dur: '0h45', dist: '6 km' },
            ].map((s) => (
              <div key={s.name} className="flex items-center justify-between rounded-xl border border-app-border/60 p-3 text-sm text-app-muted/80">
                <div>
                  <div className="font-medium text-app-ink/70">{s.name}</div>
                  <div className="text-xs">{s.sub}</div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span>{s.date}</span>
                  <span>{s.dur}</span>
                  <span>{s.dist}</span>
                  <span className="rounded-full bg-app-bg px-2 py-0.5 text-[10px]">Prévu</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold text-app-ink">Évolution de ton état de forme</h2>
            <span className="text-xs text-app-muted">30 derniers jours</span>
          </div>
          {formHistQ.data ? (
            <FormChart data={formHistQ.data.daily} />
          ) : (
            <div className="h-[240px] flex items-center justify-center text-app-muted text-sm">Chargement…</div>
          )}
        </div>
      </div>

      {/* Insight */}
      <div className="rounded-2xl border border-purple/20 bg-purple/5 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple/15 text-purple">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-app-ink">Insight du jour</div>
            <p className="mt-1 text-sm text-app-muted">{generateInsight(m)}</p>
          </div>
        </div>
      </div>

      {/* ACWR / Monotonie debug strip — kept compact below the fold for QA */}
      {m.acwr !== null && (
        <div className="flex flex-wrap items-center gap-4 text-xs text-app-muted">
          <span>
            RCAC: <strong className={cn('text-sm', m.acwrZone && ACWR_ZONE_COLOR[m.acwrZone])}>{m.acwr}</strong>{' '}
            {m.acwrZone && `(${ACWR_ZONE_LABEL[m.acwrZone]})`}
          </span>
          {m.monotony !== null && <span>Monotonie: <strong className="text-sm text-app-ink">{m.monotony}</strong></span>}
          <span>Contrainte: <strong className="text-sm text-app-ink">{m.strain}</strong></span>
          <span>Fitness: <strong className="text-sm text-app-ink">{m.fitness}</strong></span>
          <span>Fatigue: <strong className="text-sm text-app-ink">{m.fatigue}</strong></span>
        </div>
      )}
    </div>
  );
}

interface LastSessionCardProps {
  last: import('@/types').Session | null;
  message: { title: string; text: string } | null;
}

function LastSessionCard({ last, message }: LastSessionCardProps) {
  if (!last) {
    return (
      <div className="card p-5">
        <h2 className="mb-2 text-base font-semibold text-app-ink">Dernier entraînement</h2>
        <p className="text-sm text-app-muted">Aucune séance enregistrée. Ajoute ta première séance pour commencer.</p>
      </div>
    );
  }
  const Icon = DISCIPLINE_ICON[last.discipline];
  const color = DISCIPLINE_COLOR[last.discipline];
  const h = Math.floor(last.durationMin / 60);
  const m = last.durationMin % 60;
  const durStr = h > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${m} min`;
  return (
    <div className="card p-5">
      <h2 className="mb-4 text-base font-semibold text-app-ink">Dernier entraînement</h2>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl', color.bg)}>
            <Icon className={cn('h-6 w-6', color.fg)} />
          </div>
          <div>
            <div className="font-semibold text-app-ink">{last.name}</div>
            <div className="text-sm text-app-muted">{DISCIPLINE_LABEL[last.discipline]}</div>
          </div>
        </div>
        <div className="text-right text-xs text-app-muted">{formatDateTimeFr(last.date)}</div>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        <Stat label="Durée" value={durStr} />
        <Stat label="Distance" value={last.distanceKm ? `${last.distanceKm} km` : '—'} />
        <Stat label="FC moy." value={last.avgHr ? `${last.avgHr} bpm` : '—'} />
        <Stat label="Charge" value={`${Math.round(last.load)} UA`} />
      </div>
      {message && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-ok/10 px-3 py-2.5 text-sm">
          <div className="flex items-center gap-2 text-app-ink">
            <CheckCircle2 className="h-4 w-4 text-ok" />
            <div>
              <span className="font-medium">{message.title}.</span>{' '}
              <span className="text-app-muted">{message.text}</span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-app-muted" />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-lg font-semibold text-app-ink">{value}</div>
      <div className="text-xs text-app-muted">{label}</div>
    </div>
  );
}
