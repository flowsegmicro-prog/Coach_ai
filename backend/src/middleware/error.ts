import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation failed', details: err.flatten() });
    return;
  }
  if (err instanceof Error) {
    // eslint-disable-next-line no-console
    console.error('[error]', err.message);
    res.status(500).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: 'Unknown error' });
}
