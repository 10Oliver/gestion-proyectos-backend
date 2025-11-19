import { Router } from 'express';
import { z } from 'zod';

import { getCategories, postCategory } from '../controllers/category.controller';
import { authenticate, requireRole } from '../middlewares/authentication';
import { validateBody } from '../middlewares/validate';

const router = Router();

const schema = z.object({ name: z.string().min(3).max(100) });

router.get('/', getCategories);
router.post('/', authenticate, requireRole('admin'), validateBody(schema), postCategory);

export default router;
