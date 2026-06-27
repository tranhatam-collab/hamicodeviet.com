import { Hono } from 'hono';
import { getDb } from '../lib/db';
import { getBearerToken, verifySession } from '../lib/auth';
import { PayPalClient } from '../lib/paypal';
import { grantSubscriptionEntitlements } from '../lib/entitlement';

const payments = new Hono<AppBindings>();

// Plans definition — USD because PayPal does not support VND for checkout
const PLANS = {
  free: { id: 'free', name: 'Free', priceCents: 0, currency: 'USD' },
  learner: { id: 'learner', name: 'Learner', priceCents: 1200, currency: 'USD' },
  creator: { id: 'creator', name: 'Creator', priceCents: 2400, currency: 'USD' },
  family: { id: 'family', name: 'Family', priceCents: 4000, currency: 'USD' },
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

// POST /payments/checkout — create a PayPal order
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
  const clientId = c.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = c.env.PAYPAL_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    // Demo mode — create subscription without PayPal (for testing)
    await sql`
      INSERT INTO subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
      VALUES (${payload.sub}, ${planId}, 'active', now(), now() + interval '30 days')
      ON CONFLICT DO NOTHING
    `;
    await sql`
      INSERT INTO payments (user_id, amount_cents, currency, status, provider, description)
      VALUES (${payload.sub}, ${plan.priceCents}, ${plan.currency}, 'succeeded', 'demo', ${'Plan: ' + plan.name})
    `;
    // Grant entitlements based on subscription
    await grantSubscriptionEntitlements(c.env, payload.sub, planId);
    return c.json({ success: true, demoMode: true, plan: planId });
  }

  // Real PayPal checkout
  try {
    const paypal = new PayPalClient(c.env);
    const appUrl = c.env.APP_URL;

    // Create order using REST API
    const order = await paypal.createOrder({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: plan.currency,
            value: (plan.priceCents / 100).toFixed(2),
          },
          description: `HaMi Code Việt — ${plan.name}`,
          custom_id: `${payload.sub}:${planId}`,
        },
      ],
      application_context: {
        return_url: `${appUrl}/billing?status=success`,
        cancel_url: `${appUrl}/billing?status=cancel`,
        brand_name: 'HaMi Code Việt',
        user_action: 'PAY_NOW',
      },
    });

    // Store payment record
    await sql`
      INSERT INTO payments (user_id, amount_cents, currency, status, provider, description, metadata)
      VALUES (${payload.sub}, ${plan.priceCents}, ${plan.currency}, 'pending', 'paypal', ${'Plan: ' + plan.name}, ${JSON.stringify({ planId, orderId: order.id })}::jsonb)
    `;

    // Extract approval URL
    const approvalUrl = order.links?.find((link) => link.rel === 'approve')?.href;

    return c.json({
      checkoutUrl: approvalUrl,
      orderId: order.id,
    });
  } catch (error) {
    console.error('[paypal] Checkout error:', error instanceof Error ? error.message : String(error));
    return c.json({ error: 'checkout_failed', detail: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// POST /payments/capture — capture PayPal payment
payments.post('/capture', async (c) => {
  const token = getBearerToken(c);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const payload = await verifySession(token, c.env);
  if (!payload) return c.json({ error: 'invalid_token' }, 401);

  const body = await c.req.json();
  const orderId = body.orderId;

  if (!orderId) {
    return c.json({ error: 'missing_order_id' }, 400);
  }

  try {
    const paypal = new PayPalClient(c.env);
    const sql = getDb(c.env);

    // Capture payment
    const capture = await paypal.captureOrder(orderId);

    if (capture.status === 'COMPLETED') {
      // Extract custom_id to get user_id and plan_id
      const customId = capture.purchase_units?.[0]?.custom_id;
      const [userId, planId] = customId?.split(':') || [];

      if (userId && planId) {
        // Create subscription
        await sql`
          INSERT INTO subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
          VALUES (${userId}, ${planId}, 'active', now(), now() + interval '30 days')
          ON CONFLICT DO NOTHING
        `;

        // Grant entitlements based on subscription
        await grantSubscriptionEntitlements(c.env, userId, planId);

        // Update payment record
        await sql`
          UPDATE payments
          SET status = 'succeeded', updated_at = now()
          WHERE metadata->>'orderId' = ${orderId}
        `;

        return c.json({ success: true, planId });
      }
    }

    return c.json({ error: 'capture_failed', status: capture.status }, 500);
  } catch (error) {
    console.error('[paypal] Capture error:', error instanceof Error ? error.message : String(error));
    return c.json({ error: 'capture_failed', detail: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// POST /payments/webhook — PayPal webhook handler
payments.post('/webhook', async (c) => {
  const rawBody = await c.req.text();
  const clientId = c.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = c.env.PAYPAL_CLIENT_SECRET?.trim();
  const webhookId = c.env.PAYPAL_WEBHOOK_ID?.trim();

  if (!clientId || !clientSecret || !webhookId) {
    return c.json({ error: 'webhook_not_configured' }, 503);
  }

  try {
    const event = JSON.parse(rawBody);
    const sql = getDb(c.env);

    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED': {
        const resource = event.resource;
        const customId = resource.purchase_units?.[0]?.custom_id;
        const [userId, planId] = customId?.split(':') || [];

        if (userId && planId) {
          await sql`
            INSERT INTO subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
            VALUES (${userId}, ${planId}, 'active', now(), now() + interval '30 days')
            ON CONFLICT DO NOTHING
          `;
          await sql`
            UPDATE payments
            SET status = 'succeeded', updated_at = now()
            WHERE metadata->>'orderId' = ${resource.id}
          `;
        }
        break;
      }
      case 'BILLING.SUBSCRIPTION.CANCELLED': {
        const resource = event.resource;
        await sql`
          UPDATE subscriptions SET status = 'canceled', updated_at = now()
          WHERE stripe_subscription_id = ${resource.id}
        `;
        break;
      }
    }

    return c.json({ received: true });
  } catch (error) {
    console.error('[paypal] Webhook error:', error instanceof Error ? error.message : String(error));
    return c.json({ error: 'webhook_error' }, 500);
  }
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
