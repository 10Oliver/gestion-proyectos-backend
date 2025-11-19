import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny } from 'zod';

type Schema = ZodTypeAny;

export const validateBody = (schema: Schema) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next({ status: 400, message: 'Invalid request body', details: error });
    }
  };

export const validateQuery = (schema: Schema) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
  req.query = schema.parse(req.query) as typeof req.query;
      next();
    } catch (error) {
      next({ status: 400, message: 'Invalid query params', details: error });
    }
  };

export const validateParams = (schema: Schema) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
  req.params = schema.parse(req.params) as typeof req.params;
      next();
    } catch (error) {
      next({ status: 400, message: 'Invalid route params', details: error });
    }
  };
