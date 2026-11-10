import { getCloudflareEnv } from "@/lib/cloudflare";
import { cookieHeader, readCookie } from "@/lib/account/crypto";
import { normalizeEmail } from "@/lib/account/email";
import { googleConfig, googleProfile, OAUTH_COOKIE } from "@/lib/account/google";
import { createSession, DEVICE_COOKIE, sessionCookie } from "@/lib/account/session";
import { recordSignalStatements, requestSignals } from "@/lib/account/signals";
import { clientAddress, submissionHashSalt } from "@/lib/submissions/request";

export const dynamic = "force-dynamic";

function redirect(url: URL, path: string, cookies: string[] = []) {
  const headers = new Headers({ location: new URL(path, url).href, "cache-control": "no-store" });
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  return new Response(null, { status: 302, headers });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const secure = url.protocol === "https:";
  const clearOauth = cookieHeader(OAUTH_COOKIE, "deleted", 0, secure, "/api/auth/google/callback");
  const env = (await getCloudflareEnv()) as CloudflareEnv & { GOOGLE_CLIENT_ID?: string; GOOGLE_CLIENT_SECRET?: string; SUBMISSION_HASH_SALT?: string };
  const config = googleConfig(env);
  const stored = readCookie(request.headers.get("cookie"), OAUTH_COOKIE)?.split(".");
  const code = url.searchParams.get("code");
  if (!config || !stored || stored.length !== 3 || !code || url.searchParams.get("state") !== stored[0]) {
    return redirect(url, "/submit?signin=failed", [clearOauth]);
  }
  const next = stored[2] === "account" ? "/account" : "/submit";
  try {
    const profile = await googleProfile(config, code, stored[1]);
    if (!profile.emailVerified) return redirect(url, `${next}?signin=unverified`, [clearOauth]);
    const now = Math.floor(Date.now() / 1000);
    const db = env.DB;
    await db
      .prepare("INSERT INTO users (id, google_sub, email, email_normalized, name, status, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, 'active', ?, ?) ON CONFLICT(google_sub) DO UPDATE SET email = excluded.email, email_normalized = excluded.email_normalized, name = excluded.name, last_login_at = excluded.last_login_at")
      .bind(`user_${crypto.randomUUID()}`, profile.sub, profile.email, normalizeEmail(profile.email), profile.name, now, now)
      .run();
    const user = await db.prepare("SELECT id, status FROM users WHERE google_sub = ?").bind(profile.sub).first<{ id: string; status: string }>();
    if (!user || user.status !== "active") return redirect(url, `${next}?signin=blocked`, [clearOauth]);
    const signals = await requestSignals(clientAddress(request), readCookie(request.headers.get("cookie"), DEVICE_COOKIE), submissionHashSalt(env.SUBMISSION_HASH_SALT));
    const statements = recordSignalStatements(db, user.id, signals, now);
    if (statements.length) await db.batch(statements);
    const token = await createSession(db, user.id, now);
    return redirect(url, next, [clearOauth, sessionCookie(token, secure)]);
  } catch (error) {
    console.error("Google sign-in failed", error);
    return redirect(url, `${next}?signin=failed`, [clearOauth]);
  }
}
