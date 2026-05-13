import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { calculateSessionLoad } from '../services/training-load.service.js';

const router = Router();
router.use(requireAuth);

const disciplineEnum = z.enum(['RUNNING', 'CYCLING', 'STRENGTH', 'SWIMMING', 'OTHER']);

const createSchema = z.object({
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  discipline: disciplineEnum,
  name: z.string().min(1).max(120),
  durationMin: z.number().int().min(1).max(1000),
  rpe: z.number().int().min(0).max(10),
  distanceKm: z.number().positive().max(1000).optional().nullable(),
  avgHr: z.number().int().min(30).max(250).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

router.post('/', async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const load = calculateSessionLoad(data.durationMin, data.rpe);
    const session = await prisma.session.create({
      data: {
        userId: req.userId!,
        date: new Date(data.date),
        discipline: data.discipline,
        name: data.name,
        durationMin: data.durationMin,
        rpe: data.rpe,
        distanceKm: data.distanceKm ?? null,
        avgHr: data.avgHr ?? null,
        notes: data.notes ?? null,
        load,
      },
    });
    res.status(201).json(session);
  } catch (e) {
    next(e);
  }
});

const listQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  discipline: disciplineEnum.optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

router.get('/', async (req, res, next) => {
  try {
    const q = listQuerySchema.parse(req.query);
    const where: Record<string, unknown> = { userId: req.userId };
    if (q.from || q.to) {
      const dateFilter: Record<string, Date> = {};
      if (q.from) dateFilter.gte = new Date(q.from);
      if (q.to) dateFilter.lte = new Date(q.to);
      where.date = dateFilter;
    }
    if (q.discipline) where.discipline = q.discipline;
    const sessions = await prisma.session.findMany({
      where,
      orderBy: { date: 'desc' },
      take: q.limit ?? 100,
    });
    res.json(sessions);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const s = await prisma.session.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!s) {
      res.status(404).json({ error: 'Séance introuvable' });
      return;
    }
    res.json(s);
  } catch (e) {
    next(e);
  }
});

const updateSchema = createSchema.partial();

router.patch('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.session.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) {
      res.status(404).json({ error: 'Séance introuvable' });
      return;
    }
    const data = updateSchema.parse(req.body);
    const durationMin = data.durationMin ?? existing.durationMin;
    const rpe = data.rpe ?? existing.rpe;
    const load = calculateSessionLoad(durationMin, rpe);

    const updated = await prisma.session.update({
      where: { id: existing.id },
      data: {
        date: data.date ? new Date(data.date) : undefined,
        discipline: data.discipline ?? undefined,
        name: data.name ?? undefined,
        durationMin,
        rpe,
        distanceKm: data.distanceKm === undefined ? undefined : data.distanceKm,
        avgHr: data.avgHr === undefined ? undefined : data.avgHr,
        notes: data.notes === undefined ? undefined : data.notes,
        load,
      },
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.session.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) {
      res.status(404).json({ error: 'Séance introuvable' });
      return;
    }
    await prisma.session.delete({ where: { id: existing.id } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
