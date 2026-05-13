export type Discipline = 'RUNNING' | 'CYCLING' | 'STRENGTH' | 'SWIMMING' | 'OTHER';

export type AcwrZone = 'SOUS_CHARGE' | 'OPTIMAL' | 'VIGILANCE' | 'RISQUE';
export type MonotonyZone = 'BONNE' | 'VIGILANCE' | 'RISQUE';
export type FormStatus = 'EN_FORME' | 'NEUTRE' | 'FATIGUE';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt?: string;
}

export interface Session {
  id: string;
  userId: string;
  date: string;
  discipline: Discipline;
  name: string;
  durationMin: number;
  rpe: number;
  distanceKm: number | null;
  avgHr: number | null;
  notes: string | null;
  load: number;
  createdAt: string;
}

export interface DashboardMetrics {
  date: string;
  formPercentage: number | null;
  formDelta: number | null;
  formStatus: FormStatus | null;
  acuteLoad: number;
  chronicLoad: number | null;
  acwr: number | null;
  acwrZone: AcwrZone | null;
  monotony: number | null;
  monotonyZone: MonotonyZone | null;
  strain: number;
  fatigue: number;
  fitness: number;
  daysOfHistory: number;
  acuteSparkline: number[];
  fatigueSparkline: number[];
  fitnessSparkline: number[];
  lastSession: Session | null;
}

export interface HistoryPoint {
  date: string;
  load: number;
  acuteLoad: number;
  chronicLoad: number | null;
  fitness: number;
  fatigue: number;
  form: number;
  formPercentage: number | null;
}

export interface HistoryResponse {
  daily: HistoryPoint[];
}

export interface WeeklyRow {
  weekStart: string;
  weekEnd: string;
  totalLoad: number;
  sessionCount: number;
  monotony: number | null;
  strain: number;
  endOfWeekAcwr: number | null;
  endOfWeekAcwrZone: AcwrZone | null;
}

export interface WeeklyResponse {
  weekly: WeeklyRow[];
}
