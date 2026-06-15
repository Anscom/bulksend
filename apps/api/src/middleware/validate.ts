import { type Request, type Response, type NextFunction } from 'express';
import { type ZodSchema } from 'zod';

type Target = 'body' | 'query' | 'params';

/**
 * Returns middleware that validates req[target] against schema.
 * Throws a ZodError (caught by errorHandler) on failure.
 *
 * Usage: router.post('/', validate('body', CreateCampaignSchema), handler)
 */
export function validate<T>(target: Target, schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) return next(result.error);
    // Replace with parsed/coerced data
    Object.assign(req, { [target]: result.data });
    next();
  };
}
