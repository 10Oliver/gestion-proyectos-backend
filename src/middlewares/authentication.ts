import { NextFunction, Request, Response } from 'express';

import { User } from '../database/models/user.model';
import { verifyAccessToken } from '../utils/jwt';

const getTokenFromRequest = (req: Request) => {
  const header = req.headers.authorization;
  if (!header) return null;
  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) return null;
  return token;
};

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ message: 'Missing Authorization header' });
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findByPk(payload.sub);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token subject' });
    }

    req.user = user;
    req.tokenId = payload.jti;
    next();
  } catch (error) {
    next({ status: 401, message: 'Invalid or expired token', details: error });
  }
};

export const requireRole = (...roles: Array<'user' | 'admin'>) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
