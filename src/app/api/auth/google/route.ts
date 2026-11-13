import { getCloudflareEnv } from "@/lib/cloudflare";
import { cookieHeader, pkceChallenge, randomToken, readCookie } from "@/lib/account/crypto";
import { authorizationUrl, encodeNext, googleConfig, OAUTH_COOKIE, safeNextPath, withSignInError } from "@/lib/account/google";
import { DEVICE_COOKIE, DEVICE_SECONDS } from "@/lib/account/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const env = (await getCloudflareEnv()) as CloudflareEnv & { GOOGLE_CLIENT_ID?: string; GOOGLE_CLIENT_SECRET?: string };
  const config = googleConfig(env);
  const url = new URL(request.url);
  const next = safeNextPath(url.searchParams.get("next"));
  if (!config) return Response.redirect(new URL(withSignInError(next, "unavailable"), url), 302);
  const secure = url.protocol === "https:";
  const state = randomToken(24);
  const verifier = randomToken(48);
  const headers = new Headers({ location: authorizationUrl(config, state, await pkceChallenge(verifier)), "cache-control": "no-store" });
  // state.verifier.next, readable only by the callback path, for ten minutes.
  headers.append("set-cookie", cookieHeader(OAUTH_COOKIE, `${state}.${verifier}.${encodeNext(next)}`, 600, secure, "/api/auth/google/callback"));
  if (!readCookie(request.headers.get("cookie"), DEVICE_COOKIE)) {
    headers.append("set-cookie", cookieHeader(DEVICE_COOKIE, randomToken(24), DEVICE_SECONDS, secure));
  }
  return new Response(null, { status: 302, headers });
}
