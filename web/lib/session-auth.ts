/**
 * Login de página para las herramientas internas de Charles (coalición,
 * monitor, orquestador) — a diferencia de api-auth.ts (Bearer
 * token para llamadas server-to-server), estos endpoints los llama el
 * propio navegador: la sesión vive en una cookie httpOnly firmada.
 *
 * Fail-closed: sin CHARLES_SESSION_SECRET/CHARLES_ADMIN_PASSWORD seteadas
 * en el server, el acceso queda cerrado para todos.
 *
 * Usa Web Crypto (no el módulo `crypto` de Node) para poder correr tanto
 * en middleware (Edge Runtime) como en route handlers normales.
 */

export const SESSION_COOKIE = 'charles_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 días

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacHex(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return bufToHex(sig);
}

/** Arma el valor firmado de la cookie de sesión. */
export async function createSessionValue(secret: string): Promise<string> {
  const expires = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `v1.${expires}`;
  return `${payload}.${await hmacHex(payload, secret)}`;
}

async function isValidSessionValue(value: string, secret: string): Promise<boolean> {
  const [v, expiresStr, sig] = value.split('.');
  if (!v || !expiresStr || !sig || v !== 'v1') return false;
  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;
  return safeEqual(sig, await hmacHex(`${v}.${expiresStr}`, secret));
}

/** Compara la contraseña recibida contra CHARLES_ADMIN_PASSWORD (fail-closed). */
export function verifyPassword(provided: string): boolean {
  const expected = process.env.CHARLES_ADMIN_PASSWORD;
  if (!expected || !provided) return false;
  return safeEqual(provided, expected);
}

/** Chequea si el request trae una cookie de sesión válida (fail-closed sin secret). */
export async function hasValidSession(cookieValue: string | undefined): Promise<boolean> {
  const secret = process.env.CHARLES_SESSION_SECRET;
  if (!secret || !cookieValue) return false;
  return isValidSessionValue(cookieValue, secret);
}
