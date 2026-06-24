import { Hono } from 'hono';
import { getDb } from '../lib/db';
import { getBearerToken, verifySession } from '../lib/auth';
import { requireAdmin, logAuditEvent } from '../lib/permissions';

const products = new Hono<AppBindings>();

// Admin middleware
products.use('*', async (c, next) => {
  const token = getBearerToken(c);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const payload = await verifySession(token, c.env);
  if (!payload) return c.json({ error: 'invalid_token' }, 401);

  c.set('user', payload);
  c.set('requestId', c.req.header('x-request-id') || 'unknown');

  await next();
});

// GET /products — list all products
products.get('/', async (c) => {
  const sql = getDb(c.env);
  const productList = await sql`
    SELECT * FROM products ORDER BY created_at DESC
  `;
  return c.json({ products: productList });
});

// GET /products/:id — get product by ID
products.get('/:id', async (c) => {
  const id = c.req.param('id');
  const sql = getDb(c.env);
  const [product] = await sql`
    SELECT * FROM products WHERE id = ${id}
  `;
  if (!product) return c.json({ error: 'product_not_found' }, 404);
  return c.json({ product });
});

// POST /products — create new product
products.post('/', requireAdmin(), async (c) => {
  const body = await c.req.json();
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  const [product] = await sql`
    INSERT INTO products (name, name_vi, description, description_vi, active, metadata)
    VALUES (${body.name}, ${body.nameVi}, ${body.description || ''}, ${body.descriptionVi || ''}, ${body.active !== false}, ${body.metadata ? JSON.stringify(body.metadata) : null}::jsonb)
    RETURNING *
  `;

  await logAuditEvent(c.env, {
    actor_id: user.id,
    actor_type: 'user',
    action: 'product.create',
    resource_type: 'product',
    resource_id: product.id,
    changes: body,
    ip: c.req.header('cf-connecting-ip'),
    user_agent: c.req.header('user-agent'),
    request_id: c.get('requestId'),
  });

  return c.json({ product }, 201);
});

// PUT /products/:id — update product
products.put('/:id', requireAdmin(), async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  const [product] = await sql`
    UPDATE products
    SET name = ${body.name},
        name_vi = ${body.nameVi},
        description = ${body.description || ''},
        description_vi = ${body.descriptionVi || ''},
        active = ${body.active !== false},
        metadata = ${body.metadata ? JSON.stringify(body.metadata) : null}::jsonb,
        updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `;

  if (!product) return c.json({ error: 'product_not_found' }, 404);

  await logAuditEvent(c.env, {
    actor_id: user.id,
    actor_type: 'user',
    action: 'product.update',
    resource_type: 'product',
    resource_id: id,
    changes: body,
    ip: c.req.header('cf-connecting-ip'),
    user_agent: c.req.header('user-agent'),
    request_id: c.get('requestId'),
  });

  return c.json({ product });
});

// DELETE /products/:id — delete product
products.delete('/:id', requireAdmin(), async (c) => {
  const id = c.req.param('id');
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  const [product] = await sql`
    DELETE FROM products WHERE id = ${id} RETURNING *
  `;

  if (!product) return c.json({ error: 'product_not_found' }, 404);

  await logAuditEvent(c.env, {
    actor_id: user.id,
    actor_type: 'user',
    action: 'product.delete',
    resource_type: 'product',
    resource_id: id,
    ip: c.req.header('cf-connecting-ip'),
    user_agent: c.req.header('user-agent'),
    request_id: c.get('requestId'),
  });

  return c.json({ success: true });
});

// GET /products/:id/prices — get prices for product
products.get('/:id/prices', async (c) => {
  const id = c.req.param('id');
  const sql = getDb(c.env);
  const prices = await sql`
    SELECT * FROM prices WHERE product_id = ${id} ORDER BY created_at DESC
  `;
  return c.json({ prices });
});

// POST /products/:id/prices — create price for product
products.post('/:id/prices', requireAdmin(), async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  const [price] = await sql`
    INSERT INTO prices (product_id, stripe_price_id, currency, unit_amount, recurring_interval, recurring_interval_count, trial_period_days, active, metadata)
    VALUES (${id}, ${body.stripePriceId || null}, ${body.currency || 'VND'}, ${body.unitAmount}, ${body.recurringInterval || null}, ${body.recurringIntervalCount || null}, ${body.trialPeriodDays || null}, ${body.active !== false}, ${body.metadata ? JSON.stringify(body.metadata) : null}::jsonb)
    RETURNING *
  `;

  await logAuditEvent(c.env, {
    actor_id: user.id,
    actor_type: 'user',
    action: 'price.create',
    resource_type: 'price',
    resource_id: price.id,
    changes: body,
    ip: c.req.header('cf-connecting-ip'),
    user_agent: c.req.header('user-agent'),
    request_id: c.get('requestId'),
  });

  return c.json({ price }, 201);
});

// GET /plans — list all plans
products.get('/plans', async (c) => {
  const sql = getDb(c.env);
  const plans = await sql`
    SELECT p.*, pr.currency, pr.unit_amount, pr.recurring_interval, pr.recurring_interval_count
    FROM plans p
    LEFT JOIN prices pr ON p.price_id = pr.id
    WHERE p.active = true
    ORDER BY p.created_at DESC
  `;
  return c.json({ plans });
});

// POST /plans — create new plan
products.post('/plans', requireAdmin(), async (c) => {
  const body = await c.req.json();
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  const [plan] = await sql`
    INSERT INTO plans (id, name, name_vi, description, description_vi, features, price_id, active)
    VALUES (${body.id}, ${body.name}, ${body.nameVi}, ${body.description || ''}, ${body.descriptionVi || ''}, ${JSON.stringify(body.features || [])}::jsonb, ${body.priceId || null}, ${body.active !== false})
    RETURNING *
  `;

  await logAuditEvent(c.env, {
    actor_id: user.id,
    actor_type: 'user',
    action: 'plan.create',
    resource_type: 'plan',
    resource_id: plan.id,
    changes: body,
    ip: c.req.header('cf-connecting-ip'),
    user_agent: c.req.header('user-agent'),
    request_id: c.get('requestId'),
  });

  return c.json({ plan }, 201);
});

// PUT /plans/:id — update plan
products.put('/plans/:id', requireAdmin(), async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  const [plan] = await sql`
    UPDATE plans
    SET name = ${body.name},
        name_vi = ${body.nameVi},
        description = ${body.description || ''},
        description_vi = ${body.descriptionVi || ''},
        features = ${JSON.stringify(body.features || [])}::jsonb,
        price_id = ${body.priceId || null},
        active = ${body.active !== false},
        updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `;

  if (!plan) return c.json({ error: 'plan_not_found' }, 404);

  await logAuditEvent(c.env, {
    actor_id: user.id,
    actor_type: 'user',
    action: 'plan.update',
    resource_type: 'plan',
    resource_id: id,
    changes: body,
    ip: c.req.header('cf-connecting-ip'),
    user_agent: c.req.header('user-agent'),
    request_id: c.get('requestId'),
  });

  return c.json({ plan });
});

// DELETE /plans/:id — delete plan
products.delete('/plans/:id', requireAdmin(), async (c) => {
  const id = c.req.param('id');
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  const [plan] = await sql`
    DELETE FROM plans WHERE id = ${id} RETURNING *
  `;

  if (!plan) return c.json({ error: 'plan_not_found' }, 404);

  await logAuditEvent(c.env, {
    actor_id: user.id,
    actor_type: 'user',
    action: 'plan.delete',
    resource_type: 'plan',
    resource_id: id,
    ip: c.req.header('cf-connecting-ip'),
    user_agent: c.req.header('user-agent'),
    request_id: c.get('requestId'),
  });

  return c.json({ success: true });
});

export default products;
