import { describe, it, expect } from 'vitest';
import worker from '../src/index';

// Minimal mock environment for smoke tests
function createMockRateLimiter() {
  return {
    idFromName: (_name: string) => ({ id: 'mock' } as any),
    get: (_id: any) => ({
      fetch: async () =>
        new Response(JSON.stringify({ allowed: true, remaining: 100, resetAt: Date.now() + 60000 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    }),
  } as any;
}

function createMockEnv(): Env {
  return {
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://test:test@localhost/test',
    JWT_SECRET: 'test-secret-32-characters-long',
    APP_URL: 'https://app.hamicodeviet.com',
    RESEND_API_KEY: 'test-key',
    PAYPAL_CLIENT_ID: 'test-client-id',
    PAYPAL_CLIENT_SECRET: 'test-client-secret',
    PAYPAL_WEBHOOK_ID: 'test-webhook-id',
    PAYPAL_MODE: 'sandbox',
    RATE_LIMITER: createMockRateLimiter(),
    EMAIL_QUEUE: {} as any,
    EMAIL_DLQ: {} as any,
  };
}

describe('Smoke Tests', () => {
  it('GET /health returns ok', async () => {
    const env = createMockEnv();
    const req = new Request('https://api.hamicodeviet.com/health', { method: 'GET' });
    const res = await worker.fetch(req, env, {} as any);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  it('GET /metrics returns counters', async () => {
    const env = createMockEnv();
    const req = new Request('https://api.hamicodeviet.com/metrics', { method: 'GET' });
    const res = await worker.fetch(req, env, {} as any);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('counters');
    expect(body).toHaveProperty('histograms');
  });

  it('GET unknown route returns 404', async () => {
    const env = createMockEnv();
    const req = new Request('https://api.hamicodeviet.com/unknown', { method: 'GET' });
    const res = await worker.fetch(req, env, {} as any);

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('not_found');
  });

  it('OPTIONS /courses with allowed origin returns CORS headers', async () => {
    const env = createMockEnv();
    const req = new Request('https://api.hamicodeviet.com/courses', {
      method: 'OPTIONS',
      headers: { Origin: 'https://app.hamicodeviet.com' },
    });
    const res = await worker.fetch(req, env, {} as any);

    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://app.hamicodeviet.com');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('GET /payments/plans returns plans', async () => {
    const env = createMockEnv();
    const req = new Request('https://api.hamicodeviet.com/payments/plans', { method: 'GET' });
    const res = await worker.fetch(req, env, {} as any);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.plans).toBeInstanceOf(Array);
    expect(body.plans.length).toBeGreaterThan(0);
  });

  it('POST /products without auth returns 401', async () => {
    const env = createMockEnv();
    const req = new Request('https://api.hamicodeviet.com/products', { method: 'POST' });
    const res = await worker.fetch(req, env, {} as any);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('unauthorized');
  });

  it('POST /refunds/request without auth returns 401', async () => {
    const env = createMockEnv();
    const req = new Request('https://api.hamicodeviet.com/refunds/request', { method: 'POST' });
    const res = await worker.fetch(req, env, {} as any);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('unauthorized');
  });
});
