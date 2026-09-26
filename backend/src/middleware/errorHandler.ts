import { Request, Response, NextFunction } from 'express';
import logger from '../lib/logger';

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  const isProduction = process.env.NODE_ENV === 'production';

  if (err instanceof AppError) {
    logger.warn(
      {
        requestId: req.id,
        statusCode: err.statusCode,
        error: err.message,
        path: req.path,
        method: req.method,
      },
      `Application Warning [${err.statusCode}]: ${err.message}`
    );
    return res.status(err.statusCode).json({ success: false, error: err.message });
  }

  // Structured Logging of Unhandled Error
  logger.error(
    {
      requestId: req.id,
      errorName: err.name,
      errorMessage: err.message,
      stack: isProduction ? undefined : err.stack,
      path: req.path,
      method: req.method,
    },
    `Unhandled Server Exception: ${err.message}`
  );

  // Sanitized Response: Never leak stack traces, database credentials, or Prisma internals in production
  return res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(isProduction ? {} : { debug: err.message }),
  });
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
