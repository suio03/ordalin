import { getPlatformProxy } from "wrangler";
import { fileURLToPath } from "node:url";
import { publicFetch } from "./public-fetch.ts";

const MAX_RENDERED_BYTES = 1_000_000;

/** Visible text length below which a crawled page is treated as a JavaScript shell. */
export function looksLikeScriptShell(html: string) {
  const text = html
    .replace(/<(script|style|noscript|template)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length < 1_500;
}

/**
 * A crawler fetcher for sites that render their content client-side. Requests
 * still go through the public HTTP path first, so robots.txt, redirects and
 * off-site checks behave exactly as in a plain crawl; only an HTML body that is
 * an empty JavaScript shell is replaced with the page as rendered by Cloudflare
 * server-side Browser Rendering. Only BROWSER is bound; no D1 or R2 access.
 */
export async function renderedFetchClient() {
  const proxy = await getPlatformProxy<Pick<CloudflareEnv, "BROWSER">>({
    configPath: fileURLToPath(new URL("../browser-capture.jsonc", import.meta.url)),
    remoteBindings: true,
    persist: false,
    envFiles: [],
  });
  let rendered = 0;

  async function render(url: string) {
    const response = await proxy.env.BROWSER.quickAction("content", {
      url,
      gotoOptions: { waitUntil: "networkidle2", timeout: 20_000 },
      waitForTimeout: 1_500,
      rejectResourceTypes: ["image", "media", "font"],
    });
    const body = await response.json().catch(() => null) as { success?: boolean; result?: unknown } | null;
    if (!response.ok || !body?.success || typeof body.result !== "string") {
      throw new Error(`Cloudflare rendering returned HTTP ${response.status} for ${url}`);
    }
    if (new TextEncoder().encode(body.result).byteLength > MAX_RENDERED_BYTES) throw new Error(`Rendered page exceeds ${MAX_RENDERED_BYTES} bytes`);
    rendered += 1;
    return body.result;
  }

  const fetcher: typeof fetch = async (input, init) => {
    const response = await publicFetch(input, init);
    const url = typeof input === "string" || input instanceof URL ? input.toString() : input.url;
    const wantsHtml = new Headers(init?.headers).get("accept")?.includes("text/html");
    if (!wantsHtml || !response.ok || !response.headers.get("content-type")?.includes("text/html")) return response;
    const html = await response.text();
    const body = looksLikeScriptShell(html) ? await render(url) : html;
    return new Response(body, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
  };

  return { fetcher, renderedPages: () => rendered, close: () => proxy.dispose() };
}
