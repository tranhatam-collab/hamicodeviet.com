import { Hono } from 'hono';
import { getDb } from '../lib/db';
import { getBearerToken, verifySession } from '../lib/auth';
import { requireAdmin, logAuditEvent } from '../lib/permissions';
import { revokeSubscriptionEntitlements } from '../lib/entitlement';
import { PayPalClient, PayPalEnvironment } from '@paypal/paypal-server-sdk';

const refunds = new Hono<AppBindings>();

// Get PayPal client
function getPayPalClient(env: Env) {
  const environment = env.PAYPAL_MODE === 'live'
    ? new PayPalEnvironment.Live(env.PAYPAL_CLIENT_ID, env.PAYPAL_CLIENT_SECRET)
    : new PayPalEnvironment.Sandbox(env.PAYPAL_CLIENT_ID, env.PAYPAL_CLIENT_SECRET);

  return new PayPalClient(environment);
}

// Admin middleware
refunds.use('*', async (c, next) => {
  const token = getBearerToken(c);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const payload = await verifySession(token, c.env);
  if (!payload) return c.json({ error: 'invalid_token' }, 401);

  c.set('user', payload);
  c.set('requestId', c.req.header('x-request-id') || 'unknown');

  await next();
});

// GET /refunds — list all refunds (admin only)
refunds.get('/', requireAdmin(), async (c) => {
  const sql = getDb(c.env);
  const page = Number(c.req.query('page')) || 1;
  const limit = Math.min(Number(c.req.query('limit')) || 20, 100);
  const offset = (page - 1) * limit;

  const refundList = await sql`
    SELECT r.*, p.amount_cents as original_amount, p.description
    FROM refunds r
    JOIN payments p ON r.payment_id = p.id
    ORDER BY r.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  const [count] = await sql`SELECT COUNT(*) as total FROM refunds`;

  return c.json({ refunds: refundList, total: count.total, page, limit });
});

// GET /refunds/me — get current user's refunds
refunds.get('/me', async (c) => {
  const token = getBearerToken(c);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const payload = await verifySession(token, c.env);
  if (!payload) return c.json({ error: 'invalid_token' }, 401);

  const sql = getDb(c.env);
  const refundList = await sql`
    SELECT r.*, p.amount_cents as original_amount, p.description
    FROM refunds r
    JOIN payments p ON r.payment_id = p.id
    WHERE r.user_id = ${payload.sub}
    ORDER BY r.created_at DESC
  `;
  return c.json({ refunds: refundList });
});

// POST /refunds/request — request refund (user)
refunds.post('/request', async (c) => {
  const body = await c.req.json();
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  // Get payment
  const [payment] = await sql`
    SELECT * FROM payments WHERE id = ${body.paymentId} AND user_id = ${user.id}
  `;
  if (!payment) return c.json({ error: 'payment_not_found' }, 404);

  // Check if payment is refundable (within 30 days)
  const paymentDate = new Date(payment.created_at);
  const now = new Date();
  const daysSincePayment = Math.floor((now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSincePayment > 30) {
    return c.json({ error: 'refund_period_expired' }, 400);
  }

  // Check if refund already exists
  const [existingRefund] = await sql`
    SELECT * FROM refunds WHERE payment_id = ${body.paymentId}
  `;
  if (existingRefund) {
    return c.json({ error: 'refund_already_exists' }, 400);
  }

  // Create refund request
  const [refund] = await sql`
    INSERT INTO refunds (payment_id, user_id, amount_cents, currency, reason, status)
    VALUES (${body.paymentId}, ${user.id}, ${payment.amount_cents}, ${payment.currency}, ${body.reason || ''}, 'pending')
    RETURNING *
  `;

  return c.json({ refund }, 201);
});

// POST /refunds/:id/approve — approve and process refund (admin only)
refunds.post('/:id/approve', requireAdmin(), async (c) => {
  const id = c.req.param('id');
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  // Get refund
  const [refund] = await sql`
    SELECT r.*, p.stripe_payment_intent_id, p.metadata
    FROM refunds r
    JOIN payments p ON r.payment_id = p.id
    WHERE r.id = ${id}
  `;
  if (!refund) return c.json({ error: 'refund_not_found' }, 404);
  if (refund.status !== 'pending') return c.json({ error: 'refund_not_pending' }, 400);

  const clientId = c.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = c.env.PAYPAL_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    // Demo mode — approve without PayPal
    await sql`
      UPDATE refunds
      SET status = 'approved', processed_by = ${user.id}, processed_at = now(), updated_at = now()
      WHERE id = ${id}
    `;

    // Revoke entitlements if subscription payment
    const planId = refund.metadata?.planId;
    if (planId) {
      await revokeSubscriptionEntitlements(c.env, refund.user_id, planId);
    }

    await logAuditEvent(c.env, {
      actor_id: user.id,
      actor_type: 'user',
      action: 'refund.approve',
      resource_type: 'refund',
      resource_id: id,
      changes: { status: 'approved' },
      ip: c.req.header('cf-connecting-ip'),
      user_agent: c.req.header('user-agent'),
      request_id: c.get('requestId'),
    });

    return c.json({ success: true, demoMode: true });
  }

  // Real PayPal refund
  try {
    const paypal = getPayPalClient(c.env);
    const orderId = refund.metadata?.orderId;

    if (!orderId) {
      return c.json({ error: 'no_order_id' }, 400);
    }

    // Create refund
    const refundResult = await paypal.payments.capturesRefund(orderId, {
      amount: {
        currency_code: refund.currency,
        value: (refund.amount_cents / 100).toFixed(2),
      },
    });

    if (refundResult.status === 'COMPLETED') {
      await sql`
        UPDATE refunds
        SET status = 'approved', paypal_refund_id = ${refundResult.id}, processed_by = ${user.id}, processed_at = now(), updated_at = now()
        WHERE id = ${id}
      `;

      // Revoke entitlements if subscription payment
      const planId = refund.metadata?.planId;
      if (planId) {
        await revokeSubscriptionEntitlements(c.env, refund.user_id, planId);
      }

      await logAuditEvent(c.env, {
        actor_id: user.id,
        actor_type: 'user',
        action: 'refund.approve',
        resource_type: 'refund',
        resource_id: id,
        changes: { status: 'approved', paypalRefundId: refundResult.id },
        ip: c.req.header('cf-connecting-ip'),
        user_agent: c.req.header('user-agent'),
        request_id: c.get('requestId'),
      });

      return c.json({ success: true, paypalRefundId: refundResult.id });
    }

    return c.json({ error: 'refund_failed' }, 500);
  } catch (error) {
    console.error('[paypal] Refund error:', error);
    return c.json({ error: 'refund_failed' }, 500);
  }
});

// POST /refunds/:id/reject — reject refund request (admin only)
refunds.post('/:id/reject', requireAdmin(), async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  const [refund] = await sql`
    UPDATE refunds
    SET status = 'rejected', processed_by = ${user.id}, processed_at = now(), updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `;

  if (!refund) return c.json({ error: 'refund_not_found' }, 404);

  await logAuditEvent(c.env, {
    actor_id: user.id,
    actor_type: 'user',
    action: 'refund.reject',
    resource_type: 'refund',
    resource_id: id,
    changes: { status: 'rejected', reason: body.reason },
    ip: c.req.header('cf-connecting-ip'),
    user_agent: c.req.header('user-agent'),
    request_id: c.get('requestId'),
  });

  return c.json({ success: true });
});

export default refunds;
