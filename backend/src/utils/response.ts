import type { Response } from 'express';

export function success<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  message?: string
): void {
  res.status(statusCode).json({
    success: true,
    ...(message ? { message } : {}),
    data,
  });
}

export function created<T>(res: Response, data: T, message?: string): void {
  success(res, data, 201, message);
}

export function ok<T>(res: Response, data: T, message?: string): void {
  success(res, data, 200, message);
}

export function noContent(res: Response): void {
  res.status(204).send();
}
