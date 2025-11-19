import { randomUUID } from 'node:crypto';

import axios from 'axios';
import jwt from 'jsonwebtoken';

import { env } from '../config/env';

export type SocialProvider = 'facebook' | 'instagram';

interface StatePayload {
  provider: SocialProvider;
  nonce: string;
  redirectUri: string;
}

export interface SocialProfile {
  provider: SocialProvider;
  providerUserId: string;
  name: string;
  email?: string | null;
  avatarUrl?: string | null;
}

interface FacebookTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface FacebookUserResponse {
  id: string;
  name: string;
  email?: string;
  picture?: {
    data?: {
      url?: string;
    };
  };
}

interface InstagramTokenResponse {
  access_token: string;
  user_id: string;
}

interface InstagramUserResponse {
  id: string;
  username: string;
  name?: string;
  account_type?: string;
}

const buildStateToken = (provider: SocialProvider, redirectUri: string) =>
  jwt.sign({ provider, nonce: randomUUID(), redirectUri } satisfies StatePayload, env.jwtSecret, {
    expiresIn: '10m',
  });

const verifyStateToken = (token: string, provider: SocialProvider, redirectUri: string) => {
  const payload = jwt.verify(token, env.jwtSecret) as StatePayload;
  if (payload.provider !== provider) {
    throw new Error('Invalid state provider');
  }
  if (payload.redirectUri !== redirectUri) {
    throw new Error('Redirect URI mismatch');
  }
};

export const getFacebookAuthUrl = (redirectUri?: string) => {
  const finalRedirect = redirectUri ?? env.facebook.redirectUri;
  const state = buildStateToken('facebook', finalRedirect);
  const url = new URL('https://www.facebook.com/v18.0/dialog/oauth');
  url.searchParams.set('client_id', env.facebook.appId);
  url.searchParams.set('redirect_uri', finalRedirect);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'public_profile,email');
  url.searchParams.set('state', state);

  return { authUrl: url.toString(), state };
};

export const getInstagramAuthUrl = (redirectUri?: string) => {
  const finalRedirect = redirectUri ?? env.instagram.redirectUri;
  const state = buildStateToken('instagram', finalRedirect);
  const url = new URL('https://api.instagram.com/oauth/authorize');
  url.searchParams.set('client_id', env.instagram.appId);
  url.searchParams.set('redirect_uri', finalRedirect);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'user_profile,user_media');
  url.searchParams.set('state', state);

  return { authUrl: url.toString(), state };
};

export const exchangeFacebookCode = async (code: string, redirectUri: string, state: string) => {
  verifyStateToken(state, 'facebook', redirectUri);

  const tokenResponse = await axios.get<FacebookTokenResponse>(
    'https://graph.facebook.com/v18.0/oauth/access_token',
    {
      params: {
        client_id: env.facebook.appId,
        client_secret: env.facebook.appSecret,
        redirect_uri: redirectUri,
        code,
      },
    },
  );

  const userResponse = await axios.get<FacebookUserResponse>('https://graph.facebook.com/v18.0/me', {
    params: {
      fields: 'id,name,email,picture{url}',
      access_token: tokenResponse.data.access_token,
    },
  });

  const data = userResponse.data;

  const profile: SocialProfile = {
    provider: 'facebook',
    providerUserId: data.id,
    name: data.name,
    email: data.email ?? null,
    avatarUrl: data.picture?.data?.url ?? null,
  };

  return profile;
};

export const exchangeInstagramCode = async (code: string, redirectUri: string, state: string) => {
  verifyStateToken(state, 'instagram', redirectUri);

  const params = new URLSearchParams({
    client_id: env.instagram.appId,
    client_secret: env.instagram.appSecret,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    code,
  });

  const tokenResponse = await axios.post<InstagramTokenResponse>(
    'https://api.instagram.com/oauth/access_token',
    params,
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    },
  );

  const userResponse = await axios.get<InstagramUserResponse>('https://graph.instagram.com/me', {
    params: {
      fields: 'id,username,account_type,name',
      access_token: tokenResponse.data.access_token,
    },
  });

  const data = userResponse.data;

  const profile: SocialProfile = {
    provider: 'instagram',
    providerUserId: data.id,
    name: data.name ?? data.username,
    email: null,
    avatarUrl: null,
  };

  return profile;
};
