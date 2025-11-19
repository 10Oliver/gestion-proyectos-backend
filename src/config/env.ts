import { config as loadEnv } from 'dotenv-safe';

loadEnv({
  allowEmptyValues: false,
  example: '.env.example',
  path: process.env.DOTENV_CONFIG_PATH ?? '.env',
});

const listFromEnv = (value?: string) =>
  value
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtSecret: process.env.JWT_SECRET ?? '',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
  tokenTtl: process.env.TOKEN_TTL ?? '15m',
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL ?? '30d',
  corsOrigins: listFromEnv(process.env.CORS_ORIGINS) ?? [],
  facebook: {
    appId: process.env.FACEBOOK_APP_ID ?? '',
    appSecret: process.env.FACEBOOK_APP_SECRET ?? '',
    redirectUri: process.env.FACEBOOK_REDIRECT_URI ?? '',
  },
  instagram: {
    appId: process.env.INSTAGRAM_APP_ID ?? '',
    appSecret: process.env.INSTAGRAM_APP_SECRET ?? '',
    redirectUri: process.env.INSTAGRAM_REDIRECT_URI ?? '',
  },
  appDeepLinkScheme: process.env.APP_DEEP_LINK_SCHEME ?? '',
  facebookRedirectPath: process.env.APP_REDIRECT_PATH_FACEBOOK ?? '',
  instagramRedirectPath: process.env.APP_REDIRECT_PATH_INSTAGRAM ?? '',
};

if (!env.databaseUrl) {
  throw new Error('DATABASE_URL is required');
}
if (!env.jwtSecret || !env.jwtRefreshSecret) {
  throw new Error('JWT secrets are required');
}
