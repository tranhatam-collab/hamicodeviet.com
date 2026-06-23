/**
 * JWT-like token using Web Crypto API (HMAC-SHA256).
 * Workers runtime supports crypto.subtle.sign/verify.
 */

export async function signJwt(
  payload: Record<string, unknown>,
  secret: string,
  expiresInSec: number = 7 * 24 * 3600,
): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, iat: now, exp: now + expiresInSec };

  const headerB64 = base64Url(JSON.stringify(header));
  const payloadB64 = base64Url(JSON.stringify(fullPayload));
  const data = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const sigB64 = base64UrlBytes(new Uint8Array(sig));

  return `${data}.${sigB64}`;
}

export async function verifyJwt(
  token: string,
  secret: string,
): Promise<Record<string, unknown> | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const data = `${parts[0]}.${parts[1]}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const sigBytes = fromBase64UrlBytes(parts[2]);
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    sigBytes,
    new TextEncoder().encode(data),
  );
  if (!valid) return null;

  const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) return null;

  return payload;
}

export async function hashToken(token: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return toHex(new Uint8Array(hash));
}

export function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return toHex(bytes);
}

function base64Url(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlBytes(bytes: Uint8Array): string {
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64UrlBytes(b64: string): Uint8Array {
  const raw = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
