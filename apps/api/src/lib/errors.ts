import { type Request, type Response, type NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from './logger.js';

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const Errors = {
  unauthorized: () => new AppError('UNAUTHORIZED', 'Unauthorized', 401),
  forbidden: () => new AppError('FORBIDDEN', 'Forbidden', 403),
  notFound: (resource: string) => new AppError('NOT_FOUND', `${resource} not found`, 404),
  conflict: (msg: string) => new AppError('CONFLICT', msg, 409),
  unprocessable: (msg: string, details?: unknown) =>
    new AppError('UNPROCESSABLE', msg, 422, details),
  internal: () => new AppError('INTERNAL', 'Internal server error', 500),
};

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      ok: false,
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(422).json({
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.flatten().fieldErrors,
      },
    });
    return;
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ ok: false, error: { code: 'INTERNAL', message: 'Internal server error' } });
}
