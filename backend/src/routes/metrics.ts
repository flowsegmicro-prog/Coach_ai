import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { getDashboardMetrics, getHistory, getWeeklyAnalysis } from '../services/metrics.service.js';

const router = Router();
router.use(requireAuth);

router.get('/dashboard', async (req, res, next) => {
  try {
    const data = await getDashboardMetrics(req.userId!);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

const historySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(7),
});

router.get('/history', async (req, res, next) => {
  try {
    const { days } = historySchema.parse(req.query);
    const data = await getHistory(req.userId!, days);
    res.json({ daily: data });
  } catch (e) {
    next(e);
  }
});

const weeklySchema = z.object({
  weeks: z.coerce.number().int().min(1).max(52).default(8),
});

router.get('/weekly', async (req, res, next) => {
  try {
    const { weeks } = weeklySchema.parse(req.query);
    const data = await getWeeklyAnalysis(req.userId!, weeks);
    res.json({ weekly: data });
  } catch (e) {
    next(e);
  }
});

export default router;
