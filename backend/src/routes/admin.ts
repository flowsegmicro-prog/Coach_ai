import { Router } from 'express';
import { seedDemo } from '../services/seed.service.js';

const router = Router();

/**
 * One-shot admin endpoint to (re)seed the demo dataset on the deployed
 * database. Protected by a shared secret passed in the `x-admin-token`
 * header. Disabled entirely if ADMIN_TOKEN is not set in env.
 */
router.post('/seed', async (req, res, next) => {
  try {
    const expected = process.env.ADMIN_TOKEN;
    if (!expected) {
      res.status(503).json({ error: 'Admin endpoints disabled (ADMIN_TOKEN not set).' });
      return;
    }
    const provided = req.header('x-admin-token');
    if (provided !== expected) {
      res.status(401).json({ error: 'Invalid admin token.' });
      return;
    }
    const result = await seedDemo();
    res.json({ ok: true, ...result });
  } catch (e) {
    next(e);
  }
});

export default router;
