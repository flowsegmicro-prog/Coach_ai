import { addDays, differenceInCalendarDays, format, startOfDay, subDays } from 'date-fns';
import { prisma } from '../db/client.js';
import {
  ACUTE_WINDOW,
  CHRONIC_WINDOW,
  buildDailyLoadSeries,
  calculateAcuteLoad,
  calculateBanister,
  calculateChronicLoad,
  calculateACWR,
  calculateFormPercentage,
  calculateMonotony,
  calculateStrain,
  getAcwrZone,
  getFormStatus,
  getMonotonyZone,
  tail,
  type AcwrZone,
  type FormStatus,
  type MonotonyZone,
} from './training-load.service.js';

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
  lastSession: unknown | null;
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

async function getUserSessions(userId: string) {
  return prisma.session.findMany({
    where: { userId },
    orderBy: { date: 'asc' },
  });
}

function daysOfHistory(firstSessionDate: Date | null, today: Date): number {
  if (!firstSessionDate) return 0;
  return differenceInCalendarDays(startOfDay(today), startOfDay(firstSessionDate)) + 1;
}

export async function getDashboardMetrics(userId: string, today = new Date()): Promise<DashboardMetrics> {
  const sessions = await getUserSessions(userId);
  const todayD = startOfDay(today);

  const firstSession = sessions[0] ?? null;
  const lastSession =
    sessions.length > 0
      ? await prisma.session.findFirst({
          where: { userId },
          orderBy: { date: 'desc' },
        })
      : null;

  const historyDays = daysOfHistory(firstSession?.date ?? null, todayD);
  const has28Days = historyDays >= CHRONIC_WINDOW;

  // Build a full daily series from (today - 41) to today so we can compute
  // 7d acute, 28d chronic, and meaningful Banister history.
  const seriesStart = subDays(todayD, 60);
  const dailySeries = buildDailyLoadSeries(
    sessions.map((s) => ({ date: s.date, durationMin: s.durationMin, rpe: s.rpe })),
    seriesStart,
    todayD,
  );
  const loads = dailySeries.map((p) => p.load);

  // 7-day window ending today
  const last7 = tail(loads, ACUTE_WINDOW);
  const acuteLoad = last7.length === ACUTE_WINDOW ? calculateAcuteLoad(last7) : 0;

  // 28-day window ending today
  const last28 = tail(loads, CHRONIC_WINDOW);
  const chronicLoad = has28Days && last28.length === CHRONIC_WINDOW ? calculateChronicLoad(last28) : null;

  const acwr = chronicLoad !== null ? calculateACWR(acuteLoad, chronicLoad) : null;
  const acwrZone = getAcwrZone(acwr);

  const monotony = last7.length === ACUTE_WINDOW ? calculateMonotony(last7) : null;
  const monotonyZone = getMonotonyZone(monotony);

  const weeklyTotal = last7.reduce((a, b) => a + b, 0);
  const strain = monotony !== null ? calculateStrain(weeklyTotal, monotony) : 0;

  const banister = calculateBanister(loads);
  const fitnessSeries = banister.map((b) => b.fitness);
  const fatigueSeries = banister.map((b) => b.fatigue);
  const fitnessMax = Math.max(...fitnessSeries, 1);
  const last = banister[banister.length - 1] ?? { fitness: 0, fatigue: 0, form: 0 };
  const formPercentage = has28Days ? calculateFormPercentage(last.form, fitnessMax) : null;

  let formDelta: number | null = null;
  if (has28Days && banister.length >= 2) {
    const prev = banister[banister.length - 2];
    const prevPct = calculateFormPercentage(prev.form, fitnessMax);
    formDelta = (formPercentage ?? 0) - prevPct;
  }

  const formStatus = formPercentage !== null ? getFormStatus(formPercentage) : null;

  // Acute load sparkline: last 7 days' acute MA (computed at each day)
  const acuteSparkline: number[] = [];
  for (let i = Math.max(0, loads.length - 7); i < loads.length; i++) {
    const windowStart = Math.max(0, i - 6);
    const window = loads.slice(windowStart, i + 1);
    const mean = window.reduce((a, b) => a + b, 0) / window.length;
    acuteSparkline.push(mean);
  }
  const fatigueSparkline = fatigueSeries.slice(-7);
  const fitnessSparkline = fitnessSeries.slice(-7);

  return {
    date: format(todayD, 'yyyy-MM-dd'),
    formPercentage,
    formDelta,
    formStatus,
    acuteLoad: Math.round(acuteLoad * 10) / 10,
    chronicLoad: chronicLoad !== null ? Math.round(chronicLoad * 10) / 10 : null,
    acwr: acwr !== null ? Math.round(acwr * 100) / 100 : null,
    acwrZone,
    monotony: monotony !== null ? Math.round(monotony * 100) / 100 : null,
    monotonyZone,
    strain: Math.round(strain),
    fatigue: Math.round(last.fatigue),
    fitness: Math.round(last.fitness),
    daysOfHistory: historyDays,
    acuteSparkline: acuteSparkline.map((v) => Math.round(v * 10) / 10),
    fatigueSparkline: fatigueSparkline.map((v) => Math.round(v * 10) / 10),
    fitnessSparkline: fitnessSparkline.map((v) => Math.round(v * 10) / 10),
    lastSession,
  };
}

export async function getHistory(userId: string, days: number, today = new Date()): Promise<HistoryPoint[]> {
  const sessions = await getUserSessions(userId);
  const todayD = startOfDay(today);
  const firstSession = sessions[0] ?? null;
  const historyDays = daysOfHistory(firstSession?.date ?? null, todayD);
  const has28Days = historyDays >= CHRONIC_WINDOW;

  // Compute Banister from a long enough lookback (e.g. 90 days before window start) so values stabilize.
  const lookback = Math.max(days + 60, 90);
  const seriesStart = subDays(todayD, lookback - 1);
  const series = buildDailyLoadSeries(
    sessions.map((s) => ({ date: s.date, durationMin: s.durationMin, rpe: s.rpe })),
    seriesStart,
    todayD,
  );
  const loads = series.map((p) => p.load);
  const banister = calculateBanister(loads);
  const fitnessMax = Math.max(...banister.map((b) => b.fitness), 1);

  const result: HistoryPoint[] = [];
  const startIdx = loads.length - days;
  for (let i = Math.max(0, startIdx); i < loads.length; i++) {
    const window7 = loads.slice(Math.max(0, i - 6), i + 1);
    const acute = window7.reduce((a, b) => a + b, 0) / Math.min(7, window7.length);
    let chronic: number | null = null;
    const dayDate = addDays(seriesStart, i);
    const dayHistory = daysOfHistory(firstSession?.date ?? null, dayDate);
    if (dayHistory >= CHRONIC_WINDOW) {
      const window28 = loads.slice(Math.max(0, i - 27), i + 1);
      if (window28.length === CHRONIC_WINDOW) {
        chronic = window28.reduce((a, b) => a + b, 0) / CHRONIC_WINDOW;
      }
    }
    const b = banister[i];
    const formPct = dayHistory >= CHRONIC_WINDOW ? calculateFormPercentage(b.form, fitnessMax) : null;
    result.push({
      date: series[i].date,
      load: Math.round(loads[i] * 10) / 10,
      acuteLoad: Math.round(acute * 10) / 10,
      chronicLoad: chronic !== null ? Math.round(chronic * 10) / 10 : null,
      fitness: Math.round(b.fitness * 10) / 10,
      fatigue: Math.round(b.fatigue * 10) / 10,
      form: Math.round(b.form * 10) / 10,
      formPercentage: formPct,
    });
  }
  return result;
}

export interface WeeklyAnalysisRow {
  weekStart: string;
  weekEnd: string;
  totalLoad: number;
  sessionCount: number;
  monotony: number | null;
  strain: number;
  endOfWeekAcwr: number | null;
  endOfWeekAcwrZone: AcwrZone | null;
}

export async function getWeeklyAnalysis(userId: string, weeks = 8, today = new Date()): Promise<WeeklyAnalysisRow[]> {
  const sessions = await getUserSessions(userId);
  const todayD = startOfDay(today);
  const firstSession = sessions[0] ?? null;
  const seriesStart = subDays(todayD, weeks * 7 + 28);
  const series = buildDailyLoadSeries(
    sessions.map((s) => ({ date: s.date, durationMin: s.durationMin, rpe: s.rpe })),
    seriesStart,
    todayD,
  );
  const loads = series.map((p) => p.load);

  const rows: WeeklyAnalysisRow[] = [];
  for (let w = 0; w < weeks; w++) {
    const endIdx = loads.length - 1 - w * 7;
    const startIdx = endIdx - 6;
    if (startIdx < 0) break;
    const weekLoads = loads.slice(startIdx, endIdx + 1);
    const total = weekLoads.reduce((a, b) => a + b, 0);
    const monotony = calculateMonotony(weekLoads);
    const strain = monotony !== null ? calculateStrain(total, monotony) : 0;
    const sessionCount = sessions.filter((s) => {
      const d = startOfDay(s.date);
      return (
        differenceInCalendarDays(d, addDays(seriesStart, startIdx)) >= 0 &&
        differenceInCalendarDays(addDays(seriesStart, endIdx), d) >= 0
      );
    }).length;

    let endAcwr: number | null = null;
    const dayHistory = daysOfHistory(firstSession?.date ?? null, addDays(seriesStart, endIdx));
    if (dayHistory >= CHRONIC_WINDOW && endIdx - 27 >= 0) {
      const acute = weekLoads.reduce((a, b) => a + b, 0) / 7;
      const chronicWindow = loads.slice(endIdx - 27, endIdx + 1);
      const chronic = chronicWindow.reduce((a, b) => a + b, 0) / CHRONIC_WINDOW;
      endAcwr = chronic === 0 ? null : acute / chronic;
    }

    rows.push({
      weekStart: format(addDays(seriesStart, startIdx), 'yyyy-MM-dd'),
      weekEnd: format(addDays(seriesStart, endIdx), 'yyyy-MM-dd'),
      totalLoad: Math.round(total),
      sessionCount,
      monotony: monotony !== null ? Math.round(monotony * 100) / 100 : null,
      strain: Math.round(strain),
      endOfWeekAcwr: endAcwr !== null ? Math.round(endAcwr * 100) / 100 : null,
      endOfWeekAcwrZone: getAcwrZone(endAcwr),
    });
  }
  return rows.reverse();
}
