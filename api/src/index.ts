import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { rateLimit, rateLimitHeaders } from './lib/rateLimit';
import { RateLimiterDurableObject } from './lib/rateLimiterDO';
import { sendEmailDirect } from './lib/email';
import {
  requestIdMiddleware,
  createLogger,
  metricsMiddleware,
  errorLoggingMiddleware,
  redactSensitiveData,
  metrics,
} from './lib/observability';
import { getDb } from './lib/db';
import auth from './routes/auth';
import guardian from './routes/guardian';
import consent from './routes/consent';
import countryPolicy from './routes/countryPolicy';
import courses from './routes/courses';
import progress from './routes/progress';
import payments from './routes/payments';
import admin from './routes/admin';
import products from './routes/products';
import entitlements from './routes/entitlements';
import refunds from './routes/refunds';
import gdpr from './routes/gdpr';
import ai from './routes/ai';
import codelab from './routes/codelab';
import marketplace from './routes/marketplace';
import school from './routes/school';
import contact from './routes/contact';
import portfolio from './routes/portfolio';
import certificates from './routes/certificates';
import notifications from './routes/notifications';
import features from './routes/features';
import projects from './routes/projects';

export { RateLimiterDurableObject };

const app = new Hono<AppBindings>();

// Create logger instance
const apiLogger = createLogger('api');

// Initialize global metrics
(globalThis as any).metrics = metrics;

// Middleware
app.use('*', requestIdMiddleware());
app.use('*', (c, next) => {
  // Set global request ID for logging (cached per request via globalThis - acceptable for Workers single-threaded per request)
  (globalThis as any).requestId = c.get('requestId');
  return next();
});
app.use('*', async (c, next) => {
  // Ensure DB is initialized before any route handler (libs depend on env.DB)
  getDb(c.env);
  await next();
});
app.use('*', metricsMiddleware());
app.use('*', errorLoggingMiddleware(apiLogger));
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

// Rate limiting middleware (Durable Object — globally consistent)
app.use('*', async (c, next) => {
  // Skip rate limiting for health check, webhooks, and OPTIONS
  if (c.req.path === '/health' || c.req.path === '/payments/webhook' || c.req.method === 'OPTIONS') {
    await next();
    return;
  }

  const ip = c.req.header('cf-connecting-ip') || 'unknown';

  const { allowed, remaining, resetAt, limit } = await rateLimit(ip, c.req.path, c.req.method, c.env);

  // Add rate limit headers
  const headers = rateLimitHeaders(remaining, resetAt, limit);
  Object.entries(headers).forEach(([k, v]) => c.header(k, v));

  if (!allowed) {
    const retryAfter = resetAt - Math.floor(Date.now() / 1000);
    return c.json({
      error: 'rate_limited',
      message: 'Too many requests. Please try again later.',
      retryAfter,
    }, 429, {
      'Retry-After': String(retryAfter),
    });
  }

  await next();
});

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Metrics endpoint (for monitoring)
app.get('/metrics', (c) => {
  const metricsData = (globalThis as any).metrics?.toJSON() || {};
  return c.json(metricsData);
});

// Email service diagnostic (admin only — no secrets exposed)
app.get('/health/email', async (c) => {
  const hasKey = !!c.env.RESEND_API_KEY?.trim();
  let resendStatus = 'not_configured';
  if (hasKey) {
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${c.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({ from: 'noreply@hamicodeviet.com', to: ['test@resend.dev'], subject: 'ping', text: 'ping' }),
        signal: AbortSignal.timeout(8000),
      });
      resendStatus = r.status === 200 ? 'ok' : `error_${r.status}`;
    } catch (e: any) {
      resendStatus = 'timeout';
    }
  }
  return c.json({
    provider: 'resend',
    configured: hasKey,
    resend: resendStatus,
  });
});

// Routes
app.route('/auth', auth);
app.route('/guardian', guardian);
app.route('/consent', consent);
app.route('/country-policy', countryPolicy);
app.route('/courses', courses);
app.route('/progress', progress);
app.route('/payments', payments);
app.route('/admin', admin);
app.route('/products', products);
app.route('/entitlements', entitlements);
app.route('/refunds', refunds);
app.route('/gdpr', gdpr);
app.route('/ai', ai);
app.route('/codelab', codelab);
app.route('/marketplace', marketplace);
app.route('/school', school);
app.route('/contact', contact);
app.route('/portfolio', portfolio);
app.route('/certificates', certificates);
app.route('/notifications', notifications);
app.route('/features', features);
app.route('/projects', projects);

// 404
app.notFound((c) => c.json({ error: 'not_found' }, 404));

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'internal_server_error' }, 500);
});

// Queue consumer — processes email delivery with automatic retry + DLQ
export default {
  fetch: app.fetch,
  async queue(batch: MessageBatch<EmailQueueMessage>, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      try {
        const ok = await sendEmailDirect(msg.body, env);
        if (ok) {
          msg.ack();
        } else {
          // Cloudflare will retry up to max_retries, then move to DLQ
          msg.retry();
        }
      } catch (err: any) {
        console.error('[queue] Email delivery error:', err.cause?.code || err.message);
        msg.retry();
      }
    }
  },
};
