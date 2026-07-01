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
  } else if (msg.type === 'welcome') {
    subject = msg.lang === 'en'
      ? 'Welcome to HaMi Code Việt! 🎉'
      : 'Chào mừng bạn đến HaMi Code Việt! 🎉';
    html = welcomeEmailHtml(msg.displayName || '', msg.lang);
    text = msg.lang === 'en'
      ? `Welcome to HaMi Code Việt, ${msg.displayName}! Your account is ready. Start learning at https://app.hamicodeviet.com/dashboard`
      : `Chào mừng ${msg.displayName} đến HaMi Code Việt! Tài khoản của bạn đã sẵn sàng. Bắt đầu học tại https://app.hamicodeviet.com/dashboard`;
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

export function welcomeEmailHtml(displayName: string, lang: 'vi' | 'en'): string {
  const appUrl = 'https://app.hamicodeviet.com';
  const publicUrl = 'https://hamicodeviet.com';
  if (lang === 'en') {
    return `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <div style="text-align:center;margin-bottom:24px">
          <h1 style="color:#00A8CC;font-size:28px;margin:0">HaMi <span style="color:#102A43">&lt;CODE&gt;</span> Việt</h1>
        </div>
        <h2 style="color:#102A43">Welcome, ${displayName}! 🎉</h2>
        <p style="color:#334155;font-size:16px;line-height:1.6">
          Your HaMi Code Việt account is ready. You now have access to:
        </p>
        <ul style="color:#334155;font-size:15px;line-height:1.8;padding-left:20px">
          <li><strong>Free Learning</strong> — bilingual programming lessons (Vietnamese-English)</li>
          <li><strong>CodeLab</strong> — write and run code directly in your browser</li>
          <li><strong>15 real code products</strong> — build story makers, beat makers, websites, APIs</li>
          <li><strong>Project Workshop</strong> — 10-step real-world projects with mentors</li>
          <li><strong>AI Chat</strong> — bilingual AI tutor powered by Cloudflare Workers AI</li>
          <li><strong>Portfolio & Certificates</strong> — evidence-based skill verification</li>
        </ul>
        <a href="${appUrl}/dashboard" style="display:inline-block;background:#00A8CC;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
          Go to Dashboard
        </a>
        <a href="${publicUrl}/bat-dau" style="display:inline-block;background:#20A779;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0 16px 12px">
          Getting Started Guide
        </a>
        <div style="background:#F0F9FF;padding:16px;border-radius:8px;margin:24px 0">
          <p style="color:#102A43;font-size:14px;margin:0"><strong>Quick start:</strong></p>
          <ol style="color:#334155;font-size:14px;line-height:1.6;margin:8px 0 0;padding-left:20px">
            <li>Take the <a href="${publicUrl}/danh-gia-dau-vao" style="color:#00A8CC">input assessment</a> to find your level</li>
            <li>Pick a <a href="${publicUrl}/lo-trinh" style="color:#00A8CC">learning track</a> for your age group</li>
            <li>Try a <a href="${publicUrl}/san-pham" style="color:#00A8CC">code product</a> right away</li>
            <li>Start a <a href="${publicUrl}/xuong-du-an" style="color:#00A8CC">project</a> with a mentor</li>
          </ol>
        </div>
        <p style="color:#64748B;font-size:14px">If you have questions, reply to this email or visit our <a href="${publicUrl}/lien-he" style="color:#00A8CC">contact page</a>.</p>
        <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0">
        <p style="color:#94A3B8;font-size:12px;text-align:center">HaMi Code Việt — Học ngôn ngữ. Học lập trình. Làm ra sản phẩm thật.</p>
      </div>`;
  }
  return `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <div style="text-align:center;margin-bottom:24px">
        <h1 style="color:#00A8CC;font-size:28px;margin:0">HaMi <span style="color:#102A43">&lt;CODE&gt;</span> Việt</h1>
      </div>
      <h2 style="color:#102A43">Chào mừng, ${displayName}! 🎉</h2>
      <p style="color:#334155;font-size:16px;line-height:1.6">
        Tài khoản HaMi Code Việt của bạn đã sẵn sàng. Bạn có thể truy cập:
      </p>
      <ul style="color:#334155;font-size:15px;line-height:1.8;padding-left:20px">
        <li><strong>Học miễn phí</strong> — bài học lập trình song ngữ Việt-Anh</li>
        <li><strong>CodeLab</strong> — viết và chạy code trực tiếp trên trình duyệt</li>
        <li><strong>15 sản phẩm code thật</strong> — tạo truyện, nhạc, website, API</li>
        <li><strong>Xưởng dự án</strong> — dự án thật 10 bước cùng mentor</li>
        <li><strong>AI Chat</strong> — gia sư AI song ngữ (Cloudflare Workers AI)</li>
        <li><strong>Portfolio & Chứng chỉ</strong> — xác minh năng lực bằng bằng chứng</li>
      </ul>
      <a href="${appUrl}/dashboard" style="display:inline-block;background:#00A8CC;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
        Vào Dashboard
      </a>
      <a href="${publicUrl}/bat-dau" style="display:inline-block;background:#20A779;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0 16px 12px">
        Hướng dẫn bắt đầu
      </a>
      <div style="background:#F0F9FF;padding:16px;border-radius:8px;margin:24px 0">
        <p style="color:#102A43;font-size:14px;margin:0"><strong>Bắt đầu nhanh:</strong></p>
        <ol style="color:#334155;font-size:14px;line-height:1.6;margin:8px 0 0;padding-left:20px">
          <li>Làm <a href="${publicUrl}/danh-gia-dau-vao" style="color:#00A8CC">bài đánh giá đầu vào</a> để biết trình độ</li>
          <li>Chọn <a href="${publicUrl}/lo-trinh" style="color:#00A8CC">lộ trình học</a> theo độ tuổi</li>
          <li>Thử một <a href="${publicUrl}/san-pham" style="color:#00A8CC">sản phẩm code</a> ngay</li>
          <li>Bắt đầu một <a href="${publicUrl}/xuong-du-an" style="color:#00A8CC">dự án</a> cùng mentor</li>
        </ol>
      </div>
      <p style="color:#64748B;font-size:14px">Nếu bạn có câu hỏi, hãy trả lời email này hoặc vào trang <a href="${publicUrl}/lien-he" style="color:#00A8CC">liên hệ</a>.</p>
      <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0">
      <p style="color:#94A3B8;font-size:12px;text-align:center">HaMi Code Việt — Học ngôn ngữ. Học lập trình. Làm ra sản phẩm thật.</p>
    </div>`;
}
