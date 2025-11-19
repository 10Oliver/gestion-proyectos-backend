import { Router } from 'express';
import { z } from 'zod';

import {
  attendEvent,
  getEvent,
  listEvents,
  patchEvent,
  postEvent,
  removeEvent,
  unAttendEvent,
} from '../controllers/event.controller';
import { authenticate } from '../middlewares/authentication';
import { validateBody, validateParams, validateQuery } from '../middlewares/validate';

const router = Router();

const idSchema = z.object({ id: z.string().min(1) });
const attendeeParamsSchema = z.object({ id: z.string().min(1), userId: z.string().min(1) });
const listQuerySchema = z.object({
  sort: z.enum(['asc', 'desc']).optional(),
  limit: z.coerce.number().min(1).max(50).optional(),
});

const eventBodySchema = z.object({
  title: z.string().min(3).max(140),
  description: z.string().max(2000).optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  capacity: z.coerce.number().int().positive().optional().nullable(),
  categoryId: z.coerce.number().int().positive(),
});

const eventPatchSchema = eventBodySchema.partial();

router.get('/', validateQuery(listQuerySchema), listEvents);
router.get('/:id', validateParams(idSchema), getEvent);
router.post('/', authenticate, validateBody(eventBodySchema), postEvent);
router.patch('/:id', authenticate, validateParams(idSchema), validateBody(eventPatchSchema), patchEvent);
router.delete('/:id', authenticate, validateParams(idSchema), removeEvent);
router.post('/:id/attendees', authenticate, validateParams(idSchema), attendEvent);
router.delete(
  '/:id/attendees/:userId',
  authenticate,
  validateParams(attendeeParamsSchema),
  unAttendEvent,
);

export default router;
