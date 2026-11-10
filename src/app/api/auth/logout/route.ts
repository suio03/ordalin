import { getCloudflareEnv } from "@/lib/cloudflare";
import { readCookie } from "@/lib/account/crypto";
import { clearSessionCookie, deleteSession, SESSION_COOKIE } from "@/lib/account/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const token = readCookie(request.headers.get("cookie"), SESSION_COOKIE);
  if (token) await deleteSession((await getCloudflareEnv()).DB, token);
  return new Response(null, {
    status: 303,
    headers: { location: new URL("/submit", url).href, "set-cookie": clearSessionCookie(url.protocol === "https:"), "cache-control": "no-store" },
  });
}
