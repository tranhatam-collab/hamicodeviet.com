import { Hono } from 'hono';
import { getDb } from '../lib/db';
import { enqueueEmail } from '../lib/email';
import { logAuditEvent } from '../lib/audit';

const contact = new Hono<AppBindings>();

// POST /contact — submit contact form (public, no auth required)
contact.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'invalid_body' }, 400);

  const { name, email, subject, message } = body;

  if (!name || !email || !message) {
    return c.json({ error: 'missing_fields', required: ['name', 'email', 'message'] }, 400);
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: 'invalid_email' }, 400);
  }

  if (message.length > 5000) {
    return c.json({ error: 'message_too_long', max: 5000 }, 400);
  }

  const sql = getDb(c.env);

  // Store contact message in audit_logs as a structured event
  await logAuditEvent(c.env, {
    actor_type: 'system',
    action: 'contact.form.submit',
    resource_type: 'contact',
    changes: { name, email, subject: subject || 'other', message: message.substring(0, 1000) },
    ip: c.req.header('cf-connecting-ip'),
    user_agent: c.req.header('user-agent'),
    request_id: c.req.header('x-request-id') || 'unknown',
  });

  // Send notification email to support
  const subjectMap: Record<string, string> = {
    learn: 'learn@hamicodeviet.com',
    school: 'schools@hamicodeviet.com',
    safety: 'safety@hamicodeviet.com',
    other: 'support@hamicodeviet.com',
  };
  const targetEmail = subjectMap[subject || 'other'] || 'support@hamicodeviet.com';

  // Try to send email notification (best effort, don't fail if email fails)
  try {
    if (c.env.EMAIL_QUEUE) {
      await c.env.EMAIL_QUEUE.send({
        type: 'verification' as any,
        to: targetEmail,
        token: '',
        lang: 'vi' as const,
      });
    }
  } catch {
    // Email notification is best-effort
  }

  return c.json({ success: true, message: 'Tin nhắn đã được ghi nhận. Chúng tôi sẽ phản hồi sớm.' }, 201);
});

export default contact;
