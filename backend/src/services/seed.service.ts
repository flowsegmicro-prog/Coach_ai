import bcrypt from 'bcrypt';
import { addDays, startOfDay, subDays } from 'date-fns';
import type { Discipline } from '@prisma/client';
import { prisma } from '../db/client.js';

export const SEED_EMAIL = 'thomas@coach.ai';
export const SEED_PASSWORD = 'password123';

interface SessionTemplate {
  name: string;
  discipline: Discipline;
  durationMin: number;
  rpe: number;
  distanceKm?: number;
  avgHr?: number;
}

const TEMPLATES: SessionTemplate[] = [
  { name: 'Endurance fondamentale', discipline: 'RUNNING', durationMin: 70, rpe: 4, distanceKm: 9, avgHr: 130 },
  { name: 'Sortie longue', discipline: 'RUNNING', durationMin: 90, rpe: 5, distanceKm: 13, avgHr: 138 },
  { name: 'Fractionné court', discipline: 'RUNNING', durationMin: 45, rpe: 8, distanceKm: 8, avgHr: 165 },
  { name: 'Seuil', discipline: 'RUNNING', durationMin: 60, rpe: 7, distanceKm: 11, avgHr: 158 },
  { name: 'Sortie vélo endurance', discipline: 'CYCLING', durationMin: 120, rpe: 4, distanceKm: 50, avgHr: 125 },
  { name: 'Sortie vélo intensité', discipline: 'CYCLING', durationMin: 80, rpe: 7, distanceKm: 35, avgHr: 150 },
  { name: 'Renforcement haut du corps', discipline: 'STRENGTH', durationMin: 60, rpe: 6, avgHr: 110 },
  { name: 'PPG', discipline: 'STRENGTH', durationMin: 40, rpe: 5, avgHr: 105 },
  { name: 'Natation technique', discipline: 'SWIMMING', durationMin: 50, rpe: 4, distanceKm: 2, avgHr: 120 },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function seedDemo(): Promise<{ email: string; password: string; sessionsCreated: number }> {
  const existing = await prisma.user.findUnique({ where: { email: SEED_EMAIL } });
  if (existing) {
    await prisma.session.deleteMany({ where: { userId: existing.id } });
    await prisma.user.delete({ where: { id: existing.id } });
  }
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  const user = await prisma.user.create({
    data: {
      email: SEED_EMAIL,
      passwordHash,
      firstName: 'Thomas',
      lastName: 'Dubois',
    },
  });

  const today = startOfDay(new Date());
  const start = subDays(today, 34);
  const planned: { date: Date; tpl: SessionTemplate }[] = [];
  for (let i = 0; i < 35; i++) {
    const date = addDays(start, i);
    const dayMod = i % 7;
    if (dayMod === 0 || dayMod === 3) continue; // rest days
    planned.push({ date, tpl: pick(TEMPLATES) });
    if (dayMod === 2 && Math.random() < 0.4) {
      planned.push({ date, tpl: pick(TEMPLATES.filter((t) => t.discipline === 'STRENGTH')) });
    }
  }

  for (const { date, tpl } of planned) {
    await prisma.session.create({
      data: {
        userId: user.id,
        date,
        discipline: tpl.discipline,
        name: tpl.name,
        durationMin: tpl.durationMin,
        rpe: tpl.rpe,
        distanceKm: tpl.distanceKm ?? null,
        avgHr: tpl.avgHr ?? null,
        notes: null,
        load: tpl.durationMin * tpl.rpe,
      },
    });
  }

  return { email: SEED_EMAIL, password: SEED_PASSWORD, sessionsCreated: planned.length };
}
