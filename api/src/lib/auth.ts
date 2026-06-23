/**
 * Shared auth helpers — used by all route modules.
 */
import { verifyJwt } from './jwt';

export function getBearerToken(c: any): string | null {
  const auth = c.req.header('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.substring(7);
}

export async function verifySession(token: string, env: Env): Promise<{ sub: string; email: string } | null> {
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return null;
  return { sub: payload.sub as string, email: payload.email as string };
}
