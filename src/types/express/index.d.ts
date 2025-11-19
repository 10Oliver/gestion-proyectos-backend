import type { User } from '../../database/models/user.model';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      tokenId?: string;
    }
  }
}

export {};
