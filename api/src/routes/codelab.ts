import { Hono } from 'hono';
import { getDb } from '../lib/db';
import { getBearerToken, verifySession } from '../lib/auth';
import { runTests } from '../lib/runner';

const codelab = new Hono<AppBindings>();

// Auth middleware
codelab.use('*', async (c, next) => {
  const token = getBearerToken(c);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const payload = await verifySession(token, c.env);
  if (!payload) return c.json({ error: 'invalid_token' }, 401);
  c.set('user', { id: payload.sub, email: payload.email });
  c.set('requestId', c.req.header('x-request-id') || 'unknown');
  await next();
});

// GET /codelab/exercises — list exercises
codelab.get('/exercises', async (c) => {
  const sql = getDb(c.env);
  const language = c.req.query('language');
  const difficulty = c.req.query('difficulty');
  const category = c.req.query('category');
  const page = Number(c.req.query('page')) || 1;
  const limit = Math.min(Number(c.req.query('limit')) || 20, 100);
  const offset = (page - 1) * limit;

  let exercises;
  if (language && difficulty) {
    exercises = await sql`
      SELECT id, slug, title, title_vi, language, difficulty, category, points, age_restriction
      FROM codelab_exercises
      WHERE active = true AND language = ${language} AND difficulty = ${difficulty}
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
  } else if (language) {
    exercises = await sql`
      SELECT id, slug, title, title_vi, language, difficulty, category, points, age_restriction
      FROM codelab_exercises
      WHERE active = true AND language = ${language}
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
  } else {
    exercises = await sql`
      SELECT id, slug, title, title_vi, language, difficulty, category, points, age_restriction
      FROM codelab_exercises
      WHERE active = true
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
  }

  return c.json({ exercises, page, limit });
});

// GET /codelab/exercises/:slug — get single exercise
codelab.get('/exercises/:slug', async (c) => {
  const slug = c.req.param('slug');
  const sql = getDb(c.env);
  const [exercise] = await sql`
    SELECT * FROM codelab_exercises WHERE slug = ${slug} AND active = true
  `;
  if (!exercise) return c.json({ error: 'exercise_not_found' }, 404);
  // Don't return solution_code to user
  delete exercise.solution_code;
  return c.json({ exercise });
});

// POST /codelab/exercises/:id/submit — submit code
codelab.post('/exercises/:id/submit', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  const [exercise] = await sql`
    SELECT * FROM codelab_exercises WHERE id = ${id} AND active = true
  `;
  if (!exercise) return c.json({ error: 'exercise_not_found' }, 404);

  // Save submission
  const [submission] = await sql`
    INSERT INTO codelab_submissions (exercise_id, user_id, code, language, status)
    VALUES (${id}, ${user.id}, ${body.code}, ${body.language || exercise.language}, 'pending')
    RETURNING *
  `;

  // Run test cases using the real code runner
  const testCases = exercise.test_cases || [];
  const language = body.language || exercise.language;
  const { results, passed, failed } = await runTests(language, body.code, testCases);

  // Update submission
  const status = failed === 0 ? 'passed' : 'failed';
  await sql`
    UPDATE codelab_submissions
    SET status = ${status}, test_results = ${JSON.stringify(results)}::jsonb
    WHERE id = ${submission.id}
  `;

  // Update progress
  await sql`
    INSERT INTO codelab_progress (user_id, exercise_id, status, attempts, last_attempt_at)
    VALUES (${user.id}, ${id}, ${status}, 1, now())
    ON CONFLICT (user_id, exercise_id) DO UPDATE
    SET attempts = codelab_progress.attempts + 1,
        status = CASE WHEN ${status} = 'passed' THEN 'completed' ELSE codelab_progress.status END,
        last_attempt_at = now(),
        updated_at = now()
  `;

  return c.json({ submission: { ...submission, status, test_results: results } });
});

// GET /codelab/progress — get user's progress
codelab.get('/progress', async (c) => {
  const user = c.get('user') as any;
  const sql = getDb(c.env);
  const progress = await sql`
    SELECT p.*, e.slug, e.title, e.title_vi, e.language, e.difficulty, e.points
    FROM codelab_progress p
    JOIN codelab_exercises e ON p.exercise_id = e.id
    WHERE p.user_id = ${user.id}
    ORDER BY p.updated_at DESC
  `;
  const [stats] = await sql`
    SELECT count(*) as total,
           count(*) FILTER (WHERE status = 'completed') as completed,
           coalesce(sum(best_score), 0) as total_points
    FROM codelab_progress WHERE user_id = ${user.id}
  `;
  return c.json({ progress, stats });
});

export default codelab;
