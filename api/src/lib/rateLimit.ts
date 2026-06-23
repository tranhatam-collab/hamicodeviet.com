/**
 * Rate limiter using Durable Objects for globally consistent counting.
 *
 * Durable Objects provide strongly consistent, single-instance storage
 * that is shared across all Cloudflare POPs — unlike Cache API which
 * is local to each edge location.
 *
 * Rate limit matrix (per audit recommendation):
 *   Login by IP:          10 / 10 min
 *   Login by email:        5 / 15 min
 *   Signup:                5 / hour / IP
 *   Resend verification:   3 / hour / account
 *   Forgot password:       3 / hour / account
 *   Guardian invitation:   5 / day / learner
 *   Consent verification:  5 / hour
 *   Payment creation:     10 / 10 min / account
 *   General API:         100 / min
 */

export interface RateLimitConfig {
  limit: number;
  windowSec: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'auth:login': { limit: 10, windowSec: 600 },       // 10 / 10 min
  'auth:signup': { limit: 5, windowSec: 3600 },      // 5 / hour
  'auth:forgot': { limit: 3, windowSec: 3600 },      // 3 / hour
  'auth:resend': { limit: 3, windowSec: 3600 },      // 3 / hour
  'auth:verify': { limit: 10, windowSec: 600 },      // 10 / 10 min
  'auth:reset': { limit: 5, windowSec: 600 },        // 5 / 10 min
  'guardian:declare': { limit: 5, windowSec: 86400 }, // 5 / day
  'consent:grant': { limit: 20, windowSec: 3600 },   // 20 / hour
  'payment:checkout': { limit: 10, windowSec: 600 }, // 10 / 10 min
  'admin:write': { limit: 60, windowSec: 60 },       // 60 / min
  'general': { limit: 100, windowSec: 60 },           // 100 / min
};

export function getRateLimitConfig(path: string, method: string): { config: RateLimitConfig; bucket: string } {
  // Auth endpoints with specific limits
  if (path === '/auth/login' && method === 'POST') return { config: RATE_LIMITS['auth:login'], bucket: 'auth:login' };
  if (path === '/auth/signup' && method === 'POST') return { config: RATE_LIMITS['auth:signup'], bucket: 'auth:signup' };
  if (path === '/auth/forgot-password' && method === 'POST') return { config: RATE_LIMITS['auth:forgot'], bucket: 'auth:forgot' };
  if (path === '/auth/resend-verification' && method === 'POST') return { config: RATE_LIMITS['auth:resend'], bucket: 'auth:resend' };
  if (path === '/auth/verify-email' && method === 'POST') return { config: RATE_LIMITS['auth:verify'], bucket: 'auth:verify' };
  if (path === '/auth/reset-password' && method === 'POST') return { config: RATE_LIMITS['auth:reset'], bucket: 'auth:reset' };
  if (path.startsWith('/guardian/declare') && method === 'POST') return { config: RATE_LIMITS['guardian:declare'], bucket: 'guardian:declare' };
  if (path.startsWith('/consent') && method === 'POST') return { config: RATE_LIMITS['consent:grant'], bucket: 'consent:grant' };
  if (path === '/payments/checkout' && method === 'POST') return { config: RATE_LIMITS['payment:checkout'], bucket: 'payment:checkout' };
  if (path.startsWith('/admin/') && method !== 'GET') return { config: RATE_LIMITS['admin:write'], bucket: 'admin:write' };

  // All other auth endpoints
  if (path.startsWith('/auth/')) return { config: RATE_LIMITS['auth:login'], bucket: 'auth:login' };

  // General
  return { config: RATE_LIMITS['general'], bucket: 'general' };
}

/**
 * Check rate limit using Durable Object (globally consistent).
 * Falls back to Cache API if DO binding is not available.
 */
export async function rateLimit(
  ip: string,
  path: string,
  method: string,
  env: Env,
): Promise<{ allowed: boolean; remaining: number; resetAt: number; limit: number }> {
  const { config, bucket } = getRateLimitConfig(path, method);
  const { limit, windowSec } = config;

  // Use Durable Object for global consistency
  if (env.RATE_LIMITER) {
    const doName = `${bucket}:${ip}`;
    const doId = env.RATE_LIMITER.idFromName(doName);
    const doStub = env.RATE_LIMITER.get(doId);

    const response = await doStub.fetch('https://internal/rate-limit', {
      method: 'POST',
      body: JSON.stringify({ limit, windowSec }),
    });
    const result = await response.json<{ allowed: boolean; remaining: number; resetAt: number }>();

    return { ...result, limit };
  }

  // Fallback: Cache API (per-POP, not globally consistent)
  return rateLimitCache(ip, bucket, limit, windowSec, caches.default);
}

/**
 * Cache API fallback rate limiter (per-POP only).
 */
async function rateLimitCache(
  ip: string,
  bucket: string,
  limit: number,
  windowSec: number,
  cache: Cache,
): Promise<{ allowed: boolean; remaining: number; resetAt: number; limit: number }> {
  const now = Math.floor(Date.now() / 1000);
  const resetAt = (Math.floor(now / windowSec) + 1) * windowSec;
  const key = `ratelimit:${bucket}:${ip}:${Math.floor(now / windowSec)}`;
  const cacheKey = new Request(`https://ratelimit.internal/${key}`);

  const cached = await cache.match(cacheKey);
  const count = cached ? (await cached.json<{ count: number }>()).count + 1 : 1;

  const response = new Response(JSON.stringify({ count }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `max-age=${windowSec}`,
    },
  });
  await cache.put(cacheKey, response);

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt,
    limit,
  };
}

export function rateLimitHeaders(remaining: number, resetAt: number, limit: number): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(resetAt),
  };
}
