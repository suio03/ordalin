import { LOCAL_READ_ONLY_MESSAGE } from "@/lib/local-read-only";
import { type NextRequest, NextResponse } from "next/server";

// POST routes that only read: the AI visibility checker records nothing locally.
const localReadOnlyPosts = new Set(["/api/free-tools/ai-visibility"]);

export function middleware(request: NextRequest) {
  const { hostname, pathname, protocol } = request.nextUrl;
  const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(hostname);
  if (
    (process.env.NODE_ENV === "development" || isLocal) &&
    !["GET", "HEAD", "OPTIONS"].includes(request.method) &&
    !localReadOnlyPosts.has(pathname)
  ) {
    return NextResponse.json({ error: LOCAL_READ_ONLY_MESSAGE, code: "local_read_only" }, { status: 403 });
  }
  const isWww = hostname === "www.ordalin.com";
  const isInsecureRoot = hostname === "ordalin.com" && protocol === "http:";
  if (!isWww && !isInsecureRoot) {
    return NextResponse.next();
  }

  const destination = request.nextUrl.clone();
  destination.hostname = "ordalin.com";
  destination.protocol = "https";
  destination.port = "";

  return NextResponse.redirect(destination, 301);
}
