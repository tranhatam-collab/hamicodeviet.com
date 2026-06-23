import { neon } from '@neondatabase/serverless';

export function getDb(env: Env) {
  return neon(env.DATABASE_URL);
}
