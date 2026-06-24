import { neon } from '@neondatabase/serverless';

export function getDb(env: Env) {
  const db = neon(env.DATABASE_URL);
  // Attach DB to env for audit logging
  (env as any).DB = db;
  return db;
}
