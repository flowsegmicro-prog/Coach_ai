import { Bike, Dumbbell, Footprints, Waves, Activity } from 'lucide-react';
import type { Discipline } from '@/types';

export const DISCIPLINES: Discipline[] = ['RUNNING', 'CYCLING', 'STRENGTH', 'SWIMMING', 'OTHER'];

export const DISCIPLINE_LABEL: Record<Discipline, string> = {
  RUNNING: 'Course à pied',
  CYCLING: 'Vélo',
  STRENGTH: 'Musculation',
  SWIMMING: 'Natation',
  OTHER: 'Autre',
};

export const DISCIPLINE_ICON: Record<Discipline, React.ComponentType<{ className?: string }>> = {
  RUNNING: Footprints,
  CYCLING: Bike,
  STRENGTH: Dumbbell,
  SWIMMING: Waves,
  OTHER: Activity,
};

export const DISCIPLINE_COLOR: Record<Discipline, { bg: string; fg: string }> = {
  RUNNING: { bg: 'bg-emerald-100', fg: 'text-emerald-600' },
  CYCLING: { bg: 'bg-sky-100', fg: 'text-sky-600' },
  STRENGTH: { bg: 'bg-indigo-100', fg: 'text-indigo-600' },
  SWIMMING: { bg: 'bg-cyan-100', fg: 'text-cyan-600' },
  OTHER: { bg: 'bg-slate-100', fg: 'text-slate-600' },
};

export function hasDistance(d: Discipline): boolean {
  return d === 'RUNNING' || d === 'CYCLING' || d === 'SWIMMING';
}
