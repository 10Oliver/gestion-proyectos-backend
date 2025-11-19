import { Router } from 'express';
import { z } from 'zod';

import {
  getMe,
  getUser,
  getUserAttendingEvents,
  getUserCreatedEvents,
  updateMe,
} from '../controllers/user.controller';
import { authenticate } from '../middlewares/authentication';
import { validateBody, validateParams } from '../middlewares/validate';

const router = Router();

const updateSchema = z.object({
  description: z.string().max(500).optional(),
  address: z.string().max(255).optional(),
  photoUrl: z.string().url().optional(),
});
const userIdSchema = z.object({ id: z.string().min(1) });

router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, validateBody(updateSchema), updateMe);
router.get('/:id/events/created', validateParams(userIdSchema), getUserCreatedEvents);
router.get('/:id/events/attending', validateParams(userIdSchema), getUserAttendingEvents);
router.get('/:id', validateParams(userIdSchema), getUser);

export default router;
