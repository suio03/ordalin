export type GoogleConfig = { clientId: string; clientSecret: string; redirectUri: string };
export type GoogleProfile = { sub: string; email: string; emailVerified: boolean; name: string | null };

export function googleConfig(env: { GOOGLE_CLIENT_ID?: string; GOOGLE_CLIENT_SECRET?: string; NEXT_PUBLIC_APP_URL?: string }): GoogleConfig | null {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.NEXT_PUBLIC_APP_URL) return null;
  return {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    redirectUri: new URL("/api/auth/google/callback", env.NEXT_PUBLIC_APP_URL).href,
  };
}

export function authorizationUrl(config: GoogleConfig, state: string, codeChallenge: string) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return url.href;
}

/** Exchanges the code server-side and reads the profile from Google's userinfo endpoint over TLS. */
export async function googleProfile(config: GoogleConfig, code: string, codeVerifier: string): Promise<GoogleProfile> {
  const token = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      code_verifier: codeVerifier,
      grant_type: "authorization_code",
      redirect_uri: config.redirectUri,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!token.ok) throw new Error(`Google token exchange failed (${token.status})`);
  const { access_token: accessToken } = (await token.json()) as { access_token?: string };
  if (!accessToken) throw new Error("Google returned no access token");
  const info = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (!info.ok) throw new Error(`Google userinfo failed (${info.status})`);
  const profile = (await info.json()) as { sub?: string; email?: string; email_verified?: boolean; name?: string };
  if (!profile.sub || !profile.email) throw new Error("Google profile is incomplete");
  return { sub: profile.sub, email: profile.email.toLowerCase(), emailVerified: profile.email_verified === true, name: profile.name?.slice(0, 120) ?? null };
}

export const OAUTH_COOKIE = "ordalin_oauth";
const NEXT_PATHS = ["/submit", "/account"] as const;

/** Only the two signed-in pages are post-login destinations. */
export function safeNextPath(value: string | null | undefined) {
  return NEXT_PATHS.find((path) => path === value) ?? "/submit";
}
