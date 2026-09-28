import { createRemoteJWKSet, jwtVerify } from "jose";

type AccessEnvironment = {
  CLOUDFLARE_ACCESS_TEAM_DOMAIN?: string;
  CLOUDFLARE_ACCESS_AUD?: string;
};

export type AdminIdentity = {
  id: string;
  email: string | null;
};

const jwksByOrigin = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function accessOrigin(value: string) {
  const url = new URL(value.startsWith("https://") ? value : `https://${value}`);
  if (url.protocol !== "https:") throw new Error("Cloudflare Access team domain must use HTTPS");
  return url.origin;
}

export async function requireAdminAccess(
  headers: Headers,
  environment: AccessEnvironment,
): Promise<AdminIdentity> {
  const teamDomain = environment.CLOUDFLARE_ACCESS_TEAM_DOMAIN;
  const audience = environment.CLOUDFLARE_ACCESS_AUD;
  if (!teamDomain || !audience) {
    if (process.env.NODE_ENV !== "production") return { id: "local-admin", email: null };
    throw new Error("Cloudflare Access is not configured for admin routes");
  }

  const token = headers.get("cf-access-jwt-assertion");
  if (!token) throw new Error("Cloudflare Access authentication is required");
  const origin = accessOrigin(teamDomain);
  let jwks = jwksByOrigin.get(origin);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${origin}/cdn-cgi/access/certs`));
    jwksByOrigin.set(origin, jwks);
  }
  const result = await jwtVerify(token, jwks, {
    issuer: origin,
    audience,
  });
  const email = typeof result.payload.email === "string" ? result.payload.email : null;
  const subject = typeof result.payload.sub === "string" ? result.payload.sub : email;
  if (!subject) throw new Error("Cloudflare Access identity is incomplete");
  return { id: subject, email };
}

export function adminAccessErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Admin authentication failed";
  const missingConfiguration = message.includes("not configured");
  return Response.json(
    { error: missingConfiguration ? message : "Admin authentication is required." },
    { status: missingConfiguration ? 503 : 401 },
  );
}
