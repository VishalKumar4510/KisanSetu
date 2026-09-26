import { Request, Response, NextFunction } from 'express';
import pinoHttp from 'pino-http';
import { v4 as uuidv4 } from 'uuid';
import logger from '../lib/logger';

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

/**
 * Validates and extracts an incoming x-request-id or generates a new RFC4122 UUID.
 */
function resolveRequestId(req: Request): string {
  const incomingId = req.headers['x-request-id'];
  if (typeof incomingId === 'string' && /^[a-zA-Z0-9_-]{8,64}$/.test(incomingId.trim())) {
    return incomingId.trim();
  }
  return uuidv4();
}

/**
 * Pino HTTP middleware for request correlation, timing, and structured JSON logging.
 */
export const httpLogger = pinoHttp({
  logger,
  genReqId: (req: any) => {
    const id = resolveRequestId(req);
    req.id = id;
    return id;
  },
  customSuccessMessage: (req: any, res: any) => {
    return `${req.method} ${req.url} completed with status ${res.statusCode}`;
  },
  customErrorMessage: (req: any, res: any, err: any) => {
    return `${req.method} ${req.url} failed with status ${res.statusCode}: ${err.message}`;
  },
  customLogLevel: (req: any, res: any, err: any) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    if (req.url === '/health/live' || req.url === '/health/ready') return 'debug';
    return 'info';
  },
  customProps: (req: any) => ({
    requestId: req.id,
  }),
});

/**
 * Express middleware to ensure x-request-id is set on both request and response headers.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const reqId = resolveRequestId(req);
  req.id = reqId;
  res.setHeader('x-request-id', reqId);
  next();
}
