import { randomBytes, timingSafeEqual } from 'crypto';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import IORedis from 'ioredis';

import { Services } from './services';
import { createAuthMiddleware } from '../presentation/middlewares/authMiddleware';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '../shared/auth/constants';

export const buildMiddlewares = (services: Services) => {
  const authMiddleware = createAuthMiddleware(services.authService);
  const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
  const isProduction = process.env.NODE_ENV === 'production';
  const redisUrl = process.env.REDIS_URL?.trim();
  const rateLimitingEnabled = (() => {
    const raw = process.env.RATE_LIMITING_ENABLED;
    if (!raw) return false;
    return !['false', '0', 'off'].includes(raw.toLowerCase().trim());
  })();
  const redisLimiterClient = redisUrl ? new IORedis(redisUrl, { maxRetriesPerRequest: null }) : null;

  const createRateLimiter = (options: {
    keyPrefix: string;
    windowMs: number;
    maxRequests: number;
    message: string;
  }): RequestHandler => {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!rateLimitingEnabled) return next();

      const now = Date.now();
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const key = `${options.keyPrefix}:${ip}`;

      if (redisLimiterClient) {
        try {
          const scriptResult = await redisLimiterClient.multi()
            .incr(key)
            .pexpire(key, options.windowMs, 'NX')
            .pttl(key)
            .exec();
          const count = Number(scriptResult?.[0]?.[1] ?? 0);
          const ttlMs = Number(scriptResult?.[2]?.[1] ?? options.windowMs);
          if (count > options.maxRequests) {
            const retryAfterSeconds = Math.max(1, Math.ceil(ttlMs / 1000));
            res.setHeader('Retry-After', String(retryAfterSeconds));
            return res.status(429).json({
              success: false, code: 'RATE_LIMITED', message: options.message,
              requestId: req.requestId, retryAfterSeconds,
            });
          }
          return next();
        } catch (error) {
          console.error('Redis rate limiter failure:', error);
        }
      }

      const current = rateLimitStore.get(key);
      if (!current || now >= current.resetAt) {
        rateLimitStore.set(key, { count: 1, resetAt: now + options.windowMs });
        return next();
      }
      if (current.count >= options.maxRequests) {
        const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
        res.setHeader('Retry-After', String(retryAfterSeconds));
        return res.status(429).json({
          success: false, code: 'RATE_LIMITED', message: options.message,
          requestId: req.requestId, retryAfterSeconds,
        });
      }
      current.count += 1;
      return next();
    };
  };

  const issueCsrfToken: RequestHandler = (_req: Request, res: Response) => {
    const token = randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
      maxAge: 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({ success: true, token });
  };

  const csrfProtection: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
    const method = req.method.toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next();

    const tokenFromCookie = req.cookies?.[CSRF_COOKIE_NAME];
    const tokenFromHeader = req.headers?.[CSRF_HEADER_NAME] ?? req.headers?.[CSRF_HEADER_NAME.toLowerCase()];
    const headerToken = Array.isArray(tokenFromHeader) ? tokenFromHeader[0] : tokenFromHeader;

    if (typeof tokenFromCookie !== 'string' || typeof headerToken !== 'string') {
      return res.status(403).json({
        success: false, code: 'CSRF_TOKEN_MISSING',
        message: 'CSRF token is required.', requestId: req.requestId,
      });
    }

    const cookieBuffer = Buffer.from(tokenFromCookie);
    const headerBuffer = Buffer.from(headerToken);
    if (cookieBuffer.length !== headerBuffer.length || !timingSafeEqual(cookieBuffer, headerBuffer)) {
      return res.status(403).json({
        success: false, code: 'CSRF_TOKEN_INVALID',
        message: 'CSRF token validation failed.', requestId: req.requestId,
      });
    }
    return next();
  };

  const notFoundMiddleware: RequestHandler = (_req: Request, res: Response) => {
    res.status(404).json({ message: 'Route not found' });
  };

  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
      if (now >= value.resetAt) rateLimitStore.delete(key);
    }
  }, 60_000).unref();

  return {
    authMiddleware,
    issueCsrfToken,
    csrfProtection,
    authRateLimiter: createRateLimiter({
      keyPrefix: 'auth', windowMs: 60_000, maxRequests: 20,
      message: 'Too many authentication attempts. Please try again shortly.',
    }),
    notFoundMiddleware,
  };
};

export type Middlewares = ReturnType<typeof buildMiddlewares>;
