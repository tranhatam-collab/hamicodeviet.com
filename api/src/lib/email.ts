/**
 * Email sending via Resend API.
 * https://resend.com/docs/api-reference/emails
 *
 * SECURITY: This module never logs tokens, magic links, or PII.
 * If email delivery fails, the system fails closed.
 *
 * Delivery path:
 *   1. Route enqueues EmailMessage to EMAIL_QUEUE
 *   2. Queue consumer calls sendEmailDirect()
 *   3. On failure, Cloudflare retries up to max_retries (3)
 *   4. After max_retries, message moves to EMAIL_DLQ (dead letter queue)
 */

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
}

const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM_EMAIL = 'HaMi Code Việt <noreply@hamicodeviet.com>';

/**
 * Check if email delivery is enabled and configured.
 */
export function isEmailEnabled(env: Env): boolean {
  return !!env.RESEND_API_KEY?.trim();
}

/**
 * Enqueue an email message for asynchronous delivery with retry + DLQ.
 * Returns true if enqueued, false if queue not configured.
 */
export async function enqueueEmail(
  msg: EmailQueueMessage,
  env: Env
): Promise<boolean> {
  if (!env.EMAIL_QUEUE) {
    // Fallback: send directly if no queue bound (local dev)
    return sendEmailDirect(msg, env);
  }
  try {
    await env.EMAIL_QUEUE.send(msg);
    console.log('[mail] Enqueued email type:', msg.type, 'to:', maskEmail(msg.to));
    return true;
  } catch (err: any) {
    console.error('[mail] Queue send failed:', err.cause?.code || err.message);
    return false;
  }
}

/**
 * Send email directly via Resend API (used by queue consumer).
 * Returns true on success, false on failure.
 * Never logs tokens, PII, or email content.
 */
export async function sendEmailDirect(
  msg: EmailQueueMessage,
  env: Env
): Promise<boolean> {
  const apiKey = (env.RESEND_API_KEY || '').trim();

  if (!apiKey) {
    console.error('[mail] RESEND_API_KEY missing — email delivery disabled');
    return false;
  }

  const appUrl = env.APP_URL || 'https://app.hamicodeviet.com';

  let subject: string;
  let html: string;
  let text: string;

  if (msg.type === 'guardian_verification') {
    subject = msg.lang === 'en'
      ? 'Guardian verification code — HaMi Code Việt'
      : 'Mã xác nhận người giám hộ — HaMi Code Việt';
    html = guardianVerificationHtml(msg.guardianCode || '', msg.guardianName || '', msg.childEmail || '', msg.lang);
    text = msg.lang === 'en'
      ? `Your guardian verification code is: ${msg.guardianCode}`
      : `Mã xác nhận người giám hộ của bạn là: ${msg.guardianCode}`;
  } else {
    const link =
      msg.type === 'verification'
        ? `${appUrl}/verify-email?token=${msg.token}`
        : `${appUrl}/reset-password?token=${msg.token}`;

    subject =
      msg.type === 'verification'
        ? msg.lang === 'en' ? 'Verify your email — HaMi Code Việt' : 'Xác nhận email — HaMi Code Việt'
        : msg.lang === 'en' ? 'Reset your password — HaMi Code Việt' : 'Đặt lại mật khẩu — HaMi Code Việt';

    html =
      msg.type === 'verification'
        ? verificationEmailHtml(msg.token, appUrl, msg.lang)
        : passwordResetEmailHtml(msg.token, appUrl, msg.lang);

    text =
      msg.type === 'verification'
        ? msg.lang === 'en'
          ? `Verify your email: ${link}`
          : `Xác nhận email: ${link}`
        : msg.lang === 'en'
          ? `Reset your password: ${link}`
          : `Đặt lại mật khẩu: ${link}`;
  }

  const payload = {
    from: FROM_EMAIL,
    to: [msg.to.toLowerCase().trim()],
    subject,
    html,
    text,
  };

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({} as Record<string, unknown>));
      console.log('[mail] Email sent via Resend, message_id:', (data as any).id || 'unknown');
      return true;
    }

    const errBody = await res.text().catch(() => 'non-json');
    console.error('[mail] Resend API error:', res.status, errBody.substring(0, 200));
    return false;
  } catch (err: any) {
    console.error('[mail] Resend network error:', err.cause?.code || 'timeout');
    return false;
  }
}

/**
 * Mask email for logging (e.g., "test@example.com" → "t***@e***.com")
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  return `${local[0]}***@${domain[0]}***.${domain.split('.').pop()}`;
}

export function verificationEmailHtml(token: string, appUrl: string, lang: 'vi' | 'en'): string {
  const link = `${appUrl}/verify-email?token=${token}`;
  if (lang === 'en') {
    return `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2 style="color:#102A43">Verify your email</h2>
        <p style="color:#334155;font-size:16px;line-height:1.6">
          Welcome to HaMi Code Viet! Click the button below to verify your email address.
        </p>
        <a href="${link}" style="display:inline-block;background:#00A8CC;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
          Verify email
        </a>
        <p style="color:#64748B;font-size:14px">If you didn't create an account, you can ignore this email.</p>
      </div>`;
  }
  return `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="color:#102A43">Xác nhận email</h2>
      <p style="color:#334155;font-size:16px;line-height:1.6">
        Chào mừng bạn đến HaMi Code Việt! Nhấn nút bên dưới để xác nhận địa chỉ email.
      </p>
      <a href="${link}" style="display:inline-block;background:#00A8CC;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
        Xác nhận email
      </a>
      <p style="color:#64748B;font-size:14px">Nếu bạn không tạo tài khoản, vui lòng bỏ qua email này.</p>
    </div>`;
}

export function passwordResetEmailHtml(token: string, appUrl: string, lang: 'vi' | 'en'): string {
  const link = `${appUrl}/reset-password?token=${token}`;
  if (lang === 'en') {
    return `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2 style="color:#102A43">Reset your password</h2>
        <p style="color:#334155;font-size:16px;line-height:1.6">
          We received a request to reset your password. Click the button below to set a new one.
        </p>
        <a href="${link}" style="display:inline-block;background:#00A8CC;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
          Reset password
        </a>
        <p style="color:#64748B;font-size:14px">This link expires in 1 hour. If you didn't request a reset, ignore this email.</p>
      </div>`;
  }
  return `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="color:#102A43">Đặt lại mật khẩu</h2>
      <p style="color:#334155;font-size:16px;line-height:1.6">
        Chúng tôi nhận được yêu cầu đặt lại mật khẩu. Nhấn nút bên dưới để tạo mật khẩu mới.
      </p>
      <a href="${link}" style="display:inline-block;background:#00A8CC;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
        Đặt lại mật khẩu
      </a>
      <p style="color:#64748B;font-size:14px">Liên kết hết hạn sau 1 giờ. Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
    </div>`;
}

export function guardianVerificationHtml(code: string, guardianName: string, childEmail: string, lang: 'vi' | 'en'): string {
  if (lang === 'en') {
    return `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2 style="color:#102A43">Guardian Verification Code</h2>
        <p style="color:#334155;font-size:16px;line-height:1.6">
          You are verifying guardianship over the account: <strong>${childEmail}</strong>
        </p>
        <p style="color:#334155;font-size:16px;line-height:1.6">
          Your 6-digit verification code is:
        </p>
        <div style="text-align:center;margin:24px 0">
          <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#00A8CC;background:#F0F9FF;padding:16px 32px;border-radius:8px;display:inline-block">
            ${code}
          </span>
        </div>
        <p style="color:#64748B;font-size:14px">Enter this code in the app to confirm guardianship. If you didn't request this, ignore this email.</p>
      </div>`;
  }
  return `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="color:#102A43">Mã Xác Nhận Người Giám Hộ</h2>
      <p style="color:#334155;font-size:16px;line-height:1.6">
        Bạn đang xác nhận quyền giám hộ đối với tài khoản: <strong>${childEmail}</strong>
      </p>
      <p style="color:#334155;font-size:16px;line-height:1.6">
        Mã xác nhận 6 chữ số của bạn là:
      </p>
      <div style="text-align:center;margin:24px 0">
        <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#00A8CC;background:#F0F9FF;padding:16px 32px;border-radius:8px;display:inline-block">
          ${code}
        </span>
      </div>
      <p style="color:#64748B;font-size:14px">Nhập mã này vào ứng dụng để xác nhận quyền giám hộ. Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
    </div>`;
}
