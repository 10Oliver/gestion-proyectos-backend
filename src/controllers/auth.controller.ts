import { Request, Response, NextFunction } from 'express';

import {
  exchangeFacebookCode,
  exchangeInstagramCode,
  getFacebookAuthUrl,
  getInstagramAuthUrl,
} from '../services/social-auth.service';
import { issueTokenPair, revokeRefreshToken, rotateRefreshToken } from '../services/token.service';
import { findOrCreateSocialUser } from '../services/user.service';
import { serializeUser } from '../utils/serializers';

export const startFacebookAuth = (req: Request, res: Response) => {
  const { redirectUri } = req.body as { redirectUri?: string };
  const payload = getFacebookAuthUrl(redirectUri);
  res.json(payload);
};

export const startInstagramAuth = (req: Request, res: Response) => {
  const { redirectUri } = req.body as { redirectUri?: string };
  const payload = getInstagramAuthUrl(redirectUri);
  res.json(payload);
};

export const exchangeFacebook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, redirectUri, state } = req.body as {
      code: string;
      redirectUri: string;
      state: string;
    };

    const profile = await exchangeFacebookCode(code, redirectUri, state);
    const user = await findOrCreateSocialUser(profile);
    const tokens = await issueTokenPair(user);

    res.json({ ...tokens, user: serializeUser(user) });
  } catch (error) {
    next({ status: 400, message: 'Facebook exchange failed', details: error });
  }
};

export const exchangeInstagram = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, redirectUri, state } = req.body as {
      code: string;
      redirectUri: string;
      state: string;
    };

    const profile = await exchangeInstagramCode(code, redirectUri, state);
    const user = await findOrCreateSocialUser(profile);
    const tokens = await issueTokenPair(user);

    res.json({ ...tokens, user: serializeUser(user) });
  } catch (error) {
    next({ status: 400, message: 'Instagram exchange failed', details: error });
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken: provided } = req.body as { refreshToken: string };
    const tokens = await rotateRefreshToken(provided);
    res.json(tokens);
  } catch (error) {
    next({ status: 401, message: 'Refresh token invalid', details: error });
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken: provided } = req.body as { refreshToken: string };
    await revokeRefreshToken(provided);
    res.status(204).send();
  } catch (error) {
    next({ status: 400, message: 'Unable to revoke refresh token', details: error });
  }
};
