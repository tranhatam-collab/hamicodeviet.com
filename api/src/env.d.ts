interface Env {
  DATABASE_URL: string;
  JWT_SECRET: string;
  APP_URL: string;
  RESEND_API_KEY: string;
  PAYPAL_CLIENT_ID: string;
  PAYPAL_CLIENT_SECRET: string;
  PAYPAL_WEBHOOK_ID: string;
  PAYPAL_MODE: 'sandbox' | 'live';
  RATE_LIMITER: DurableObjectNamespace;
  EMAIL_QUEUE: Queue<EmailQueueMessage>;
  EMAIL_DLQ: Queue<EmailQueueMessage>;
  AI: Ai;
  AI_DAILY_LIMIT?: string;
}

interface EmailQueueMessage {
  type: 'verification' | 'password_reset' | 'guardian_verification';
  to: string;
  token: string;
  lang: 'vi' | 'en';
  attempts?: number;
  guardianCode?: string;
  guardianName?: string;
  childEmail?: string;
}

interface AuthUser {
  id: string;
  email: string;
  email_verified?: boolean;
  status?: string;
}

type AppBindings = { Bindings: Env; Variables: { user: AuthUser; requestId: string } };
