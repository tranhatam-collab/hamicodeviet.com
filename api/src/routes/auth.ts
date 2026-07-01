import { Hono } from 'hono';
import { getDb } from '../lib/db';
import { hashPassword, verifyPassword } from '../lib/password';
import { signJwt, verifyJwt, hashToken, generateToken } from '../lib/jwt';
import { enqueueEmail, isEmailEnabled } from '../lib/email';
import { getBearerToken } from '../lib/auth';
import { logAuditEvent, logSecurityEvent } from '../lib/audit';

const auth = new Hono<{ Bindings: Env }>();

// POST /auth/signup
auth.post('/signup', async (c) => {
  const body = await c.req.json();
  const email = (body.email || '').toLowerCase().trim();
  const password = body.password || '';
  const displayName = (body.displayName || '').trim();
  const language = body.language === 'en' ? 'en' : 'vi';
  const birthYear = body.birthYear ? parseInt(body.birthYear, 10) : null;
  const country = body.country || 'VN';

  // Validation
  if (!email || !email.includes('@') || email.length > 255) {
    return c.json({ error: 'invalid_email' }, 400);
  }
  if (password.length < 8) {
    return c.json({ error: 'password_too_short' }, 400);
  }
  if (!displayName || displayName.length > 100) {
    return c.json({ error: 'invalid_display_name' }, 400);
  }
  // Age check: if under 13, require guardian email
  const currentYear = new Date().getFullYear();
  const age = birthYear ? currentYear - birthYear : null;
  const guardianEmail = (body.guardianEmail || '').toLowerCase().trim();
  if (age !== null && age < 13 && !guardianEmail) {
    return c.json({ error: 'guardian_required', message: 'Learners under 13 require a guardian email.' }, 400);
  }

  const sql = getDb(c.env);

  // Check if email already exists
  const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length > 0) {
    return c.json({ error: 'email_exists' }, 409);
  }

  const passwordHash = await hashPassword(password);

  // Create user + profile
  const [user] = await sql`
    INSERT INTO users (email, password_hash, status)
    VALUES (${email}, ${passwordHash}, 'active')
    RETURNING id, email, email_verified, created_at
  `;

  await sql`
    INSERT INTO profiles (user_id, display_name, birth_year, country, language)
    VALUES (${user.id}, ${displayName}, ${birthYear}, ${country}, ${language})
  `;

  // Assign learner role
  await sql`INSERT INTO user_roles (user_id, role_id) VALUES (${user.id}, 'learner')`;

  // Log audit event
  await logAuditEvent(c.env, {
    actor_id: user.id,
    actor_type: 'user',
    action: 'user.signup',
    resource_type: 'user',
    resource_id: user.id,
    changes: { email, displayName, birthYear, country, language },
    ip: c.req.header('cf-connecting-ip'),
    user_agent: c.req.header('user-agent'),
    request_id: c.req.header('x-request-id'),
  });

  // If guardian email provided, create guardian + link
  if (guardianEmail) {
    // Create or find guardian
    let [guardian] = await sql`SELECT id FROM guardians WHERE email = ${guardianEmail}`;
    if (!guardian) {
      [guardian] = await sql`
        INSERT INTO guardians (email, display_name)
        VALUES (${guardianEmail}, NULL)
        RETURNING id
      `;
    }
    // Create pending link
    const linkToken = generateToken();
    await sql`
      INSERT INTO guardian_links (guardian_id, learner_id, status, invitation_token)
      VALUES (${guardian.id}, ${user.id}, 'pending', ${linkToken})
      ON CONFLICT (guardian_id, learner_id) DO NOTHING
    `;
    // Send guardian invitation email
    // (will be implemented when mail.iai.one is configured)
  }

  // Create email verification token
  const verifyToken = generateToken();
  const verifyTokenHash = await hashToken(verifyToken);
  await sql`
    INSERT INTO email_verifications (user_id, token_hash, expires_at)
    VALUES (${user.id}, ${verifyTokenHash}, now() + interval '24 hours')
  `;

  // Send verification email via queue (with retry + DLQ)
  const emailSent = await enqueueEmail({
    type: 'verification',
    to: email,
    token: verifyToken,
    lang: language,
  }, c.env);
  if (!emailSent) {
    console.error('[email] Verification email enqueue failed for user_id:', user.id);
  }

  // Send welcome email (separate from verification)
  const welcomeSent = await enqueueEmail({
    type: 'welcome',
    to: email,
    token: '',
    lang: language,
    displayName,
  }, c.env);
  if (!welcomeSent) {
    console.error('[email] Welcome email enqueue failed for user_id:', user.id);
  }

  // Create session
  const sessionToken = await signJwt(
    { sub: user.id, email: user.email },
    c.env.JWT_SECRET,
    7 * 24 * 3600,
  );
  const sessionTokenHash = await hashToken(sessionToken);
  await sql`
    INSERT INTO sessions (user_id, token_hash, expires_at, ip, user_agent)
    VALUES (${user.id}, ${sessionTokenHash}, now() + interval '7 days', ${c.req.header('cf-connecting-ip') || null}, ${c.req.header('user-agent') || null})
  `;

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      emailVerified: user.email_verified,
      displayName,
      language,
    },
    token: sessionToken,
    requiresEmailVerification: true,
    emailSent,
  }, 201);
});

// POST /auth/login
auth.post('/login', async (c) => {
  const body = await c.req.json();
  const email = (body.email || '').toLowerCase().trim();
  const password = body.password || '';

  if (!email || !password) {
    return c.json({ error: 'missing_credentials' }, 400);
  }

  const sql = getDb(c.env);
  const [user] = await sql`
    SELECT id, email, password_hash, email_verified, status
    FROM users WHERE email = ${email}
  `;

  if (!user) {
    return c.json({ error: 'invalid_credentials' }, 401);
  }
  if (user.status === 'suspended') {
    return c.json({ error: 'account_suspended' }, 403);
  }
  if (user.status === 'deleted') {
    return c.json({ error: 'account_deleted' }, 403);
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    // Log security event for failed login
    await logSecurityEvent(c.env, {
      event_type: 'login_failed',
      severity: 'medium',
      user_id: user.id,
      ip: c.req.header('cf-connecting-ip'),
      user_agent: c.req.header('user-agent'),
      details: { email },
      request_id: c.req.header('x-request-id'),
    });
    return c.json({ error: 'invalid_credentials' }, 401);
  }

  // Get profile
  const [profile] = await sql`SELECT display_name, language FROM profiles WHERE user_id = ${user.id}`;

  // Create session
  const sessionToken = await signJwt(
    { sub: user.id, email: user.email },
    c.env.JWT_SECRET,
    7 * 24 * 3600,
  );
  const sessionTokenHash = await hashToken(sessionToken);
  await sql`
    INSERT INTO sessions (user_id, token_hash, expires_at, ip, user_agent)
    VALUES (${user.id}, ${sessionTokenHash}, now() + interval '7 days', ${c.req.header('cf-connecting-ip') || null}, ${c.req.header('user-agent') || null})
  `;

  // Log audit event for successful login
  await logAuditEvent(c.env, {
    actor_id: user.id,
    actor_type: 'user',
    action: 'user.login',
    resource_type: 'user',
    resource_id: user.id,
    ip: c.req.header('cf-connecting-ip'),
    user_agent: c.req.header('user-agent'),
    request_id: c.req.header('x-request-id'),
  });

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      emailVerified: user.email_verified,
      displayName: profile?.display_name || '',
      language: profile?.language || 'vi',
    },
    token: sessionToken,
    requiresEmailVerification: !user.email_verified,
  });
});

// POST /auth/logout
auth.post('/logout', async (c) => {
  const token = getBearerToken(c);
  if (!token) return c.json({ success: true });

  const sql = getDb(c.env);
  const tokenHash = await hashToken(token);
  await sql`UPDATE sessions SET revoked_at = now() WHERE token_hash = ${tokenHash}`;
  return c.json({ success: true });
});

// GET /auth/me
auth.get('/me', async (c) => {
  const token = getBearerToken(c);
  if (!token) return c.json({ error: 'unauthorized' }, 401);

  const payload = await verifyJwt(token, c.env.JWT_SECRET);
  if (!payload) return c.json({ error: 'invalid_token' }, 401);

  const sql = getDb(c.env);
  const tokenHash = await hashToken(token);
  const [session] = await sql`
    SELECT s.id, s.expires_at, s.revoked_at
    FROM sessions s
    WHERE s.token_hash = ${tokenHash} AND s.revoked_at IS NULL AND s.expires_at > now()
  `;
  if (!session) return c.json({ error: 'session_expired' }, 401);

  const [user] = await sql`
    SELECT u.id, u.email, u.email_verified, u.status, p.display_name, p.language, p.birth_year, p.country, p.avatar_url, p.bio
    FROM users u
    LEFT JOIN profiles p ON p.user_id = u.id
    WHERE u.id = ${payload.sub}
  `;
  if (!user) return c.json({ error: 'user_not_found' }, 404);

  const roles = await sql`SELECT role_id FROM user_roles WHERE user_id = ${user.id}`;

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      emailVerified: user.email_verified,
      status: user.status,
      displayName: user.display_name || '',
      language: user.language || 'vi',
      birthYear: user.birth_year,
      country: user.country,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      roles: roles.map((r: any) => r.role_id),
    },
  });
});

// POST /auth/verify-email
auth.post('/verify-email', async (c) => {
  const body = await c.req.json();
  const token = body.token || '';
  if (!token) return c.json({ error: 'missing_token' }, 400);

  const sql = getDb(c.env);
  const tokenHash = await hashToken(token);
  const [verification] = await sql`
    SELECT id, user_id, expires_at, used_at
    FROM email_verifications
    WHERE token_hash = ${tokenHash} AND used_at IS NULL AND expires_at > now()
  `;
  if (!verification) return c.json({ error: 'invalid_or_expired_token' }, 400);

  await sql.transaction([
    sql`UPDATE email_verifications SET used_at = now() WHERE id = ${verification.id}`,
    sql`UPDATE users SET email_verified = true WHERE id = ${verification.user_id}`,
  ]);

  return c.json({ success: true });
});

// POST /auth/forgot-password
auth.post('/forgot-password', async (c) => {
  // Fail closed: if email delivery is not configured, return 503
  if (!isEmailEnabled(c.env)) {
    return c.json({ error: 'email_service_unavailable', message: 'Password reset is temporarily unavailable. Please contact support.' }, 503);
  }

  const body = await c.req.json();
  const email = (body.email || '').toLowerCase().trim();
  if (!email) return c.json({ error: 'missing_email' }, 400);

  const sql = getDb(c.env);
  const [user] = await sql`SELECT id, email FROM users WHERE email = ${email} AND status = 'active'`;

  // Don't reveal if email exists
  if (!user) return c.json({ success: true });

  const [profile] = await sql`SELECT language FROM profiles WHERE user_id = ${user.id}`;
  const lang = profile?.language || 'vi';

  const resetToken = generateToken();
  const resetTokenHash = await hashToken(resetToken);

  // Invalidate all previous reset tokens for this user (single-use, new invalidates old)
  await sql`UPDATE password_resets SET used_at = now() WHERE user_id = ${user.id} AND used_at IS NULL`;

  await sql`
    INSERT INTO password_resets (user_id, token_hash, expires_at, ip)
    VALUES (${user.id}, ${resetTokenHash}, now() + interval '1 hour', ${c.req.header('cf-connecting-ip') || null})
  `;

  const emailSent = await enqueueEmail({
    type: 'password_reset',
    to: email,
    token: resetToken,
    lang,
  }, c.env);

  // SECURITY: Never log reset tokens. Fail closed — if email fails,
  // user won't receive reset link. Do NOT expose token in response or logs.
  if (!emailSent) {
    console.error('[email] Password reset email delivery failed for user_id:', user.id);
  }

  return c.json({ success: true });
});

// POST /auth/reset-password
auth.post('/reset-password', async (c) => {
  const body = await c.req.json();
  const token = body.token || '';
  const newPassword = body.password || '';
  if (!token || newPassword.length < 8) {
    return c.json({ error: 'invalid_request' }, 400);
  }

  const sql = getDb(c.env);
  const tokenHash = await hashToken(token);
  const [reset] = await sql`
    SELECT id, user_id, expires_at, used_at
    FROM password_resets
    WHERE token_hash = ${tokenHash} AND used_at IS NULL AND expires_at > now()
  `;
  if (!reset) return c.json({ error: 'invalid_or_expired_token' }, 400);

  const passwordHash = await hashPassword(newPassword);
  await sql.transaction([
    sql`UPDATE password_resets SET used_at = now() WHERE id = ${reset.id}`,
    sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${reset.user_id}`,
    sql`UPDATE sessions SET revoked_at = now() WHERE user_id = ${reset.user_id} AND revoked_at IS NULL`,
  ]);

  return c.json({ success: true });
});

// POST /auth/resend-verification
auth.post('/resend-verification', async (c) => {
  // Fail closed: if email delivery is not configured, return 503
  if (!isEmailEnabled(c.env)) {
    return c.json({ error: 'email_service_unavailable', message: 'Email verification is temporarily unavailable. Please contact support.' }, 503);
  }

  const token = getBearerToken(c);
  if (!token) return c.json({ error: 'unauthorized' }, 401);

  const payload = await verifyJwt(token, c.env.JWT_SECRET);
  if (!payload) return c.json({ error: 'invalid_token' }, 401);

  const sql = getDb(c.env);
  const [user] = await sql`SELECT id, email, email_verified FROM users WHERE id = ${payload.sub}`;
  if (!user) return c.json({ error: 'user_not_found' }, 404);
  if (user.email_verified) return c.json({ error: 'already_verified' }, 400);

  const [profile] = await sql`SELECT language FROM profiles WHERE user_id = ${user.id}`;
  const lang = profile?.language || 'vi';

  const verifyToken = generateToken();
  const verifyTokenHash = await hashToken(verifyToken);

  // Invalidate all previous verification tokens for this user (single-use, new invalidates old)
  await sql`UPDATE email_verifications SET used_at = now() WHERE user_id = ${user.id} AND used_at IS NULL`;

  await sql`
    INSERT INTO email_verifications (user_id, token_hash, expires_at)
    VALUES (${user.id}, ${verifyTokenHash}, now() + interval '24 hours')
  `;

  const emailSent = await enqueueEmail({
    type: 'verification',
    to: user.email,
    token: verifyToken,
    lang,
  }, c.env);

  // SECURITY: Never log verification tokens. Fail closed.
  if (!emailSent) {
    console.error('[email] Resend verification email enqueue failed for user_id:', user.id);
    return c.json({ error: 'email_service_unavailable', message: 'Email delivery is temporarily unavailable. Please try again later.' }, 503);
  }

  return c.json({ success: true });
});

// PUT /auth/profile — update user profile
auth.put('/profile', async (c) => {
  const token = getBearerToken(c);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const payload = await verifyJwt(token, c.env.JWT_SECRET);
  if (!payload) return c.json({ error: 'invalid_token' }, 401);

  const body = await c.req.json();
  const displayName = body.displayName?.trim();
  const language = body.language === 'en' ? 'en' : 'vi';

  if (!displayName) return c.json({ error: 'missing_display_name' }, 400);

  const sql = getDb(c.env);
  await sql`
    UPDATE profiles SET display_name = ${displayName}, language = ${language}, updated_at = now()
    WHERE user_id = ${payload.sub}
  `;

  return c.json({ success: true, displayName, language });
});

// POST /auth/logout-all — revoke all sessions
auth.post('/logout-all', async (c) => {
  const token = getBearerToken(c);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const payload = await verifyJwt(token, c.env.JWT_SECRET);
  if (!payload) return c.json({ error: 'invalid_token' }, 401);

  const sql = getDb(c.env);
  await sql`UPDATE sessions SET revoked_at = now() WHERE user_id = ${payload.sub} AND revoked_at IS NULL`;

  return c.json({ success: true });
});

// ===== GOOGLE OAUTH =====

// GET /auth/google — redirect to Google OAuth consent screen
auth.get('/google', async (c) => {
  const clientId = c.env.GOOGLE_CLIENT_ID;
  const redirectUri = c.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return c.json({ error: 'google_oauth_not_configured' }, 503);
  }
  const state = generateToken().substring(0, 32);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  });
  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

// GET /auth/google/callback — handle Google OAuth callback
auth.get('/google/callback', async (c) => {
  const code = c.req.query('code');
  const error = c.req.query('error');

  if (error) {
    return c.redirect(`${c.env.APP_URL}/login?error=google_auth_cancelled`);
  }
  if (!code) {
    return c.redirect(`${c.env.APP_URL}/login?error=google_no_code`);
  }

  const clientId = c.env.GOOGLE_CLIENT_ID;
  const clientSecret = c.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = c.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return c.redirect(`${c.env.APP_URL}/login?error=google_not_configured`);
  }

  // Exchange code for tokens
  let googleTokens: any;
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
      signal: AbortSignal.timeout(10000),
    });
    googleTokens = await tokenRes.json();
    if (!googleTokens.access_token) {
      return c.redirect(`${c.env.APP_URL}/login?error=google_token_exchange_failed`);
    }
  } catch (err: any) {
    console.error('[google] Token exchange failed:', err.cause?.code || err.message);
    return c.redirect(`${c.env.APP_URL}/login?error=google_token_exchange_failed`);
  }

  // Get user info from Google
  let googleUser: any;
  try {
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${googleTokens.access_token}` },
      signal: AbortSignal.timeout(10000),
    });
    googleUser = await userRes.json();
    if (!googleUser.email) {
      return c.redirect(`${c.env.APP_URL}/login?error=google_no_email`);
    }
  } catch (err: any) {
    console.error('[google] Userinfo fetch failed:', err.cause?.code || err.message);
    return c.redirect(`${c.env.APP_URL}/login?error=google_userinfo_failed`);
  }

  const email = googleUser.email.toLowerCase().trim();
  const displayName = googleUser.name || googleUser.given_name || email.split('@')[0];
  const googleSub = googleUser.id;
  const language = 'vi';
  const sql = getDb(c.env);

  // Check if user exists by email
  let [user] = await sql`SELECT id, email, email_verified, status FROM users WHERE email = ${email}`;
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    [user] = await sql`
      INSERT INTO users (email, password_hash, status, email_verified)
      VALUES (${email}, ${'oauth:google:' + googleSub}, 'active', true)
      RETURNING id, email, email_verified, status
    `;

    await sql`
      INSERT INTO profiles (user_id, display_name, language, avatar_url)
      VALUES (${user.id}, ${displayName}, ${language}, ${googleUser.picture || null})
    `;

    await sql`INSERT INTO user_roles (user_id, role_id) VALUES (${user.id}, 'learner')`;

    await logAuditEvent(c.env, {
      actor_id: user.id,
      actor_type: 'user',
      action: 'user.signup.google',
      resource_type: 'user',
      resource_id: user.id,
      changes: { email, displayName, provider: 'google' },
      ip: c.req.header('cf-connecting-ip'),
      user_agent: c.req.header('user-agent'),
    });
  } else {
    if (googleUser.picture) {
      await sql`UPDATE profiles SET avatar_url = ${googleUser.picture} WHERE user_id = ${user.id} AND avatar_url IS NULL`;
    }
    await logAuditEvent(c.env, {
      actor_id: user.id,
      actor_type: 'user',
      action: 'user.login.google',
      resource_type: 'user',
      resource_id: user.id,
      ip: c.req.header('cf-connecting-ip'),
      user_agent: c.req.header('user-agent'),
    });
  }

  // Send welcome email for new users
  if (isNewUser) {
    const welcomeSent = await enqueueEmail({
      type: 'welcome',
      to: email,
      token: '',
      lang: language,
      displayName,
    }, c.env);
    if (!welcomeSent) {
      console.error('[email] Welcome email enqueue failed for user_id:', user.id);
    }
  }

  // Create session
  const sessionToken = await signJwt(
    { sub: user.id, email: user.email },
    c.env.JWT_SECRET,
    7 * 24 * 3600,
  );
  const sessionTokenHash = await hashToken(sessionToken);
  await sql`
    INSERT INTO sessions (user_id, token_hash, expires_at, ip, user_agent)
    VALUES (${user.id}, ${sessionTokenHash}, now() + interval '7 days', ${c.req.header('cf-connecting-ip') || null}, ${c.req.header('user-agent') || null})
  `;

  // Redirect to app with token in fragment (not query — keeps it out of server logs)
  const redirectUrl = `${c.env.APP_URL}/google-callback#token=${encodeURIComponent(sessionToken)}`;
  return c.redirect(redirectUrl);
});

export default auth;
