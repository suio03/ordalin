import { cookieHeader, randomToken, sha256Hex } from "./crypto";

export const SESSION_COOKIE = "ordalin_session";
export const DEVICE_COOKIE = "ordalin_device";
/** Readable by scripts so the header can show "Account" instead of "Sign in". It grants nothing. */
export const SIGNED_IN_HINT_COOKIE = "ordalin_signed_in";
export const SESSION_SECONDS = 60 * 86_400;
export const DEVICE_SECONDS = 2 * 365 * 86_400;

export type AccountUser = { id: string; email: string; emailNormalized: string; name: string | null };

export async function createSession(db: D1Database, userId: string, now = Math.floor(Date.now() / 1000)) {
  const token = randomToken();
  await db.batch([
    db.prepare("INSERT INTO user_sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)").bind(await sha256Hex(token), userId, now + SESSION_SECONDS, now),
    db.prepare("DELETE FROM user_sessions WHERE expires_at < ?").bind(now),
  ]);
  return token;
}

export async function sessionUser(db: D1Database, token: string | null | undefined, now = Math.floor(Date.now() / 1000)): Promise<AccountUser | null> {
  if (!token) return null;
  const row = await db
    .prepare("SELECT u.id, u.email, u.email_normalized, u.name FROM user_sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.expires_at > ? AND u.status = 'active' LIMIT 1")
    .bind(await sha256Hex(token), now)
    .first<{ id: string; email: string; email_normalized: string; name: string | null }>();
  return row ? { id: row.id, email: row.email, emailNormalized: row.email_normalized, name: row.name } : null;
}

export async function deleteSession(db: D1Database, token: string) {
  await db.prepare("DELETE FROM user_sessions WHERE id = ?").bind(await sha256Hex(token)).run();
}

export function sessionCookies(token: string, secure: boolean) {
  return [
    cookieHeader(SESSION_COOKIE, token, SESSION_SECONDS, secure),
    cookieHeader(SIGNED_IN_HINT_COOKIE, "1", SESSION_SECONDS, secure, "/", false),
  ];
}

export function clearSessionCookies(secure: boolean) {
  return [
    cookieHeader(SESSION_COOKIE, "deleted", 0, secure),
    cookieHeader(SIGNED_IN_HINT_COOKIE, "deleted", 0, secure, "/", false),
  ];
}
