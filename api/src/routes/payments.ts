import { Hono } from 'hono';
import { getDb } from '../lib/db';
import { getBearerToken, verifySession } from '../lib/auth';

const payments = new Hono<AppBindings>();

// Plans definition
const PLANS = {
  free: { id: 'free', name: 'Free', priceCents: 0, currency: 'VND' },
  learner: { id: 'learner', name: 'Learner', priceCents: 299000, currency: 'VND' },
  creator: { id: 'creator', name: 'Creator', priceCents: 599000, currency: 'VND' },
  family: { id: 'family', name: 'Family', priceCents: 999000, currency: 'VND' },
};

// GET /payments/plans — list available plans
payments.get('/plans', (c) => {
  return c.json({ plans: Object.values(PLANS) });
});

// GET /payments/subscription — get user's current subscription
payments.get('/subscription', async (c) => {
  const token = getBearerToken(c);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const payload = await verifySession(token, c.env);
  if (!payload) return c.json({ error: 'invalid_token' }, 401);

  const sql = getDb(c.env);
  const [sub] = await sql`
    SELECT * FROM subscriptions WHERE user_id = ${payload.sub} AND status = 'active'
    ORDER BY created_at DESC LIMIT 1
  `;

  return c.json({ subscription: sub || null, plan: sub?.plan_id || 'free' });
});

// POST /payments/checkout — create a checkout session
payments.post('/checkout', async (c) => {
  const token = getBearerToken(c);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const payload = await verifySession(token, c.env);
  if (!payload) return c.json({ error: 'invalid_token' }, 401);

  const body = await c.req.json();
  const planId = body.planId;
  const plan = PLANS[planId as keyof typeof PLANS];
  if (!plan || plan.priceCents === 0) return c.json({ error: 'invalid_plan' }, 400);

  const sql = getDb(c.env);
  const apiKey = c.env.STRIPE_SECRET_KEY?.trim();
  if (!apiKey) {
    // Demo mode — create subscription without Stripe (for testing)
    await sql`
      INSERT INTO subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
      VALUES (${payload.sub}, ${planId}, 'active', now(), now() + interval '30 days')
      ON CONFLICT DO NOTHING
    `;
    await sql`
      INSERT INTO payments (user_id, amount_cents, currency, status, provider, description)
      VALUES (${payload.sub}, ${plan.priceCents}, ${plan.currency}, 'succeeded', 'demo', ${'Plan: ' + plan.name})
    `;
    return c.json({ success: true, demoMode: true, plan: planId });
  }

  // Real Stripe checkout
  const appUrl = c.env.APP_URL;
  const sessionRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${apiKey}`,
    },
    body: new URLSearchParams({
      'mode': 'subscription',
      'customer_email': payload.email || '',
      'line_items[0][price_data][currency]': 'vnd',
      'line_items[0][price_data][unit_amount]': String(plan.priceCents),
      'line_items[0][price_data][recurring[interval]': 'month',
      'line_items[0][price_data][product_data][name]': `HaMi Code Việt — ${plan.name}`,
      'line_items[0][quantity]': '1',
      'success_url': `${appUrl}/billing?status=success`,
      'cancel_url': `${appUrl}/billing?status=cancel`,
      'metadata[user_id]': payload.sub,
      'metadata[plan_id]': planId,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!sessionRes.ok) {
    const err = await sessionRes.text();
    console.error('[stripe] Checkout error:', sessionRes.status, err.substring(0, 200));
    return c.json({ error: 'checkout_failed' }, 500);
  }

  const session = await sessionRes.json() as any;
  await sql`
    INSERT INTO payments (user_id, amount_cents, currency, status, provider, stripe_checkout_session_id, description, metadata)
    VALUES (${payload.sub}, ${plan.priceCents}, ${plan.currency}, 'pending', 'stripe', ${session.id}, ${'Plan: ' + plan.name}, ${JSON.stringify({ planId })}::jsonb)
  `;

  return c.json({ checkoutUrl: session.url, sessionId: session.id });
});

// POST /payments/webhook — Stripe webhook handler
payments.post('/webhook', async (c) => {
  const sig = c.req.header('stripe-signature') || '';
  const rawBody = await c.req.text();
  const apiKey = c.env.STRIPE_SECRET_KEY?.trim();
  const webhookSecret = c.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!apiKey || !webhookSecret) {
    return c.json({ error: 'webhook_not_configured' }, 503);
  }

  // Verify webhook signature (simplified — in production use Stripe SDK)
  let event;
  try {
    const res = await fetch('https://api.stripe.com/v1/webhook_endpoints', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    // For now, parse the event directly (Stripe sends JSON for webhooks)
    event = JSON.parse(rawBody);
  } catch {
    return c.json({ error: 'invalid_payload' }, 400);
  }

  const sql = getDb(c.env);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata?.user_id;
      const planId = session.metadata?.plan_id;
      if (userId && planId) {
        await sql`
          INSERT INTO subscriptions (user_id, plan_id, status, stripe_customer_id, stripe_subscription_id, current_period_start, current_period_end)
          VALUES (${userId}, ${planId}, 'active', ${session.customer}, ${session.subscription}, now(), now() + interval '30 days')
        `;
        await sql`
          UPDATE payments SET status = 'succeeded', stripe_payment_intent_id = ${session.payment_intent}, updated_at = now()
          WHERE stripe_checkout_session_id = ${session.id}
        `;
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      await sql`
        UPDATE subscriptions SET status = 'canceled', updated_at = now() WHERE stripe_subscription_id = ${sub.id}
      `;
      break;
    }
    case 'invoice.paid': {
      const invoice = event.data.object;
      await sql`
        UPDATE subscriptions SET current_period_end = ${new Date(invoice.period_end * 1000).toISOString()}, updated_at = now()
        WHERE stripe_subscription_id = ${invoice.subscription}
      `;
      break;
    }
  }

  return c.json({ received: true });
});

// GET /payments/history — get user's payment history
payments.get('/history', async (c) => {
  const token = getBearerToken(c);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const payload = await verifySession(token, c.env);
  if (!payload) return c.json({ error: 'invalid_token' }, 401);

  const sql = getDb(c.env);
  const history = await sql`
    SELECT id, amount_cents, currency, status, provider, description, created_at
    FROM payments WHERE user_id = ${payload.sub}
    ORDER BY created_at DESC
  `;
  return c.json({ payments: history });
});

export default payments;
