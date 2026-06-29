import { Hono } from 'hono';
import { getDb } from '../lib/db';
import { getBearerToken, verifySession } from '../lib/auth';
import { logAuditEvent } from '../lib/audit';

const portfolio = new Hono<AppBindings>();

// Auth middleware
portfolio.use('*', async (c, next) => {
  const token = getBearerToken(c);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const payload = await verifySession(token, c.env);
  if (!payload) return c.json({ error: 'invalid_token' }, 401);
  c.set('user', { id: payload.sub, email: payload.email });
  c.set('requestId', c.req.header('x-request-id') || 'unknown');
  await next();
});

// GET /portfolio — list user's portfolio items
portfolio.get('/', async (c) => {
  const user = c.get('user') as any;
  const sql = getDb(c.env);
  const items = await sql`
    SELECT * FROM portfolios WHERE user_id = ${user.id}
    ORDER BY created_at DESC
  `;
  return c.json({ portfolios: items });
});

// GET /portfolio/:id — get single portfolio item
portfolio.get('/:id', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user') as any;
  const sql = getDb(c.env);
  const [item] = await sql`
    SELECT * FROM portfolios WHERE id = ${id} AND user_id = ${user.id}
  `;
  if (!item) return c.json({ error: 'portfolio_not_found' }, 404);
  return c.json({ portfolio: item });
});

// POST /portfolio — create a portfolio item
portfolio.post('/', async (c) => {
  const body = await c.req.json();
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  if (!body.title) {
    return c.json({ error: 'missing_title' }, 400);
  }

  const [item] = await sql`
    INSERT INTO portfolios (user_id, title, description, project_url, repo_url, thumbnail_url, tech_stack, evidence, privacy_level, status)
    VALUES (
      ${user.id}, ${body.title}, ${body.description || null},
      ${body.projectUrl || null}, ${body.repoUrl || null}, ${body.thumbnailUrl || null},
      ${JSON.stringify(body.techStack || [])}::jsonb,
      ${JSON.stringify(body.evidence || [])}::jsonb,
      ${body.privacyLevel || 'private'},
      ${body.status || 'draft'}
    )
    RETURNING *
  `;

  await logAuditEvent(c.env, {
    actor_id: user.id,
    actor_type: 'user',
    action: 'portfolio.create',
    resource_type: 'portfolio',
    resource_id: item.id,
  });

  return c.json({ portfolio: item }, 201);
});

// PUT /portfolio/:id — update portfolio item
portfolio.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  const [updated] = await sql`
    UPDATE portfolios SET
      title = COALESCE(${body.title}, title),
      description = COALESCE(${body.description}, description),
      project_url = COALESCE(${body.projectUrl}, project_url),
      repo_url = COALESCE(${body.repoUrl}, repo_url),
      thumbnail_url = COALESCE(${body.thumbnailUrl}, thumbnail_url),
      tech_stack = COALESCE(${JSON.stringify(body.techStack || [])}::jsonb, tech_stack),
      privacy_level = COALESCE(${body.privacyLevel}, privacy_level),
      status = COALESCE(${body.status}, status),
      updated_at = now()
    WHERE id = ${id} AND user_id = ${user.id}
    RETURNING *
  `;
  if (!updated) return c.json({ error: 'portfolio_not_found_or_forbidden' }, 404);

  return c.json({ portfolio: updated });
});

// DELETE /portfolio/:id — delete portfolio item
portfolio.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  const [deleted] = await sql`
    DELETE FROM portfolios WHERE id = ${id} AND user_id = ${user.id}
    RETURNING id
  `;
  if (!deleted) return c.json({ error: 'portfolio_not_found_or_forbidden' }, 404);

  return c.json({ success: true });
});

// GET /portfolio/public/:userId — view another user's public portfolio
portfolio.get('/public/:userId', async (c) => {
  const userId = c.req.param('userId');
  const sql = getDb(c.env);
  const items = await sql`
    SELECT id, title, description, project_url, repo_url, thumbnail_url, tech_stack, created_at
    FROM portfolios
    WHERE user_id = ${userId} AND privacy_level = 'public' AND status = 'published'
    ORDER BY created_at DESC
  `;
  return c.json({ portfolios: items });
});

export default portfolio;
