import { getCloudflareEnv } from "@/lib/cloudflare";
import { readCookie } from "@/lib/account/crypto";
import { clearSessionCookies, deleteSession, SESSION_COOKIE } from "@/lib/account/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const token = readCookie(request.headers.get("cookie"), SESSION_COOKIE);
  if (token) await deleteSession((await getCloudflareEnv()).DB, token);
  const headers = new Headers({ location: new URL("/", url).href, "cache-control": "no-store" });
  for (const cookie of clearSessionCookies(url.protocol === "https:")) headers.append("set-cookie", cookie);
  return new Response(null, { status: 303, headers });
}
