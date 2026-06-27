import { Hono } from 'hono';
import { getDb } from '../lib/db';
import { getBearerToken, verifySession } from '../lib/auth';
import { logAuditEvent } from '../lib/audit';

const school = new Hono<AppBindings>();

// Auth middleware
school.use('*', async (c, next) => {
  const token = getBearerToken(c);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const payload = await verifySession(token, c.env);
  if (!payload) return c.json({ error: 'invalid_token' }, 401);
  c.set('user', { id: payload.sub, email: payload.email });
  c.set('requestId', c.req.header('x-request-id') || 'unknown');
  await next();
});

// POST /school — create a school (admin)
school.post('/', async (c) => {
  const body = await c.req.json();
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  const [newSchool] = await sql`
    INSERT INTO schools (name, name_vi, type, country, address, website, logo_url, admin_id, plan, max_students)
    VALUES (
      ${body.name}, ${body.nameVi || null}, ${body.type || 'school'},
      ${body.country || 'VN'}, ${body.address || null}, ${body.website || null},
      ${body.logoUrl || null}, ${user.id}, ${body.plan || 'free'}, ${body.maxStudents || 50}
    )
    RETURNING *
  `;

  // Add creator as admin member
  await sql`
    INSERT INTO school_members (school_id, user_id, role, status, joined_at)
    VALUES (${newSchool.id}, ${user.id}, 'admin', 'active', now())
  `;

  await logAuditEvent(c.env, {
    actor_id: user.id,
    actor_type: 'user',
    action: 'school.create',
    resource_type: 'school',
    resource_id: newSchool.id,
  });

  return c.json({ school: newSchool }, 201);
});

// GET /school/mine — get schools user belongs to
school.get('/mine', async (c) => {
  const user = c.get('user') as any;
  const sql = getDb(c.env);
  const schools = await sql`
    SELECT s.*, sm.role, sm.status as member_status
    FROM schools s
    JOIN school_members sm ON s.id = sm.school_id
    WHERE sm.user_id = ${user.id}
    ORDER BY s.created_at DESC
  `;
  return c.json({ schools });
});

// GET /school/:id — get school details
school.get('/:id', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  const [sch] = await sql`
    SELECT * FROM schools WHERE id = ${id}
  `;
  if (!sch) return c.json({ error: 'school_not_found' }, 404);

  // Verify membership
  const [member] = await sql`
    SELECT role FROM school_members WHERE school_id = ${id} AND user_id = ${user.id}
  `;
  if (!member) return c.json({ error: 'not_a_member' }, 403);

  return c.json({ school: sch, role: member.role });
});

// POST /school/:id/invite — invite a user (teacher/admin only)
school.post('/:id/invite', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  // Verify admin/teacher
  const [member] = await sql`
    SELECT role FROM school_members WHERE school_id = ${id} AND user_id = ${user.id}
  `;
  if (!member || !['admin', 'teacher'].includes(member.role)) {
    return c.json({ error: 'forbidden' }, 403);
  }

  // Find user by email
  const [invitee] = await sql`
    SELECT id FROM users WHERE email = ${body.email}
  `;
  if (!invitee) return c.json({ error: 'user_not_found' }, 404);

  // Add as member
  await sql`
    INSERT INTO school_members (school_id, user_id, role, invited_by, status)
    VALUES (${id}, ${invitee.id}, ${body.role || 'student'}, ${user.id}, 'pending')
    ON CONFLICT (school_id, user_id) DO NOTHING
  `;

  return c.json({ success: true, invited: body.email });
});

// POST /school/:id/classes — create a class (teacher/admin)
school.post('/:id/classes', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  // Verify teacher/admin
  const [member] = await sql`
    SELECT role FROM school_members WHERE school_id = ${id} AND user_id = ${user.id}
  `;
  if (!member || !['admin', 'teacher'].includes(member.role)) {
    return c.json({ error: 'forbidden' }, 403);
  }

  const enrollmentCode = Math.random().toString(36).substring(2, 10).toUpperCase();

  const [cls] = await sql`
    INSERT INTO school_classes (
      school_id, name, description, teacher_id, grade_level, subject, enrollment_code, max_students
    ) VALUES (
      ${id}, ${body.name}, ${body.description || null}, ${user.id},
      ${body.gradeLevel || null}, ${body.subject || null}, ${enrollmentCode}, ${body.maxStudents || 30}
    )
    RETURNING *
  `;

  return c.json({ class: cls }, 201);
});

// GET /school/:id/classes — list classes in school
school.get('/:id/classes', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  // Verify membership
  const [member] = await sql`
    SELECT role FROM school_members WHERE school_id = ${id} AND user_id = ${user.id}
  `;
  if (!member) return c.json({ error: 'not_a_member' }, 403);

  const classes = await sql`
    SELECT c.*, u.email as teacher_email,
           (SELECT count(*) FROM class_enrollments WHERE class_id = c.id AND status = 'active') as student_count
    FROM school_classes c
    JOIN users u ON c.teacher_id = u.id
    WHERE c.school_id = ${id} AND c.status = 'active'
    ORDER BY c.created_at DESC
  `;

  return c.json({ classes, role: member.role });
});

// POST /school/classes/:classId/enroll — enroll in a class with code
school.post('/classes/:classId/enroll', async (c) => {
  const classId = c.req.param('classId');
  const body = await c.req.json();
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  const [cls] = await sql`
    SELECT * FROM school_classes WHERE id = ${classId} AND status = 'active'
  `;
  if (!cls) return c.json({ error: 'class_not_found' }, 404);

  if (body.enrollmentCode !== cls.enrollment_code) {
    return c.json({ error: 'invalid_enrollment_code' }, 400);
  }

  // Check capacity
  const [count] = await sql`
    SELECT count(*) as cnt FROM class_enrollments WHERE class_id = ${classId} AND status = 'active'
  `;
  if (count.cnt >= cls.max_students) {
    return c.json({ error: 'class_full' }, 400);
  }

  await sql`
    INSERT INTO class_enrollments (class_id, student_id, status)
    VALUES (${classId}, ${user.id}, 'active')
    ON CONFLICT (class_id, student_id) DO NOTHING
  `;

  return c.json({ success: true });
});

// POST /school/classes/:classId/assignments — create assignment (teacher)
school.post('/classes/:classId/assignments', async (c) => {
  const classId = c.req.param('classId');
  const body = await c.req.json();
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  const [cls] = await sql`
    SELECT * FROM school_classes WHERE id = ${classId} AND teacher_id = ${user.id}
  `;
  if (!cls) return c.json({ error: 'forbidden' }, 403);

  const [assignment] = await sql`
    INSERT INTO school_assignments (
      class_id, teacher_id, title, description, type, exercise_id, due_date, points_possible
    ) VALUES (
      ${classId}, ${user.id}, ${body.title}, ${body.description || null},
      ${body.type || 'exercise'}, ${body.exerciseId || null},
      ${body.dueDate || null}, ${body.pointsPossible || 100}
    )
    RETURNING *
  `;

  return c.json({ assignment }, 201);
});

// GET /school/classes/:classId/assignments — list assignments
school.get('/classes/:classId/assignments', async (c) => {
  const classId = c.req.param('classId');
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  const assignments = await sql`
    SELECT * FROM school_assignments
    WHERE class_id = ${classId} AND status = 'active'
    ORDER BY created_at DESC
  `;

  return c.json({ assignments });
});

export default school;
