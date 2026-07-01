/**
 * Project Workshop API — Hệ sinh thái giáo dục thực chứng
 * Tầng 3: Xưởng dự án thực tế
 *
 * Endpoints:
 *   GET    /projects/templates          — list project templates
 *   GET    /projects/templates/:slug    — get template by slug
 *   GET    /projects                    — list user's projects
 *   GET    /projects/:id                — get single project
 *   POST   /projects                    — create project from template or custom
 *   PUT    /projects/:id                — update project
 *   DELETE /projects/:id                — delete project
 *   POST   /projects/:id/start          — start project (create 10 milestones)
 *   POST   /projects/:id/milestone/:step/complete — complete milestone
 *   POST   /projects/:id/evidence       — add evidence to project
 *   GET    /projects/:id/evidence       — list evidence
 *   POST   /projects/:id/evidence/:eid/verify — verify evidence (mentor/admin)
 *   POST   /projects/:id/submit         — submit project for review
 *   POST   /projects/:id/review         — review project (mentor/admin)
 *   POST   /projects/:id/publish        — publish project
 *   GET    /projects/mentors            — list available mentors
 *   POST   /projects/mentors            — register as mentor
 *   POST   /projects/:id/mentor         — assign mentor to project
 *   POST   /projects/:id/session        — schedule mentor session
 *   GET    /projects/:id/sessions       — list sessions
 */
import { Hono } from 'hono';
import { getDb } from '../lib/db';
import { getBearerToken, verifySession } from '../lib/auth';
import { logAuditEvent } from '../lib/audit';

const projects = new Hono<AppBindings>();

// Auth middleware
projects.use('*', async (c, next) => {
  const token = getBearerToken(c);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const payload = await verifySession(token, c.env);
  if (!payload) return c.json({ error: 'invalid_token' }, 401);
  c.set('user', { id: payload.sub, email: payload.email });
  c.set('requestId', c.req.header('x-request-id') || 'unknown');
  await next();
});

// ===== 10 STEPS DEFINITION =====
const PROJECT_STEPS = [
  { step: 0, name: 'Quan sát', name_en: 'Observe' },
  { step: 1, name: 'Phát hiện vấn đề', name_en: 'Identify Problem' },
  { step: 2, name: 'Nghiên cứu', name_en: 'Research' },
  { step: 3, name: 'Gặp người liên quan', name_en: 'Engage Stakeholders' },
  { step: 4, name: 'Đề xuất giải pháp', name_en: 'Propose Solution' },
  { step: 5, name: 'Tạo nguyên mẫu', name_en: 'Build Prototype' },
  { step: 6, name: 'Thử nghiệm', name_en: 'Test' },
  { step: 7, name: 'Đo kết quả', name_en: 'Measure Results' },
  { step: 8, name: 'Sửa sai', name_en: 'Iterate' },
  { step: 9, name: 'Công bố bằng chứng', name_en: 'Publish Evidence' },
];

// ===== TEMPLATES =====

// GET /projects/templates — list published templates
projects.get('/templates', async (c) => {
  const sql = getDb(c.env);
  const { domain, age_group } = c.req.query();
  let items;
  if (domain && age_group) {
    items = await sql`SELECT * FROM project_templates WHERE is_published = true AND domain = ${domain} AND age_group = ${age_group} ORDER BY created_at DESC`;
  } else if (domain) {
    items = await sql`SELECT * FROM project_templates WHERE is_published = true AND domain = ${domain} ORDER BY created_at DESC`;
  } else if (age_group) {
    items = await sql`SELECT * FROM project_templates WHERE is_published = true AND age_group = ${age_group} ORDER BY created_at DESC`;
  } else {
    items = await sql`SELECT * FROM project_templates WHERE is_published = true ORDER BY created_at DESC`;
  }
  return c.json({ templates: items, steps: PROJECT_STEPS });
});

// GET /projects/templates/:slug — get template by slug
projects.get('/templates/:slug', async (c) => {
  const slug = c.req.param('slug');
  const sql = getDb(c.env);
  const [item] = await sql`SELECT * FROM project_templates WHERE slug = ${slug} AND is_published = true`;
  if (!item) return c.json({ error: 'template_not_found' }, 404);
  return c.json({ template: item, steps: PROJECT_STEPS });
});

// ===== PROJECTS CRUD =====

// GET /projects — list user's projects
projects.get('/', async (c) => {
  const user = c.get('user') as any;
  const sql = getDb(c.env);
  const items = await sql`
    SELECT p.*, m.display_name as mentor_name
    FROM projects p
    LEFT JOIN project_mentors m ON p.mentor_id = m.id
    WHERE p.user_id = ${user.id}
    ORDER BY p.created_at DESC
  `;
  return c.json({ projects: items });
});

// GET /projects/:id — get single project with milestones + evidence
projects.get('/:id', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user') as any;
  const sql = getDb(c.env);
  const [project] = await sql`
    SELECT p.*, m.display_name as mentor_name, m.expertise as mentor_expertise
    FROM projects p
    LEFT JOIN project_mentors m ON p.mentor_id = m.id
    WHERE p.id = ${id} AND (p.user_id = ${user.id} OR p.mentor_id = ${user.id} OR p.privacy_level = 'public')
  `;
  if (!project) return c.json({ error: 'project_not_found' }, 404);

  const milestones = await sql`SELECT * FROM project_milestones WHERE project_id = ${id} ORDER BY step ASC`;
  const evidence = await sql`SELECT * FROM project_evidence WHERE project_id = ${id} ORDER BY created_at DESC`;

  return c.json({ project, milestones, evidence, steps: PROJECT_STEPS });
});

// POST /projects — create project
projects.post('/', async (c) => {
  const body = await c.req.json();
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  if (!body.title || !body.domain || !body.ageGroup) {
    return c.json({ error: 'missing_required_fields', required: ['title', 'domain', 'ageGroup'] }, 400);
  }

  const [project] = await sql`
    INSERT INTO projects (user_id, template_id, title, title_en, description, description_en, domain, age_group, status, client_name, client_type, budget_vnd, deadline, risk_level, privacy_level)
    VALUES (
      ${user.id},
      ${body.templateId || null},
      ${body.title},
      ${body.titleEn || null},
      ${body.description || ''},
      ${body.descriptionEn || null},
      ${body.domain},
      ${body.ageGroup},
      'draft',
      ${body.clientName || null},
      ${body.clientType || 'simulated'},
      ${body.budgetVnd || 0},
      ${body.deadline || null},
      ${body.riskLevel || 'low'},
      ${body.privacyLevel || 'private'}
    )
    RETURNING *
  `;

  await logAuditEvent(c.env, {
    actor_id: user.id,
    actor_type: 'user',
    action: 'project.create',
    resource_type: 'project',
    resource_id: project.id,
  });

  return c.json({ project }, 201);
});

// PUT /projects/:id — update project
projects.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  const [existing] = await sql`SELECT * FROM projects WHERE id = ${id} AND user_id = ${user.id}`;
  if (!existing) return c.json({ error: 'project_not_found' }, 404);

  const [updated] = await sql`
    UPDATE projects SET
      title = COALESCE(${body.title || null}, title),
      title_en = COALESCE(${body.titleEn || null}, title_en),
      description = COALESCE(${body.description || null}, description),
      description_en = COALESCE(${body.descriptionEn || null}, description_en),
      client_name = COALESCE(${body.clientName || null}, client_name),
      budget_vnd = COALESCE(${body.budgetVnd || null}, budget_vnd),
      deadline = COALESCE(${body.deadline || null}, deadline),
      risk_level = COALESCE(${body.riskLevel || null}, risk_level),
      privacy_level = COALESCE(${body.privacyLevel || null}, privacy_level),
      ai_tools_used = COALESCE(${JSON.stringify(body.aiToolsUsed || [])}::jsonb, ai_tools_used),
      ai_declaration = COALESCE(${JSON.stringify(body.aiDeclaration || {})}::jsonb, ai_declaration),
      updated_at = now()
    WHERE id = ${id} AND user_id = ${user.id}
    RETURNING *
  `;

  return c.json({ project: updated });
});

// DELETE /projects/:id
projects.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  const [existing] = await sql`SELECT * FROM projects WHERE id = ${id} AND user_id = ${user.id}`;
  if (!existing) return c.json({ error: 'project_not_found' }, 404);

  await sql`DELETE FROM projects WHERE id = ${id} AND user_id = ${user.id}`;

  await logAuditEvent(c.env, {
    actor_id: user.id,
    actor_type: 'user',
    action: 'project.delete',
    resource_type: 'project',
    resource_id: id,
  });

  return c.json({ deleted: true });
});

// ===== MILESTONES =====

// POST /projects/:id/start — start project, create 10 milestones
projects.post('/:id/start', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  const [project] = await sql`SELECT * FROM projects WHERE id = ${id} AND user_id = ${user.id}`;
  if (!project) return c.json({ error: 'project_not_found' }, 404);
  if (project.status !== 'draft') return c.json({ error: 'project_already_started' }, 400);

  // Create 10 milestones
  for (const step of PROJECT_STEPS) {
    await sql`
      INSERT INTO project_milestones (project_id, step, step_name, step_name_en, status)
      VALUES (${id}, ${step.step}, ${step.name}, ${step.name_en}, 'pending')
      ON CONFLICT (project_id, step) DO NOTHING
    `;
  }

  const [updated] = await sql`
    UPDATE projects SET status = 'planning', current_step = 0, updated_at = now()
    WHERE id = ${id} RETURNING *
  `;

  const milestones = await sql`SELECT * FROM project_milestones WHERE project_id = ${id} ORDER BY step ASC`;

  return c.json({ project: updated, milestones });
});

// POST /projects/:id/milestone/:step/complete — complete milestone
projects.post('/:id/milestone/:step/complete', async (c) => {
  const id = c.req.param('id');
  const step = parseInt(c.req.param('step'));
  const body = await c.req.json().catch(() => ({}));
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  const [project] = await sql`SELECT * FROM projects WHERE id = ${id} AND user_id = ${user.id}`;
  if (!project) return c.json({ error: 'project_not_found' }, 404);

  const [milestone] = await sql`
    UPDATE project_milestones SET
      status = 'completed',
      notes = COALESCE(${body.notes || null}, notes),
      mentor_feedback = COALESCE(${body.mentorFeedback || null}, mentor_feedback),
      completed_at = now(),
      updated_at = now()
    WHERE project_id = ${id} AND step = ${step}
    RETURNING *
  `;

  if (!milestone) return c.json({ error: 'milestone_not_found' }, 404);

  // Advance current_step if this is the current step
  const nextStep = step + 1;
  if (project.current_step === step && nextStep < 10) {
    await sql`UPDATE projects SET current_step = ${nextStep}, status = 'in_progress', updated_at = now() WHERE id = ${id}`;
  } else if (nextStep >= 10) {
    await sql`UPDATE projects SET current_step = 9, status = 'in_progress', updated_at = now() WHERE id = ${id}`;
  }

  return c.json({ milestone });
});

// ===== EVIDENCE =====

// GET /projects/:id/evidence — list evidence
projects.get('/:id/evidence', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user') as any;
  const sql = getDb(c.env);
  const items = await sql`
    SELECT e.* FROM project_evidence e
    JOIN projects p ON e.project_id = p.id
    WHERE p.id = ${id} AND (p.user_id = ${user.id} OR p.privacy_level = 'public')
    ORDER BY e.created_at DESC
  `;
  return c.json({ evidence: items });
});

// POST /projects/:id/evidence — add evidence
projects.post('/:id/evidence', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  if (!body.title || !body.evidenceType) {
    return c.json({ error: 'missing_required_fields', required: ['title', 'evidenceType'] }, 400);
  }

  const [project] = await sql`SELECT * FROM projects WHERE id = ${id} AND user_id = ${user.id}`;
  if (!project) return c.json({ error: 'project_not_found' }, 404);

  const [evidence] = await sql`
    INSERT INTO project_evidence (project_id, milestone_id, evidence_type, title, description, artifact_url, artifact_type, ai_used, ai_declaration)
    VALUES (
      ${id},
      ${body.milestoneId || null},
      ${body.evidenceType},
      ${body.title},
      ${body.description || null},
      ${body.artifactUrl || null},
      ${body.artifactType || null},
      ${body.aiUsed || false},
      ${JSON.stringify(body.aiDeclaration || {})}::jsonb
    )
    RETURNING *
  `;

  await logAuditEvent(c.env, {
    actor_id: user.id,
    actor_type: 'user',
    action: 'project.evidence.add',
    resource_type: 'project_evidence',
    resource_id: evidence.id,
  });

  return c.json({ evidence }, 201);
});

// POST /projects/:id/evidence/:eid/verify — verify evidence (mentor/admin)
projects.post('/:id/evidence/:eid/verify', async (c) => {
  const id = c.req.param('id');
  const eid = c.req.param('eid');
  const body = await c.req.json();
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  // Check if user is mentor or admin
  const [project] = await sql`
    SELECT p.* FROM projects p
    LEFT JOIN project_mentors m ON p.mentor_id = m.id
    WHERE p.id = ${id} AND (m.user_id = ${user.id} OR p.user_id = ${user.id})
  `;
  if (!project) return c.json({ error: 'not_authorized' }, 403);

  const [evidence] = await sql`
    UPDATE project_evidence SET
      verification_status = ${body.status || 'verified'},
      verified_by = ${user.id},
      verified_at = now(),
      verification_notes = COALESCE(${body.notes || null}, verification_notes)
    WHERE id = ${eid} AND project_id = ${id}
    RETURNING *
  `;

  if (!evidence) return c.json({ error: 'evidence_not_found' }, 404);

  return c.json({ evidence });
});

// ===== SUBMIT / REVIEW / PUBLISH =====

// POST /projects/:id/submit — submit for review
projects.post('/:id/submit', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  const [project] = await sql`SELECT * FROM projects WHERE id = ${id} AND user_id = ${user.id}`;
  if (!project) return c.json({ error: 'project_not_found' }, 404);

  // Check all milestones completed
  const completed = await sql`SELECT COUNT(*)::int as count FROM project_milestones WHERE project_id = ${id} AND status = 'completed'`;
  if (completed[0].count < 8) {
    return c.json({ error: 'milestones_incomplete', completed: completed[0].count, required: 8 }, 400);
  }

  const [updated] = await sql`
    UPDATE projects SET
      status = 'submitted',
      final_report = COALESCE(${body.finalReport || null}, final_report),
      final_report_en = COALESCE(${body.finalReportEn || null}, final_report_en),
      ai_declaration = COALESCE(${JSON.stringify(body.aiDeclaration || {})}::jsonb, ai_declaration),
      updated_at = now()
    WHERE id = ${id} RETURNING *
  `;

  await logAuditEvent(c.env, {
    actor_id: user.id,
    actor_type: 'user',
    action: 'project.submit',
    resource_type: 'project',
    resource_id: id,
  });

  return c.json({ project: updated });
});

// POST /projects/:id/review — review project (mentor/admin)
projects.post('/:id/review', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  if (body.score === undefined || body.score === null) {
    return c.json({ error: 'missing_score' }, 400);
  }

  const [updated] = await sql`
    UPDATE projects SET
      status = 'reviewed',
      review_score = ${body.score},
      review_feedback = ${body.feedback || null},
      reviewed_by = ${user.id},
      reviewed_at = now(),
      updated_at = now()
    WHERE id = ${id} RETURNING *
  `;

  if (!updated) return c.json({ error: 'project_not_found' }, 404);

  await logAuditEvent(c.env, {
    actor_id: user.id,
    actor_type: 'user',
    action: 'project.review',
    resource_type: 'project',
    resource_id: id,
    changes: { score: body.score },
  });

  return c.json({ project: updated });
});

// POST /projects/:id/publish — publish project
projects.post('/:id/publish', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  const [project] = await sql`SELECT * FROM projects WHERE id = ${id} AND user_id = ${user.id}`;
  if (!project) return c.json({ error: 'project_not_found' }, 404);
  if (project.status !== 'reviewed') return c.json({ error: 'not_reviewed' }, 400);

  const [updated] = await sql`
    UPDATE projects SET
      status = 'published',
      privacy_level = 'public',
      published_at = now(),
      updated_at = now()
    WHERE id = ${id} RETURNING *
  `;

  await logAuditEvent(c.env, {
    actor_id: user.id,
    actor_type: 'user',
    action: 'project.publish',
    resource_type: 'project',
    resource_id: id,
  });

  return c.json({ project: updated });
});

// ===== MENTORS =====

// GET /projects/mentors — list available mentors
projects.get('/mentors', async (c) => {
  const sql = getDb(c.env);
  const { domain, age_group } = c.req.query();
  let items;
  if (domain) {
    items = await sql`
      SELECT * FROM project_mentors
      WHERE is_active = true AND is_verified = true
      AND ${domain} = ANY(domains)
      ORDER BY rating DESC, total_projects DESC
    `;
  } else {
    items = await sql`
      SELECT * FROM project_mentors
      WHERE is_active = true AND is_verified = true
      ORDER BY rating DESC, total_projects DESC
    `;
  }
  return c.json({ mentors: items });
});

// POST /projects/mentors — register as mentor
projects.post('/mentors', async (c) => {
  const body = await c.req.json();
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  if (!body.displayName || !body.expertise) {
    return c.json({ error: 'missing_required_fields', required: ['displayName', 'expertise'] }, 400);
  }

  // Check if already registered
  const [existing] = await sql`SELECT * FROM project_mentors WHERE user_id = ${user.id}`;
  if (existing) return c.json({ error: 'already_registered', mentor: existing }, 409);

  const [mentor] = await sql`
    INSERT INTO project_mentors (user_id, display_name, bio, bio_en, expertise, domains, age_groups, years_experience, hourly_rate_vnd, availability_hours_per_week, languages)
    VALUES (
      ${user.id},
      ${body.displayName},
      ${body.bio || null},
      ${body.bioEn || null},
      ${JSON.stringify(body.expertise)}::jsonb,
      ${JSON.stringify(body.domains || [])}::jsonb,
      ${JSON.stringify(body.ageGroups || [])}::jsonb,
      ${body.yearsExperience || 0},
      ${body.hourlyRateVnd || 0},
      ${body.availabilityHoursPerWeek || 2},
      ${JSON.stringify(body.languages || ['vi', 'en'])}::jsonb
    )
    RETURNING *
  `;

  await logAuditEvent(c.env, {
    actor_id: user.id,
    actor_type: 'user',
    action: 'mentor.register',
    resource_type: 'project_mentor',
    resource_id: mentor.id,
  });

  return c.json({ mentor }, 201);
});

// POST /projects/:id/mentor — assign mentor
projects.post('/:id/mentor', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  if (!body.mentorId) return c.json({ error: 'missing_mentor_id' }, 400);

  const [updated] = await sql`
    UPDATE projects SET mentor_id = ${body.mentorId}, updated_at = now()
    WHERE id = ${id} AND user_id = ${user.id}
    RETURNING *
  `;

  if (!updated) return c.json({ error: 'project_not_found' }, 404);

  return c.json({ project: updated });
});

// ===== SESSIONS =====

// GET /projects/:id/sessions — list sessions
projects.get('/:id/sessions', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user') as any;
  const sql = getDb(c.env);
  const items = await sql`
    SELECT s.*, m.display_name as mentor_name
    FROM project_sessions s
    JOIN project_mentors m ON s.mentor_id = m.id
    WHERE s.project_id = ${id} AND (s.learner_id = ${user.id} OR m.user_id = ${user.id})
    ORDER BY s.scheduled_at DESC
  `;
  return c.json({ sessions: items });
});

// POST /projects/:id/session — schedule mentor session
projects.post('/:id/session', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  if (!body.mentorId || !body.scheduledAt) {
    return c.json({ error: 'missing_required_fields', required: ['mentorId', 'scheduledAt'] }, 400);
  }

  const [session] = await sql`
    INSERT INTO project_sessions (project_id, mentor_id, learner_id, session_type, scheduled_at, duration_minutes, notes)
    VALUES (
      ${id},
      ${body.mentorId},
      ${user.id},
      ${body.sessionType || 'feedback'},
      ${body.scheduledAt},
      ${body.durationMinutes || 30},
      ${body.notes || null}
    )
    RETURNING *
  `;

  return c.json({ session }, 201);
});

export default projects;
