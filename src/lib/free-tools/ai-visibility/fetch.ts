import { assertPublicHttpsUrl } from "@/lib/catalog-enrichment/url-policy";
import { buildVisibilityReport, sitemapUrl, type FetchedResource, type VisibilityReport } from "./checks";
import { browserUserAgent, probeAgents } from "./crawlers";

const MAX_REDIRECTS = 5;
const TIMEOUT_MS = 8_000;
const PAGE_BYTES = 1_500_000;
const TEXT_BYTES = 256_000;

type Options = { userAgent: string; maxBytes: number; readBody: boolean; accept: string };

/** Reads at most `maxBytes`; a page larger than that is still worth checking from its start. */
async function readCapped(response: Response, maxBytes: number) {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.byteLength;
  }
  await reader.cancel().catch(() => undefined);
  const bytes = new Uint8Array(Math.min(size, maxBytes));
  let offset = 0;
  for (const chunk of chunks) {
    const part = chunk.subarray(0, bytes.byteLength - offset);
    bytes.set(part, offset);
    offset += part.byteLength;
    if (offset >= bytes.byteLength) break;
  }
  return new TextDecoder().decode(bytes);
}

/** Follows redirects by hand so every hop passes the public-URL policy; never throws. */
export async function fetchResource(target: string, fetcher: typeof fetch, options: Options): Promise<FetchedResource> {
  let url = target;
  try {
    for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
      assertPublicHttpsUrl(url);
      const response = await fetcher(url, {
        headers: { accept: options.accept, "user-agent": options.userAgent },
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        await response.body?.cancel().catch(() => undefined);
        if (!location) return { status: response.status, url, error: "Redirect without a location" };
        url = new URL(location, url).href;
        continue;
      }
      const resource: FetchedResource = {
        status: response.status,
        url,
        contentType: response.headers.get("content-type") ?? undefined,
        robotsTag: response.headers.get("x-robots-tag") ?? undefined,
      };
      if (options.readBody && response.status >= 200 && response.status < 300) {
        resource.body = await readCapped(response, options.maxBytes);
      } else {
        await response.body?.cancel().catch(() => undefined);
      }
      return resource;
    }
    return { status: null, url, error: "Too many redirects" };
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return { status: null, url, error: timedOut ? "Timed out" : "Could not connect" };
  }
}

export async function checkAiVisibility(website: URL, fetcher: typeof fetch = fetch): Promise<VisibilityReport> {
  const origin = website.origin;
  const html = "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8";
  const text = "text/plain,*/*;q=0.8";
  const browser = { userAgent: browserUserAgent, readBody: true };

  const [page, robots, llms, ...probes] = await Promise.all([
    fetchResource(`${origin}/`, fetcher, { ...browser, accept: html, maxBytes: PAGE_BYTES }),
    fetchResource(`${origin}/robots.txt`, fetcher, { ...browser, accept: text, maxBytes: TEXT_BYTES }),
    fetchResource(`${origin}/llms.txt`, fetcher, { ...browser, accept: text, maxBytes: TEXT_BYTES }),
    ...probeAgents.map((agent) =>
      fetchResource(`${origin}/`, fetcher, { userAgent: agent.userAgent, accept: html, readBody: false, maxBytes: 0 }),
    ),
  ]);
  const sitemap = await fetchResource(sitemapUrl(robots, origin), fetcher, {
    ...browser,
    accept: "application/xml,text/xml;q=0.9,*/*;q=0.8",
    readBody: false,
    maxBytes: 0,
  });

  return buildVisibilityReport({
    website: `${origin}/`,
    page,
    robots,
    llms,
    sitemap,
    probes: probes.map((probe, index) => ({ token: probeAgents[index].token, status: probe.status, error: probe.error })),
  });
}
