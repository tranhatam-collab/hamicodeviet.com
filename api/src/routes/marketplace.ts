import { Hono } from 'hono';
import { getDb } from '../lib/db';
import { getBearerToken, verifySession } from '../lib/auth';
import { logAuditEvent } from '../lib/audit';

const marketplace = new Hono<AppBindings>();

// Auth middleware for write operations
marketplace.use('*', async (c, next) => {
  const token = getBearerToken(c);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const payload = await verifySession(token, c.env);
  if (!payload) return c.json({ error: 'invalid_token' }, 401);
  c.set('user', { id: payload.sub, email: payload.email });
  c.set('requestId', c.req.header('x-request-id') || 'unknown');
  await next();
});

// GET /marketplace/listings — browse approved listings
marketplace.get('/listings', async (c) => {
  const sql = getDb(c.env);
  const category = c.req.query('category');
  const page = Number(c.req.query('page')) || 1;
  const limit = Math.min(Number(c.req.query('limit')) || 20, 100);
  const offset = (page - 1) * limit;

  let listings;
  if (category) {
    listings = await sql`
      SELECT id, title, title_vi, description, description_vi, price_cents, currency,
             category, tags, thumbnail_url, seller_id, rating_avg, rating_count,
             sales_count, language
      FROM marketplace_listings
      WHERE status = 'published' AND review_status = 'approved'
            AND category = ${category}
      ORDER BY rating_avg DESC, sales_count DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  } else {
    listings = await sql`
      SELECT id, title, title_vi, description, description_vi, price_cents, currency,
             category, tags, thumbnail_url, seller_id, rating_avg, rating_count,
             sales_count, language
      FROM marketplace_listings
      WHERE status = 'published' AND review_status = 'approved'
      ORDER BY rating_avg DESC, sales_count DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  }

  return c.json({ listings, page, limit });
});

// GET /marketplace/listings/:id — get single listing
marketplace.get('/listings/:id', async (c) => {
  const id = c.req.param('id');
  const sql = getDb(c.env);
  const [listing] = await sql`
    SELECT * FROM marketplace_listings WHERE id = ${id}
  `;
  if (!listing) return c.json({ error: 'listing_not_found' }, 404);
  return c.json({ listing });
});

// POST /marketplace/listings — create a new listing (seller)
marketplace.post('/listings', async (c) => {
  const body = await c.req.json();
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  const [listing] = await sql`
    INSERT INTO marketplace_listings (
      seller_id, type, title, title_vi, description, description_vi,
      price_cents, currency, category, tags, thumbnail_url, preview_url,
      content_metadata, age_restriction, language
    ) VALUES (
      ${user.id}, ${body.type || 'course'}, ${body.title}, ${body.titleVi || null},
      ${body.description || null}, ${body.descriptionVi || null},
      ${body.priceCents || 0}, ${body.currency || 'USD'}, ${body.category || 'programming'},
      ${JSON.stringify(body.tags || [])}::jsonb, ${body.thumbnailUrl || null},
      ${body.previewUrl || null}, ${JSON.stringify(body.contentMetadata || {})}::jsonb,
      ${body.ageRestriction || 8}, ${body.language || 'vi'}
    )
    RETURNING *
  `;

  await logAuditEvent(c.env, {
    actor_id: user.id,
    actor_type: 'user',
    action: 'marketplace.listing.create',
    resource_type: 'marketplace_listing',
    resource_id: listing.id,
  });

  return c.json({ listing }, 201);
});

// PUT /marketplace/listings/:id — update own listing
marketplace.put('/listings/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  const [updated] = await sql`
    UPDATE marketplace_listings SET
      title = COALESCE(${body.title}, title),
      description = COALESCE(${body.description}, description),
      price_cents = COALESCE(${body.priceCents}, price_cents),
      category = COALESCE(${body.category}, category),
      updated_at = now()
    WHERE id = ${id} AND seller_id = ${user.id}
    RETURNING *
  `;
  if (!updated) return c.json({ error: 'listing_not_found_or_forbidden' }, 404);

  return c.json({ listing: updated });
});

// POST /marketplace/listings/:id/purchase — get a listing (free or paid)
marketplace.post('/listings/:id/purchase', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  const [listing] = await sql`
    SELECT * FROM marketplace_listings WHERE id = ${id}
      AND status = 'published' AND review_status = 'approved'
  `;
  if (!listing) return c.json({ error: 'listing_not_found' }, 404);

  // Check if already purchased
  const [existing] = await sql`
    SELECT 1 FROM marketplace_purchases WHERE listing_id = ${id} AND buyer_id = ${user.id}
  `;
  if (existing) return c.json({ error: 'already_purchased' }, 409);

  // Free listings: grant access immediately
  // Paid listings: payment processing not yet enabled — reject for now
  if (listing.price_cents > 0) {
    return c.json({
      error: 'paid_marketplace_not_supported',
      message: 'Thanh toán cho marketplace chưa được kích hoạt. Hiện chỉ hỗ trợ sản phẩm miễn phí.',
    }, 503);
  }

  // Create purchase record (free)
  const [purchase] = await sql`
    INSERT INTO marketplace_purchases (listing_id, buyer_id, price_cents, currency, status)
    VALUES (${id}, ${user.id}, 0, ${listing.currency}, 'completed')
    RETURNING *
  `;

  // Update sales count
  await sql`
    UPDATE marketplace_listings SET sales_count = sales_count + 1 WHERE id = ${id}
  `;

  await logAuditEvent(c.env, {
    actor_id: user.id,
    actor_type: 'user',
    action: 'marketplace.purchase.free',
    resource_type: 'marketplace_listing',
    resource_id: id,
  });

  return c.json({ purchase }, 201);
});

// POST /marketplace/listings/:id/review — rate + review
marketplace.post('/listings/:id/review', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  if (!body.rating || body.rating < 1 || body.rating > 5) {
    return c.json({ error: 'invalid_rating' }, 400);
  }

  // Verify purchase
  const [purchase] = await sql`
    SELECT 1 FROM marketplace_purchases WHERE listing_id = ${id} AND buyer_id = ${user.id}
  `;
  if (!purchase) return c.json({ error: 'must_purchase_first' }, 403);

  const [review] = await sql`
    INSERT INTO marketplace_reviews (listing_id, user_id, rating, review_text)
    VALUES (${id}, ${user.id}, ${body.rating}, ${body.reviewText || null})
    ON CONFLICT (listing_id, user_id) DO UPDATE
    SET rating = ${body.rating}, review_text = ${body.reviewText || null}, updated_at = now()
    RETURNING *
  `;

  // Update listing rating
  await sql`
    UPDATE marketplace_listings SET
      rating_avg = (SELECT AVG(rating) FROM marketplace_reviews WHERE listing_id = ${id}),
      rating_count = (SELECT count(*) FROM marketplace_reviews WHERE listing_id = ${id})
    WHERE id = ${id}
  `;

  return c.json({ review }, 201);
});

// GET /marketplace/my-listings — seller's own listings
marketplace.get('/my-listings', async (c) => {
  const user = c.get('user') as any;
  const sql = getDb(c.env);
  const listings = await sql`
    SELECT * FROM marketplace_listings WHERE seller_id = ${user.id}
    ORDER BY created_at DESC
  `;
  return c.json({ listings });
});

// GET /marketplace/my-purchases — buyer's purchases
marketplace.get('/my-purchases', async (c) => {
  const user = c.get('user') as any;
  const sql = getDb(c.env);
  const purchases = await sql`
    SELECT p.*, l.title, l.title_vi, l.thumbnail_url, l.category
    FROM marketplace_purchases p
    JOIN marketplace_listings l ON p.listing_id = l.id
    WHERE p.buyer_id = ${user.id}
    ORDER BY p.created_at DESC
  `;
  return c.json({ purchases });
});

export default marketplace;
