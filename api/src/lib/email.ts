/**
 * Email sending via mail.iai.one API.
 * Sends transactional emails: verification, password reset, guardian invitation.
 */

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
}

const MAIL_API_BASE_URL = 'https://api.mail.iai.one/v1';
const MAIL_SEND_PATHS = ['/send', '/v1/send', '/emails', '/v1/emails'];
const FROM_EMAIL = 'HaMi Code Việt <noreply@hamicodeviet.com>';

export async function sendEmail(params: EmailParams, env: Env): Promise<boolean> {
  const apiKey = (env.MAIL_API_KEY || '').trim();
  const workspaceId = (env.MAIL_API_WORKSPACE_ID || '').trim();

  if (!apiKey) {
    console.log('[mail] MAIL_API_KEY missing, skipping email to:', params.to);
    return false;
  }
  if (!workspaceId) {
    console.log('[mail] MAIL_API_WORKSPACE_ID missing, skipping email to:', params.to);
    return false;
  }

  const payload = {
    from: FROM_EMAIL,
    to: [params.to.toLowerCase().trim()],
    subject: params.subject,
    html: params.html,
    text: params.text,
  };

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    authorization: `Bearer ${apiKey}`,
    'x-request-id': `hmcv-${crypto.randomUUID()}`,
    'x-workspace-id': workspaceId,
  };

  // Try multiple send paths (mail.iai.one accepts /send or /emails)
  for (const sendPath of MAIL_SEND_PATHS) {
    const url = `${MAIL_API_BASE_URL}${sendPath}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        console.log('[mail] Email sent to:', params.to, 'via', sendPath);
        return true;
      }

      // If 404/405, try next path
      if (res.status === 404 || res.status === 405) {
        continue;
      }

      // Other errors: log and stop
      const raw = await res.text().catch(() => 'non-json');
      console.error('[mail] Send failed:', res.status, sendPath, raw.substring(0, 200));
      return false;
    } catch (err) {
      console.error('[mail] Network error:', sendPath, err);
      // Try next path
    }
  }

  console.error('[mail] All send paths failed for:', params.to);
  return false;
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
