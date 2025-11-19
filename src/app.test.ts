import { describe, expect, it } from 'vitest';
import request from 'supertest';

import app from './app';

describe('health endpoint', () => {
  it('returns ok', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'ok' });
  });
});
