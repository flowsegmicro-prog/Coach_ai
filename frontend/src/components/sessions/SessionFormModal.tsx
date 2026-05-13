import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { api } from '@/lib/api';
import { DISCIPLINES, DISCIPLINE_LABEL, hasDistance } from '@/lib/discipline';
import type { Discipline, Session } from '@/types';

const schema = z.object({
  date: z.string().min(1, 'Date requise'),
  discipline: z.enum(['RUNNING', 'CYCLING', 'STRENGTH', 'SWIMMING', 'OTHER']),
  name: z.string().min(1, 'Nom requis').max(120),
  durationMin: z.number().int().min(1, 'Durée min 1').max(1000),
  rpe: z.number().int().min(0).max(10),
  distanceKm: z.number().positive().max(1000).nullable().optional(),
  avgHr: z.number().int().min(30).max(250).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

const RPE_DESCRIPTORS: Record<number, string> = {
  0: 'Repos',
  2: 'Très facile',
  4: 'Modéré',
  6: 'Difficile',
  8: 'Très difficile',
  10: 'Maximal',
};

const NAME_SUGGESTIONS: Record<Discipline, string[]> = {
  RUNNING: ['Endurance fondamentale', 'Fractionné', 'Sortie longue', 'Seuil'],
  CYCLING: ['Sortie endurance', 'Sortie intensité', 'Home trainer'],
  STRENGTH: ['Renforcement haut du corps', 'PPG', 'Full body'],
  SWIMMING: ['Natation technique', 'Aérobie'],
  OTHER: ['Séance libre'],
};

interface Props {
  open: boolean;
  onClose: () => void;
  existing?: Session | null;
}

export function SessionFormModal({ open, onClose, existing }: Props) {
  const qc = useQueryClient();
  const todayIso = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(todayIso);
  const [discipline, setDiscipline] = useState<Discipline>('RUNNING');
  const [name, setName] = useState('');
  const [durationMin, setDurationMin] = useState(60);
  const [rpe, setRpe] = useState(5);
  const [distanceKm, setDistanceKm] = useState<string>('');
  const [avgHr, setAvgHr] = useState<string>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      if (existing) {
        setDate(new Date(existing.date).toISOString().slice(0, 10));
        setDiscipline(existing.discipline);
        setName(existing.name);
        setDurationMin(existing.durationMin);
        setRpe(existing.rpe);
        setDistanceKm(existing.distanceKm?.toString() ?? '');
        setAvgHr(existing.avgHr?.toString() ?? '');
        setNotes(existing.notes ?? '');
      } else {
        setDate(todayIso);
        setDiscipline('RUNNING');
        setName('');
        setDurationMin(60);
        setRpe(5);
        setDistanceKm('');
        setAvgHr('');
        setNotes('');
      }
    }
  }, [open, existing, todayIso]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        date: new Date(date).toISOString(),
        discipline,
        name: name.trim() || NAME_SUGGESTIONS[discipline][0],
        durationMin,
        rpe,
        distanceKm: hasDistance(discipline) && distanceKm ? Number(distanceKm) : null,
        avgHr: avgHr ? Number(avgHr) : null,
        notes: notes.trim() || null,
      };
      const parsed = schema.safeParse(payload);
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0].message);
      }
      if (existing) {
        return api.updateSession(existing.id, parsed.data);
      }
      return api.createSession(parsed.data);
    },
    onSuccess: () => {
      toast.success(existing ? 'Séance modifiée' : 'Séance ajoutée');
      qc.invalidateQueries({ queryKey: ['sessions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['history'] });
      qc.invalidateQueries({ queryKey: ['weekly'] });
      onClose();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="card relative z-10 w-full max-w-lg p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-app-ink">
            {existing ? 'Modifier la séance' : 'Ajouter une séance'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 text-app-muted hover:bg-app-bg">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="label">Date</label>
              <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <label className="label">Discipline</label>
              <select
                className="input"
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value as Discipline)}
              >
                {DISCIPLINES.map((d) => (
                  <option key={d} value={d}>
                    {DISCIPLINE_LABEL[d]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="label">Nom de la séance</label>
            <input
              className="input"
              list="name-suggestions"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={NAME_SUGGESTIONS[discipline][0]}
            />
            <datalist id="name-suggestions">
              {NAME_SUGGESTIONS[discipline].map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          <div className="space-y-1">
            <label className="label">Durée (min)</label>
            <input
              type="number"
              min={1}
              max={1000}
              className="input"
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value))}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="label">RPE (CR-10)</label>
              <span className="text-sm font-semibold text-app-ink">
                {rpe} — {RPE_DESCRIPTORS[rpe] ?? RPE_DESCRIPTORS[Math.round(rpe / 2) * 2]}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={rpe}
              onChange={(e) => setRpe(Number(e.target.value))}
              className="w-full accent-brand-600"
            />
            <div className="flex justify-between text-[10px] text-app-muted">
              <span>0 Repos</span>
              <span>2</span>
              <span>4</span>
              <span>6</span>
              <span>8</span>
              <span>10 Max</span>
            </div>
          </div>

          {hasDistance(discipline) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="label">Distance (km)</label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  className="input"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="label">FC moyenne (bpm)</label>
                <input
                  type="number"
                  min={30}
                  max={250}
                  className="input"
                  value={avgHr}
                  onChange={(e) => setAvgHr(e.target.value)}
                />
              </div>
            </div>
          )}

          {!hasDistance(discipline) && (
            <div className="space-y-1">
              <label className="label">FC moyenne (bpm) — optionnel</label>
              <input
                type="number"
                min={30}
                max={250}
                className="input"
                value={avgHr}
                onChange={(e) => setAvgHr(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="label">Notes — optionnel</label>
            <textarea
              className="input min-h-[70px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Sensations, conditions, …"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-app-bg px-3 py-2 text-sm">
            <span className="text-app-muted">Charge calculée</span>
            <span className="font-semibold text-app-ink">{durationMin * rpe} UA</span>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Enregistrement…' : existing ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
