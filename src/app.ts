import cookieParser from 'cookie-parser';
import cors from 'cors';
import { randomUUID } from 'crypto';
import express, { NextFunction, Request, Response } from 'express';
import path from 'path';
import swaggerUi from 'swagger-ui-express';

import { DomainError } from './domain/errors/DomainError';
import { getDatabaseConnection } from './infrastructure/database';
import { swaggerSpec } from './infrastructure/docs/swagger';
import { opsTelemetry } from './infrastructure/observability/opsTelemetry';
import { normalizeErrorContract } from './presentation/errors/errorContract';

const isProduction = process.env.NODE_ENV === 'production';
const apiContractV2Enabled = (() => {
  const raw = process.env.API_CONTRACT_V2_ENABLED;
  if (!raw) return false;
  return !['false', '0', 'off'].includes(raw.trim().toLowerCase());
})();

export const createApp = (registerRoutes?: (app: express.Application) => void) => {
  const app = express();

  // --- Request ID ---
  app.use((req: Request, res: Response, next: NextFunction) => {
    const incomingRequestId = req.headers['x-request-id'];
    const requestId =
      typeof incomingRequestId === 'string' && incomingRequestId.trim()
        ? incomingRequestId.trim()
        : randomUUID();
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  });

  // --- Ops telemetry ---
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const durationMs = Date.now() - start;
      const routeKey = req.baseUrl ? `${req.baseUrl}${req.path}` : req.path;
      opsTelemetry.recordRequest(routeKey || req.path || 'unknown', res.statusCode, durationMs);
    });
    next();
  });

  // --- CORS ---
  const corsOrigins = (() => {
    const raw = process.env.CORS_ORIGIN;
    if (!raw) return ['http://localhost:3000'];
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  })();

  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
      optionsSuccessStatus: 204,
    })
  );
  app.options(/.*/, cors());

  // --- Body parsing ---
  app.use(
    express.json({
      limit: '10mb',
      verify: (req, _res, buf) => {
        (req as Request).rawBody = Buffer.from(buf);
      }
    })
  );
  app.use(cookieParser());

  // --- Static files ---
  app.use('/reports', express.static(path.join(process.cwd(), 'generated', 'reports')));

  // --- Swagger docs ---
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // --- Health check ---
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // --- Readiness check ---
  app.get('/ready', async (_req, res) => {
    const db = getDatabaseConnection();
    let dbReady = false;
    try {
      await db.authenticate();
      dbReady = true;
    } catch {
      dbReady = false;
    }
    return res.status(dbReady ? 200 : 503).json({
      status: dbReady ? 'ready' : 'not_ready',
      checks: { database: dbReady ? 'ok' : 'failed' }
    });
  });

  // --- Ops endpoints ---
  app.get('/ops/metrics', (_req, res) => {
    return res.status(200).json({ success: true, data: opsTelemetry.snapshot() });
  });

  app.get('/ops/slo', (_req, res) => {
    return res.status(200).json({
      success: true,
      data: {
        ...opsTelemetry.sloSnapshot(),
        provenance: {
          telemetryType: 'in_memory_runtime_local',
          durableEvidence: false,
          limitation: 'Resets on process restart; intended for runtime diagnostics, not historical compliance evidence.'
        }
      }
    });
  });

  app.get('/ops/alerts', (_req, res) => {
    const alerts = opsTelemetry.alertCandidates();
    return res.status(200).json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        count: alerts.length,
        alerts
      }
    });
  });

  // --- Global error handler (must be last) ---
  app.use((error: any, req: Request, res: Response, _next: NextFunction) => {
    const method = req.method;
    const url = req.originalUrl;
    const requestId = req.requestId ?? 'unknown';
    const status = error instanceof DomainError ? error.statusCode : 500;
    const code = error instanceof DomainError ? error.code : 'INTERNAL_SERVER_ERROR';

    console.error(JSON.stringify({
      level: 'error',
      requestId,
      method,
      url,
      status,
      code,
      message: error?.message,
    }));

    const normalized = normalizeErrorContract(error);

    if (apiContractV2Enabled) {
      return res.status(normalized.statusCode).json({
        success: false,
        error: { code: normalized.code, message: normalized.message, details: normalized.details },
        requestId
      });
    }

    if (error instanceof DomainError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.code,
        details: error.details ?? {},
        requestId
      });
    }

    return res.status(normalized.statusCode).json({
      success: false,
      message: isProduction ? normalized.message : error?.message || normalized.message,
      code: normalized.code,
      details: normalized.details,
      requestId
    });
  });

  return app;
};
