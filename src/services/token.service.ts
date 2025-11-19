import { createHash } from 'node:crypto';

import ms, { StringValue } from 'ms';

import { RefreshToken } from '../database/models/refresh-token.model';
import { User } from '../database/models/user.model';
import { env } from '../config/env';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';

const toExpiryDate = (ttl: string) => {
  const duration = ms(ttl as StringValue);
  if (!duration) {
    throw new Error(`Invalid TTL string: ${ttl}`);
  }
  return new Date(Date.now() + duration);
};

const hashTokenId = (tokenId: string) => createHash('sha256').update(tokenId).digest('hex');

export const issueTokenPair = async (user: User) => {
  const access = signAccessToken(user);
  const refresh = signRefreshToken(user);

  await RefreshToken.create({
    userId: user.id,
    tokenHash: hashTokenId(refresh.jti),
    expiresAt: toExpiryDate(env.refreshTokenTtl),
  });

  return {
    token: access.token,
    refreshToken: refresh.token,
  };
};

export const rotateRefreshToken = async (token: string) => {
  const payload = verifyRefreshToken(token);
  const tokenHash = hashTokenId(payload.jti);
  const stored = await RefreshToken.findOne({ where: { tokenHash, revoked: false } });

  if (!stored) {
    throw Object.assign(new Error('Refresh token not found'), { status: 401 });
  }

  if (stored.expiresAt.getTime() < Date.now()) {
    throw Object.assign(new Error('Refresh token expired'), { status: 401 });
  }

  const user = await User.findByPk(payload.sub);
  if (!user) {
    throw Object.assign(new Error('User not found for refresh token'), { status: 401 });
  }

  await stored.update({ revoked: true });

  return issueTokenPair(user);
};

export const revokeRefreshToken = async (token: string) => {
  const payload = verifyRefreshToken(token);
  const tokenHash = hashTokenId(payload.jti);
  const stored = await RefreshToken.findOne({ where: { tokenHash } });
  if (stored) {
    await stored.update({ revoked: true });
  }
};

export const revokeAllUserTokens = async (userId: string) => {
  await RefreshToken.update({ revoked: true }, { where: { userId } });
};
