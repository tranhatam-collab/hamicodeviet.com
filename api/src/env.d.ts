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
}

interface EmailQueueMessage {
  type: 'verification' | 'password_reset';
  to: string;
  token: string;
  lang: 'vi' | 'en';
  attempts?: number;
}

interface AuthUser {
  id: string;
  email: string;
  email_verified?: boolean;
  status?: string;
}

type AppBindings = { Bindings: Env; Variables: { user: AuthUser; requestId: string } };
