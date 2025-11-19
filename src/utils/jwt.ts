import { randomUUID } from 'node:crypto';

import jwt, { JwtPayload, SignOptions, Secret } from 'jsonwebtoken';

import { User } from '../database/models/user.model';
import { env } from '../config/env';

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  role: string;
  provider: string;
  jti: string;
}

export interface RefreshTokenPayload extends JwtPayload {
  sub: string;
  jti: string;
  type: 'refresh';
}

export const signAccessToken = (user: User) => {
  const jti = randomUUID();
  const token = jwt.sign(
    {
      sub: user.id,
      role: user.role,
      provider: user.provider,
    },
  env.jwtSecret as Secret,
    { expiresIn: env.tokenTtl as SignOptions['expiresIn'], jwtid: jti },
  );
  return { token, jti };
};

export const signRefreshToken = (user: User) => {
  const jti = randomUUID();
  const token = jwt.sign(
    {
      sub: user.id,
      type: 'refresh',
    },
  env.jwtRefreshSecret as Secret,
    { expiresIn: env.refreshTokenTtl as SignOptions['expiresIn'], jwtid: jti },
  );
  return { token, jti };
};

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.jwtSecret) as AccessTokenPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, env.jwtRefreshSecret) as RefreshTokenPayload;
