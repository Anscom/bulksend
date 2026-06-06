import { type Request, type Response, type NextFunction } from 'express';
import { prisma } from '../db/client.js';
import { Errors } from '../lib/errors.js';

/**
 * Sets the PostgreSQL app.workspace_id session variable so RLS policies
 * automatically scope every query to the authenticated tenant.
 * Must run after authenticate().
 */
export async function tenant(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(Errors.unauthorized());

  try {
    await prisma.$executeRaw`SELECT set_config('app.workspace_id', ${req.user.workspaceId}, true)`;
    next();
  } catch (err) {
    next(err);
  }
}
