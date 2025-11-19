import { Router } from 'express';
import { z } from 'zod';

import {
  exchangeFacebook,
  exchangeInstagram,
  logout,
  refreshToken,
  startFacebookAuth,
  startInstagramAuth,
} from '../controllers/auth.controller';
import { validateBody } from '../middlewares/validate';

const router = Router();

const startSchema = z.object({ redirectUri: z.string().url().optional() });
const exchangeSchema = z.object({
  code: z.string().min(1),
  redirectUri: z.string().url(),
  state: z.string().min(10),
});
const refreshSchema = z.object({ refreshToken: z.string().min(10) });

router.post('/facebook/start', validateBody(startSchema), startFacebookAuth);
router.post('/instagram/start', validateBody(startSchema), startInstagramAuth);
router.post('/facebook/exchange', validateBody(exchangeSchema), exchangeFacebook);
router.post('/instagram/exchange', validateBody(exchangeSchema), exchangeInstagram);
router.post('/refresh', validateBody(refreshSchema), refreshToken);
router.post('/logout', validateBody(refreshSchema), logout);

export default router;
