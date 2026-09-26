import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';

export function validateBody(schema: ZodType) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues || [];
        const errorMessages = issues.map(e => `${e.path.join('.') || 'body'}: ${e.message}`).join(', ');
        return res.status(400).json({
          success: false,
          error: `Validation error: ${errorMessages}`,
          details: issues.map(e => ({
            field: e.path.join('.') || 'body',
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
}

export function validateQuery(schema: ZodType) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = (await schema.parseAsync(req.query)) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues || [];
        const errorMessages = issues.map(e => `${e.path.join('.') || 'query'}: ${e.message}`).join(', ');
        return res.status(400).json({
          success: false,
          error: `Validation error: ${errorMessages}`,
          details: issues.map(e => ({
            field: e.path.join('.') || 'query',
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
}

export function validateParams(schema: ZodType) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = (await schema.parseAsync(req.params)) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues || [];
        const errorMessages = issues.map(e => `${e.path.join('.') || 'param'}: ${e.message}`).join(', ');
        return res.status(400).json({
          success: false,
          error: `Validation error: ${errorMessages}`,
          details: issues.map(e => ({
            field: e.path.join('.') || 'param',
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
}
