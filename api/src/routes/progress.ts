import { Hono } from 'hono';
import { getDb } from '../lib/db';
import { getBearerToken, verifySession } from '../lib/auth';

const progress = new Hono<AppBindings>();

// GET /progress/:courseId — get user's progress for a course
progress.get('/:courseId', async (c) => {
  const token = getBearerToken(c);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const payload = await verifySession(token, c.env);
  if (!payload) return c.json({ error: 'invalid_token' }, 401);

  const courseId = c.req.param('courseId');
  const sql = getDb(c.env);

  const [enrollment] = await sql`
    SELECT id, status, enrolled_at, completed_at FROM enrollments
    WHERE user_id = ${payload.sub} AND course_id = ${courseId}
  `;
  if (!enrollment) return c.json({ error: 'not_enrolled' }, 403);

  const lessons = await sql`
    SELECT l.id, l.slug, l.lesson_number, l.title_vi, l.title_en, l.duration_min, l.is_free,
           lp.status as progress_status, lp.started_at, lp.completed_at, lp.time_spent_sec
    FROM lessons_db l
    LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = ${payload.sub}
    WHERE l.course_id = ${courseId}
    ORDER BY l.lesson_number
  `;

  const totalLessons = lessons.length;
  const completedLessons = lessons.filter((l: any) => l.progress_status === 'completed').length;
  const percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return c.json({
    enrollment,
    lessons,
    stats: { totalLessons, completedLessons, percent },
  });
});

// POST /progress/:lessonId/start — mark lesson as started
progress.post('/:lessonId/start', async (c) => {
  const token = getBearerToken(c);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const payload = await verifySession(token, c.env);
  if (!payload) return c.json({ error: 'invalid_token' }, 401);

  const lessonId = c.req.param('lessonId');
  const sql = getDb(c.env);

  const [lesson] = await sql`SELECT id, course_id FROM lessons_db WHERE id = ${lessonId}`;
  if (!lesson) return c.json({ error: 'lesson_not_found' }, 404);

  // Check enrollment (or free lesson)
  if (!lesson.is_free) {
    const [enrollment] = await sql`
      SELECT id FROM enrollments WHERE user_id = ${payload.sub} AND course_id = ${lesson.course_id} AND status = 'active'
    `;
    if (!enrollment) return c.json({ error: 'not_enrolled' }, 403);
  }

  await sql`
    INSERT INTO lesson_progress (user_id, lesson_id, status, started_at)
    VALUES (${payload.sub}, ${lessonId}, 'in_progress', now())
    ON CONFLICT (user_id, lesson_id) DO UPDATE SET started_at = COALESCE(lesson_progress.started_at, now())
  `;

  return c.json({ started: true });
});

// POST /progress/:lessonId/complete — mark lesson as completed
progress.post('/:lessonId/complete', async (c) => {
  const token = getBearerToken(c);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const payload = await verifySession(token, c.env);
  if (!payload) return c.json({ error: 'invalid_token' }, 401);

  const lessonId = c.req.param('lessonId');
  const body = await c.req.json().catch(() => ({}));
  const timeSpent = Number(body.timeSpentSec) || 0;
  const sql = getDb(c.env);

  const [lesson] = await sql`SELECT id, course_id FROM lessons_db WHERE id = ${lessonId}`;
  if (!lesson) return c.json({ error: 'lesson_not_found' }, 404);

  await sql`
    INSERT INTO lesson_progress (user_id, lesson_id, status, started_at, completed_at, time_spent_sec)
    VALUES (${payload.sub}, ${lessonId}, 'completed', now(), now(), ${timeSpent})
    ON CONFLICT (user_id, lesson_id) DO UPDATE SET status = 'completed', completed_at = now(), time_spent_sec = lesson_progress.time_spent_sec + ${timeSpent}
  `;

  // Check if all lessons in course are completed → issue certificate
  const [stats] = await sql`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN lp.status = 'completed' THEN 1 END) as completed
    FROM lessons_db l
    LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = ${payload.sub}
    WHERE l.course_id = ${lesson.course_id}
  `;

  if (stats.total > 0 && stats.total === stats.completed) {
    // Mark enrollment completed
    await sql`UPDATE enrollments SET completed_at = now() WHERE user_id = ${payload.sub} AND course_id = ${lesson.course_id}`;

    // Issue certificate
    const certNumber = `HCMV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    await sql`
      INSERT INTO certificates (user_id, course_id, certificate_number)
      VALUES (${payload.sub}, ${lesson.course_id}, ${certNumber})
      ON CONFLICT (user_id, course_id) DO NOTHING
    `;

    return c.json({ completed: true, courseCompleted: true, certificateNumber: certNumber });
  }

  return c.json({ completed: true, courseCompleted: false });
});

// GET /progress — get overall stats for user
progress.get('/', async (c) => {
  const token = getBearerToken(c);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const payload = await verifySession(token, c.env);
  if (!payload) return c.json({ error: 'invalid_token' }, 401);

  const sql = getDb(c.env);
  const [stats] = await sql`
    SELECT
      (SELECT COUNT(*) FROM enrollments WHERE user_id = ${payload.sub}) as courses_enrolled,
      (SELECT COUNT(*) FROM enrollments WHERE user_id = ${payload.sub} AND completed_at IS NOT NULL) as courses_completed,
      (SELECT COUNT(*) FROM lesson_progress WHERE user_id = ${payload.sub} AND status = 'completed') as lessons_completed,
      (SELECT COALESCE(SUM(time_spent_sec), 0) FROM lesson_progress WHERE user_id = ${payload.sub}) as total_time_sec,
      (SELECT COUNT(*) FROM certificates WHERE user_id = ${payload.sub}) as certificates
  `;

  const certs = await sql`
    SELECT certificate_number, issued_at, c.slug, c.title_vi, c.title_en
    FROM certificates cert
    JOIN courses c ON c.id = cert.course_id
    WHERE cert.user_id = ${payload.sub}
    ORDER BY cert.issued_at DESC
  `;

  return c.json({ stats, certificates: certs });
});

export default progress;
