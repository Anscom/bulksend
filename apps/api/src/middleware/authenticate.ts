import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../lib/env.js';
import { Errors } from '../lib/errors.js';
import { redis } from '../redis/client.js';
import { jwtBlocklistKey } from '../redis/keys.js';

export interface AuthPayload {
  userId: string;
  workspaceId: string;
  email: string;
  role: string;
  jti: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(Errors.unauthorized());

  const token = header.slice(7);
  let payload: AuthPayload;

  try {
    payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
  } catch {
    return next(Errors.unauthorized());
  }

  // Check blocklist (revoked tokens)
  const blocked = await redis.exists(jwtBlocklistKey(payload.jti));
  if (blocked) return next(Errors.unauthorized());

  req.user = payload;
  next();
}
