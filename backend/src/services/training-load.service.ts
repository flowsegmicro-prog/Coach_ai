import { addDays, differenceInCalendarDays, format, startOfDay } from 'date-fns';

export type AcwrZone = 'SOUS_CHARGE' | 'OPTIMAL' | 'VIGILANCE' | 'RISQUE';
export type MonotonyZone = 'BONNE' | 'VIGILANCE' | 'RISQUE';
export type FormStatus = 'EN_FORME' | 'NEUTRE' | 'FATIGUE';

export const ACUTE_WINDOW = 7;
export const CHRONIC_WINDOW = 28;
export const TAU_FITNESS = 42;
export const TAU_FATIGUE = 7;
export const K_FATIGUE = 2;

export interface SessionInput {
  date: Date;
  durationMin: number;
  rpe: number;
}

export interface DailyLoadPoint {
  date: string;
  load: number;
}

export function calculateSessionLoad(durationMin: number, rpe: number): number {
  return durationMin * rpe;
}

export function calculateAcuteLoad(dailyLoads: number[]): number {
  if (dailyLoads.length !== ACUTE_WINDOW) {
    throw new Error(`Need ${ACUTE_WINDOW} days`);
  }
  return dailyLoads.reduce((a, b) => a + b, 0) / ACUTE_WINDOW;
}

export function calculateChronicLoad(dailyLoads: number[]): number {
  if (dailyLoads.length !== CHRONIC_WINDOW) {
    throw new Error(`Need ${CHRONIC_WINDOW} days`);
  }
  return dailyLoads.reduce((a, b) => a + b, 0) / CHRONIC_WINDOW;
}

export function calculateACWR(acute: number, chronic: number): number | null {
  if (chronic === 0) return null;
  return acute / chronic;
}

export function getAcwrZone(acwr: number | null): AcwrZone | null {
  if (acwr === null) return null;
  if (acwr < 0.8) return 'SOUS_CHARGE';
  if (acwr <= 1.3) return 'OPTIMAL';
  if (acwr <= 1.5) return 'VIGILANCE';
  return 'RISQUE';
}

export function calculateMonotony(weekLoads: number[]): number | null {
  if (weekLoads.length !== ACUTE_WINDOW) {
    throw new Error(`Need ${ACUTE_WINDOW} days`);
  }
  const mean = weekLoads.reduce((a, b) => a + b, 0) / ACUTE_WINDOW;
  const variance =
    weekLoads.reduce((acc, v) => acc + (v - mean) ** 2, 0) / ACUTE_WINDOW;
  const sd = Math.sqrt(variance);
  if (sd === 0) return null;
  return mean / sd;
}

export function getMonotonyZone(monotony: number | null): MonotonyZone | null {
  if (monotony === null) return null;
  if (monotony < 1.5) return 'BONNE';
  if (monotony <= 2.0) return 'VIGILANCE';
  return 'RISQUE';
}

export function calculateStrain(weeklyTotalLoad: number, monotony: number): number {
  return weeklyTotalLoad * monotony;
}

export interface BanisterPoint {
  fitness: number;
  fatigue: number;
  form: number;
}

export function calculateBanister(dailyLoads: number[]): BanisterPoint[] {
  let fitness = 0;
  let fatigue = 0;
  const results: BanisterPoint[] = [];
  for (const load of dailyLoads) {
    fitness = fitness * Math.exp(-1 / TAU_FITNESS) + load;
    fatigue = fatigue * Math.exp(-1 / TAU_FATIGUE) + load;
    const form = fitness - K_FATIGUE * fatigue;
    results.push({ fitness, fatigue, form });
  }
  return results;
}

export function calculateFormPercentage(form: number, fitnessMax: number): number {
  if (fitnessMax === 0) return 50;
  const ratio = form / fitnessMax;
  return Math.max(0, Math.min(100, Math.round(50 + ratio * 50)));
}

export function getFormStatus(formPercentage: number): FormStatus {
  if (formPercentage >= 65) return 'EN_FORME';
  if (formPercentage >= 40) return 'NEUTRE';
  return 'FATIGUE';
}

/**
 * Builds a continuous daily load series from the start date (inclusive) to the end date (inclusive).
 * Missing days are filled with 0; multiple sessions on the same day are summed.
 */
export function buildDailyLoadSeries(
  sessions: SessionInput[],
  start: Date,
  end: Date,
): DailyLoadPoint[] {
  const startD = startOfDay(start);
  const endD = startOfDay(end);
  const totalDays = differenceInCalendarDays(endD, startD) + 1;
  if (totalDays <= 0) return [];

  const bucket = new Map<string, number>();
  for (let i = 0; i < totalDays; i++) {
    const day = format(addDays(startD, i), 'yyyy-MM-dd');
    bucket.set(day, 0);
  }
  for (const s of sessions) {
    const key = format(startOfDay(s.date), 'yyyy-MM-dd');
    if (bucket.has(key)) {
      bucket.set(key, (bucket.get(key) ?? 0) + calculateSessionLoad(s.durationMin, s.rpe));
    }
  }
  return Array.from(bucket.entries()).map(([date, load]) => ({ date, load }));
}

/** Returns the slice [n-7 ... n-1] (7 days ending the day at index n-1). */
export function tail<T>(arr: T[], n: number): T[] {
  if (arr.length < n) return [];
  return arr.slice(arr.length - n);
}
