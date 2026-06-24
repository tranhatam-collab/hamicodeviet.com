import { neon } from '@neondatabase/serverless';

export function getDb(env: Env) {
  // Reuse existing DB instance if available (per-request caching)
  if ((env as any).DB) {
    return (env as any).DB;
  }
  const db = neon(env.DATABASE_URL);
  // Attach DB to env for audit logging and other libs
  (env as any).DB = db;
  return db;
}
