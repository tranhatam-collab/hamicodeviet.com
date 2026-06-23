import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { rateLimit, rateLimitHeaders } from './lib/rateLimit';
import auth from './routes/auth';
import guardian from './routes/guardian';
import consent from './routes/consent';

const app = new Hono<AppBindings>();

// Middleware
app.use('*', logger());
// Normalize trailing slash: /consent/ -> /consent
app.use('*', async (c, next) => {
  const path = c.req.path;
  if (path.length > 1 && path.endsWith('/')) {
    const query = c.req.query();
    const qs = Object.keys(query).length ? '?' + new URLSearchParams(query).toString() : '';
    return c.redirect(path.slice(0, -1) + qs, 301);
  }
  await next();
});
app.use('*', cors({
  origin: [
    'https://hamicodeviet.com',
    'https://www.hamicodeviet.com',
    'https://app.hamicodeviet.com',
    'http://localhost:4321',
    'http://localhost:3000',
  ],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Rate limiting middleware
app.use('*', async (c, next) => {
  // Skip rate limiting for health check and OPTIONS
  if (c.req.path === '/health' || c.req.method === 'OPTIONS') {
    await next();
    return;
  }

  const ip = c.req.header('cf-connecting-ip') || 'unknown';
  const isAuth = c.req.path.startsWith('/auth/');
  const cache = caches.default;

  const { allowed, remaining, resetAt } = await rateLimit(ip, c.req.path, isAuth, cache);
  const limit = isAuth ? 10 : 100;

  // Add rate limit headers
  const headers = rateLimitHeaders(remaining, resetAt, limit);
  Object.entries(headers).forEach(([k, v]) => c.header(k, v));

  if (!allowed) {
    return c.json({
      error: 'rate_limited',
      message: 'Too many requests. Please try again later.',
      retryAfter: resetAt - Math.floor(Date.now() / 1000),
    }, 429, {
      'Retry-After': String(resetAt - Math.floor(Date.now() / 1000)),
    });
  }

  await next();
});

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes
app.route('/auth', auth);
app.route('/guardian', guardian);
app.route('/consent', consent);

// 404
app.notFound((c) => c.json({ error: 'not_found' }, 404));

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'internal_server_error' }, 500);
});

export default app;
