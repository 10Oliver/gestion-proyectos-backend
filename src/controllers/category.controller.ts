import { NextFunction, Request, Response } from 'express';

import { createCategory, listCategories } from '../services/category.service';
import { serializeCategory } from '../utils/serializers';

export const getCategories = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await listCategories();
    res.json(categories.map(serializeCategory));
  } catch (error) {
    next(error);
  }
};

type CategoryPayload = {
  name: string;
};

export const postCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body as CategoryPayload;
    const category = await createCategory(name);
    res.status(201).json(serializeCategory(category));
  } catch (error) {
    next(error);
  }
};
