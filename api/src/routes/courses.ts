import { Hono } from 'hono';
import { getDb } from '../lib/db';
import { getBearerToken, verifySession } from '../lib/auth';

const courses = new Hono<AppBindings>();

// GET /courses — list all published courses
courses.get('/', async (c) => {
  const sql = getDb(c.env);
  const rows = await sql`
    SELECT id, slug, track_id, title_vi, title_en, description_vi, description_en,
           level, duration_hours, price_cents, currency, status, thumbnail
    FROM courses WHERE status = 'published'
    ORDER BY duration_hours
  `;
  return c.json({ courses: rows });
});

// GET /courses/:slug — get course detail with lessons
courses.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const sql = getDb(c.env);
  const [course] = await sql`
    SELECT * FROM courses WHERE slug = ${slug} AND status = 'published'
  `;
  if (!course) return c.json({ error: 'course_not_found' }, 404);

  const lessons = await sql`
    SELECT id, slug, lesson_number, title_vi, title_en, description_vi, description_en,
           duration_min, level, is_free, code_language
    FROM lessons_db WHERE course_id = ${course.id}
    ORDER BY lesson_number
  `;

  // If user is authenticated, include progress
  let progress: any[] = [];
  const token = getBearerToken(c);
  if (token) {
    const payload = await verifySession(token, c.env);
    if (payload) {
      progress = await sql`
        SELECT lesson_id, status, started_at, completed_at, time_spent_sec
        FROM lesson_progress WHERE user_id = ${payload.sub}
        AND lesson_id IN (SELECT id FROM lessons_db WHERE course_id = ${course.id})
      `;
    }
  }

  return c.json({ course, lessons, progress });
});

// POST /courses/:slug/enroll — enroll in a course (requires auth)
courses.post('/:slug/enroll', async (c) => {
  const token = getBearerToken(c);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const payload = await verifySession(token, c.env);
  if (!payload) return c.json({ error: 'invalid_token' }, 401);

  const slug = c.req.param('slug');
  const sql = getDb(c.env);
  const [course] = await sql`SELECT id, price_cents FROM courses WHERE slug = ${slug} AND status = 'published'`;
  if (!course) return c.json({ error: 'course_not_found' }, 404);

  // Check existing enrollment
  const [existing] = await sql`
    SELECT id FROM enrollments WHERE user_id = ${payload.sub} AND course_id = ${course.id}
  `;
  if (existing) return c.json({ enrolled: true, already: true });

  // If course is free, enroll directly
  if (course.price_cents === 0) {
    await sql`
      INSERT INTO enrollments (user_id, course_id, status) VALUES (${payload.sub}, ${course.id}, 'active')
    `;
    return c.json({ enrolled: true, requiresPayment: false });
  }

  // Paid course — require active subscription or payment
  const [sub] = await sql`
    SELECT id FROM subscriptions WHERE user_id = ${payload.sub} AND status = 'active'
  `;
  if (sub) {
    await sql`
      INSERT INTO enrollments (user_id, course_id, status) VALUES (${payload.sub}, ${course.id}, 'active')
    `;
    return c.json({ enrolled: true, requiresPayment: false });
  }

  return c.json({ enrolled: false, requiresPayment: true, priceCents: course.price_cents });
});

// GET /courses/enrolled — list user's enrolled courses
courses.get('/enrolled/list', async (c) => {
  const token = getBearerToken(c);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const payload = await verifySession(token, c.env);
  if (!payload) return c.json({ error: 'invalid_token' }, 401);

  const sql = getDb(c.env);
  const enrolled = await sql`
    SELECT e.id, e.status, e.enrolled_at, e.completed_at,
           c.slug, c.title_vi, c.title_en, c.level, c.duration_hours, c.thumbnail
    FROM enrollments e
    JOIN courses c ON c.id = e.course_id
    WHERE e.user_id = ${payload.sub}
    ORDER BY e.enrolled_at DESC
  `;
  return c.json({ enrollments: enrolled });
});

export default courses;
