import { describe, it, expect } from 'vitest';
import {
  calculateSessionLoad,
  calculateAcuteLoad,
  calculateChronicLoad,
  calculateACWR,
  getAcwrZone,
  calculateMonotony,
  getMonotonyZone,
  calculateStrain,
  calculateBanister,
  calculateFormPercentage,
  buildDailyLoadSeries,
  TAU_FITNESS,
  TAU_FATIGUE,
} from '../training-load.service.js';

describe('calculateSessionLoad', () => {
  it('multiplies duration by RPE', () => {
    expect(calculateSessionLoad(60, 7)).toBe(420);
  });
  it('returns 0 for rest day', () => {
    expect(calculateSessionLoad(60, 0)).toBe(0);
  });
});

describe('calculateAcuteLoad', () => {
  it('returns mean of 7 daily loads (uniform)', () => {
    expect(calculateAcuteLoad([100, 100, 100, 100, 100, 100, 100])).toBe(100);
  });
  it('returns mean of 7 daily loads (single big day)', () => {
    expect(calculateAcuteLoad([0, 0, 0, 0, 0, 0, 700])).toBe(100);
  });
  it('throws when not exactly 7 days', () => {
    expect(() => calculateAcuteLoad([1, 2, 3])).toThrow();
  });
});

describe('calculateChronicLoad', () => {
  it('returns mean of 28 daily loads', () => {
    const arr = new Array(28).fill(50);
    expect(calculateChronicLoad(arr)).toBe(50);
  });
  it('throws when not exactly 28 days', () => {
    expect(() => calculateChronicLoad([1, 2, 3])).toThrow();
  });
});

describe('calculateACWR & zones', () => {
  it('calculates ratio and OPTIMAL zone', () => {
    const acwr = calculateACWR(500, 400);
    expect(acwr).toBe(1.25);
    expect(getAcwrZone(acwr)).toBe('OPTIMAL');
  });
  it('detects RISQUE zone when ratio > 1.5', () => {
    const acwr = calculateACWR(800, 400);
    expect(acwr).toBe(2);
    expect(getAcwrZone(acwr)).toBe('RISQUE');
  });
  it('returns null when chronic is zero', () => {
    expect(calculateACWR(100, 0)).toBeNull();
    expect(getAcwrZone(null)).toBeNull();
  });
  it('detects SOUS_CHARGE', () => {
    expect(getAcwrZone(0.5)).toBe('SOUS_CHARGE');
  });
  it('detects VIGILANCE', () => {
    expect(getAcwrZone(1.4)).toBe('VIGILANCE');
  });
});

describe('calculateMonotony & zones', () => {
  it('returns null for perfectly uniform week (sd=0)', () => {
    expect(calculateMonotony([300, 300, 300, 300, 300, 300, 300])).toBeNull();
  });
  it('returns null when entire week is zero', () => {
    expect(calculateMonotony([0, 0, 0, 0, 0, 0, 0])).toBeNull();
  });
  it('returns a coherent value for a varied week', () => {
    const m = calculateMonotony([400, 0, 300, 0, 500, 0, 200]);
    expect(m).not.toBeNull();
    expect(m!).toBeGreaterThan(0);
    expect(m!).toBeLessThan(3);
  });
  it('assigns BONNE zone below 1.5', () => {
    expect(getMonotonyZone(1.0)).toBe('BONNE');
  });
  it('assigns RISQUE zone above 2.0', () => {
    expect(getMonotonyZone(2.5)).toBe('RISQUE');
  });
});

describe('calculateStrain', () => {
  it('multiplies weekly load by monotony', () => {
    expect(calculateStrain(2000, 1.4)).toBeCloseTo(2800);
  });
});

describe('calculateBanister', () => {
  it('with single load of 100 on day 0, fitness and fatigue = 100 then decay', () => {
    const series = calculateBanister([100, 0, 0, 0]);
    expect(series[0].fitness).toBe(100);
    expect(series[0].fatigue).toBe(100);
    // day 1 = day 0 * exp(-1/tau) + 0
    expect(series[1].fitness).toBeCloseTo(100 * Math.exp(-1 / TAU_FITNESS));
    expect(series[1].fatigue).toBeCloseTo(100 * Math.exp(-1 / TAU_FATIGUE));
    expect(series[2].fitness).toBeLessThan(series[1].fitness);
    expect(series[2].fatigue).toBeLessThan(series[1].fatigue);
  });
  it('returns empty array for empty input', () => {
    expect(calculateBanister([])).toEqual([]);
  });
});

describe('calculateFormPercentage', () => {
  it('returns 50 when fitnessMax is 0', () => {
    expect(calculateFormPercentage(0, 0)).toBe(50);
  });
  it('returns 100 when form = fitnessMax', () => {
    expect(calculateFormPercentage(100, 100)).toBe(100);
  });
  it('returns 0 when form = -fitnessMax', () => {
    expect(calculateFormPercentage(-100, 100)).toBe(0);
  });
  it('clamps within [0, 100]', () => {
    expect(calculateFormPercentage(500, 100)).toBe(100);
    expect(calculateFormPercentage(-500, 100)).toBe(0);
  });
});

describe('buildDailyLoadSeries', () => {
  it('fills missing days with zero and sums same-day sessions', () => {
    const start = new Date('2026-05-01T00:00:00Z');
    const end = new Date('2026-05-03T00:00:00Z');
    const series = buildDailyLoadSeries(
      [
        { date: new Date('2026-05-01T08:00:00Z'), durationMin: 60, rpe: 5 },
        { date: new Date('2026-05-01T18:00:00Z'), durationMin: 30, rpe: 4 },
        { date: new Date('2026-05-03T10:00:00Z'), durationMin: 45, rpe: 6 },
      ],
      start,
      end,
    );
    expect(series).toHaveLength(3);
    expect(series[0].load).toBe(60 * 5 + 30 * 4);
    expect(series[1].load).toBe(0);
    expect(series[2].load).toBe(45 * 6);
  });
});
