import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';

/**
 * Replaces req.body with the parsed result, so routes can never spread
 * unvalidated client input into a model.
 */
export const validateBody =
  <T>(schema: ZodType<T>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join('.') || '(body)',
        message: i.message,
      }));
      res.status(400).json({ message: details[0]?.message || 'Invalid request body', details });
      return;
    }

    req.body = result.data;
    next();
  };

export const validateParams =
  <T>(schema: ZodType<T>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      res.status(400).json({ message: result.error.issues[0]?.message || 'Invalid parameters' });
      return;
    }
    next();
  };
