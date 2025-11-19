import { Router } from 'express';

import authRoutes from './auth.routes';
import categoryRoutes from './category.routes';
import eventRoutes from './event.routes';
import userRoutes from './user.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/events', eventRoutes);
router.use('/users', userRoutes);

export default router;
