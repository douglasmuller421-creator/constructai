import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '../utils/errors.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.flatten(),
      },
    });
    return;
  }

  // Operational errors (expected)
  if (err instanceof AppError) {
    const appErr = err as AppError;
    const response: Record<string, unknown> = {
      success: false,
      error: {
        code: appErr.code,
        message: appErr.message,
      },
    };
    if (appErr instanceof ValidationError && appErr.details) {
      (response.error as Record<string, unknown>).details = appErr.details;
    }
    res.status(appErr.statusCode).json(response);
    return;
  }

  // Unexpected errors
  console.error('Unhandled error:', err);
  const message = err instanceof Error ? err.message : 'Unknown error';
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message:
        process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : message,
    },
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  });
}
