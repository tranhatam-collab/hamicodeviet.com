interface Env {
  DATABASE_URL: string;
  JWT_SECRET: string;
  APP_URL: string;
  MAIL_API_KEY: string;
  MAIL_API_WORKSPACE_ID: string;
}

interface AuthUser {
  id: string;
  email: string;
  email_verified: boolean;
  status: string;
}

type AppBindings = { Bindings: Env; Variables: { user: AuthUser } };
