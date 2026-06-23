/**
 * Simple IP-based rate limiter using Cloudflare Cache API.
 * Limits: 10 requests/min for auth endpoints, 100 requests/min for others.
 */

const AUTH_LIMIT = 10; // per minute
const AUTH_WINDOW = 60; // seconds
const GENERAL_LIMIT = 100;
const GENERAL_WINDOW = 60;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Workers have no persistent memory between requests,
// so we use the Cache API as a simple key-value store.
export async function rateLimit(
  ip: string,
  path: string,
  isAuthEndpoint: boolean,
  cache: Cache,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const limit = isAuthEndpoint ? AUTH_LIMIT : GENERAL_LIMIT;
  const windowSec = isAuthEndpoint ? AUTH_WINDOW : GENERAL_WINDOW;

  const key = `ratelimit:${isAuthEndpoint ? 'auth' : 'gen'}:${ip}:${Math.floor(Date.now() / 1000 / windowSec)}`;
  const cacheKey = new Request(`https://ratelimit.internal/${key}`);

  const now = Math.floor(Date.now() / 1000);
  const resetAt = (Math.floor(now / windowSec) + 1) * windowSec;

  let entry: RateLimitEntry;
  const cached = await cache.match(cacheKey);
  if (cached) {
    entry = await cached.json();
  } else {
    entry = { count: 0, resetAt };
  }

  entry.count++;

  // Store in cache with TTL
  const response = new Response(JSON.stringify(entry), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `max-age=${windowSec}`,
    },
  });
  await cache.put(cacheKey, response);

  return {
    allowed: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt,
  };
}

export function rateLimitHeaders(remaining: number, resetAt: number, limit: number): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(resetAt),
  };
}
