import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { SessionFormModal } from '@/components/sessions/SessionFormModal';
import { DISCIPLINES, DISCIPLINE_COLOR, DISCIPLINE_ICON, DISCIPLINE_LABEL } from '@/lib/discipline';
import { cn, formatDateFr } from '@/lib/utils';
import type { Discipline, Session } from '@/types';

export default function Sessions() {
  const qc = useQueryClient();
  const [discipline, setDiscipline] = useState<Discipline | 'ALL'>('ALL');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Session | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['sessions', discipline],
    queryFn: () =>
      api.listSessions({
        discipline: discipline === 'ALL' ? undefined : discipline,
        limit: 200,
      }),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.deleteSession(id),
    onSuccess: () => {
      toast.success('Séance supprimée');
      qc.invalidateQueries({ queryKey: ['sessions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['history'] });
      qc.invalidateQueries({ queryKey: ['weekly'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-app-ink">Entraînements</h1>
          <p className="mt-1 text-sm text-app-muted">Toutes tes séances enregistrées.</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Ajouter une séance
        </button>
      </div>

      <div className="card p-3">
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip active={discipline === 'ALL'} onClick={() => setDiscipline('ALL')}>
            Toutes
          </FilterChip>
          {DISCIPLINES.map((d) => (
            <FilterChip key={d} active={discipline === d} onClick={() => setDiscipline(d)}>
              {DISCIPLINE_LABEL[d]}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {isLoading && <div className="text-sm text-app-muted">Chargement…</div>}
        {data?.length === 0 && (
          <div className="card p-6 text-center text-sm text-app-muted">
            Aucune séance enregistrée. Clique sur "Ajouter une séance" pour commencer.
          </div>
        )}
        {data?.map((s) => (
          <SessionRow
            key={s.id}
            session={s}
            onEdit={() => {
              setEditing(s);
              setOpen(true);
            }}
            onDelete={() => {
              if (confirm('Supprimer cette séance ?')) del.mutate(s.id);
            }}
          />
        ))}
      </div>

      <SessionFormModal open={open} onClose={() => setOpen(false)} existing={editing} />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1 text-xs font-medium transition-colors',
        active ? 'bg-brand-600 text-white' : 'bg-app-bg text-app-muted hover:bg-app-border/50',
      )}
    >
      {children}
    </button>
  );
}

function SessionRow({
  session,
  onEdit,
  onDelete,
}: {
  session: Session;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Icon = DISCIPLINE_ICON[session.discipline];
  const color = DISCIPLINE_COLOR[session.discipline];
  const h = Math.floor(session.durationMin / 60);
  const m = session.durationMin % 60;
  const dur = h > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${m} min`;
  return (
    <div className="card flex items-center gap-4 p-4">
      <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl', color.bg)}>
        <Icon className={cn('h-5 w-5', color.fg)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-medium text-app-ink truncate">{session.name}</span>
          <span className="text-xs text-app-muted">{DISCIPLINE_LABEL[session.discipline]}</span>
        </div>
        <div className="text-xs text-app-muted">{formatDateFr(session.date)}</div>
      </div>
      <div className="hidden md:flex items-center gap-6 text-sm">
        <Stat label="Durée" value={dur} />
        {session.distanceKm && <Stat label="Distance" value={`${session.distanceKm} km`} />}
        <Stat label="RPE" value={`${session.rpe}/10`} />
        <Stat label="Charge" value={`${Math.round(session.load)} UA`} />
      </div>
      <div className="flex items-center gap-1">
        <button onClick={onEdit} className="rounded-lg p-2 text-app-muted hover:bg-app-bg" aria-label="Modifier">
          <Pencil className="h-4 w-4" />
        </button>
        <button onClick={onDelete} className="rounded-lg p-2 text-app-muted hover:bg-danger/10 hover:text-danger" aria-label="Supprimer">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-sm font-medium text-app-ink">{value}</div>
      <div className="text-[10px] uppercase text-app-muted">{label}</div>
    </div>
  );
}
