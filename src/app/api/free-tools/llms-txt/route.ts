import { getCloudflareEnv } from "@/lib/cloudflare";
import type { LlmsDraft } from "@/lib/free-tools/llms-txt/format";
import { generateLlmsDraft, SiteUnreachableError } from "@/lib/free-tools/llms-txt/generate";
import { SubmissionError, submissionErrorResponse, type KnownTool } from "@/lib/submissions/http";
import { actorHash, clientAddress, consumeSubmissionLimit, submissionHashSalt } from "@/lib/submissions/request";
import { verifyTurnstile } from "@/lib/submissions/turnstile";
import { canonicalWebsite } from "@/lib/submissions/validation";

export const dynamic = "force-dynamic";

const CACHE_SECONDS = 6 * 60 * 60;

type WorkerCaches = CacheStorage & { default?: Cache };

function resultCache() {
  return typeof caches === "undefined" ? null : (caches as WorkerCaches).default ?? null;
}

export async function POST(request: Request) {
  try {
    const length = Number(request.headers.get("content-length") ?? 0);
    if (length > 8_192) throw new SubmissionError("Request is too large.", 413, "request_too_large");
    let body: { websiteUrl?: unknown; turnstileToken?: unknown; refresh?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      throw new SubmissionError("Enter a valid website.", 400, "invalid_website");
    }
    if (typeof body.websiteUrl !== "string" || body.websiteUrl.length > 2_048) {
      throw new SubmissionError("Enter a valid website.", 400, "invalid_website");
    }
    if (typeof body.turnstileToken !== "string" || body.turnstileToken.length > 4_096) {
      throw new SubmissionError("Verification expired or failed. Please try again.", 400, "turnstile_failed");
    }
    const requested = canonicalWebsite(body.websiteUrl);
    const env = await getCloudflareEnv();
    const runtimeEnv = env as CloudflareEnv & { SUBMISSION_HASH_SALT?: string; TURNSTILE_SECRET_KEY?: string };
    const address = clientAddress(request);
    await verifyTurnstile(body.turnstileToken, address, runtimeEnv.TURNSTILE_SECRET_KEY, "llms-txt");

    // One draft per domain is reused for a few hours unless the visitor asks to rebuild it.
    const cache = resultCache();
    const cacheKey = new Request(new URL(`/api/free-tools/llms-txt/cache/${requested.canonicalDomain}`, request.url));
    const hit = body.refresh === true ? undefined : await cache?.match(cacheKey);
    let draft = hit ? ((await hit.json()) as LlmsDraft) : null;
    const cached = Boolean(draft);
    if (!draft) {
      // Local previews may bind production data read-only, so attempts are only recorded on the live site.
      const local = ["localhost", "127.0.0.1", "[::1]"].includes(new URL(request.url).hostname);
      if (process.env.NODE_ENV !== "development" && !local) {
        const hash = await actorHash(address, submissionHashSalt(runtimeEnv.SUBMISSION_HASH_SALT));
        await consumeSubmissionLimit(env.DB, hash, "llms", 10);
      }
      try {
        draft = await generateLlmsDraft(requested.url);
      } catch (error) {
        if (error instanceof SiteUnreachableError) throw new SubmissionError(error.message, 422, "site_unreachable");
        throw error;
      }
      await cache?.put(cacheKey, Response.json(draft, { headers: { "cache-control": `public, max-age=${CACHE_SECONDS}` } }));
    }

    const tool = await env.DB
      .prepare("SELECT slug, name, status FROM tools WHERE canonical_domain = ? LIMIT 1")
      .bind(requested.canonicalDomain)
      .first<KnownTool>();
    const listing = tool?.status === "published" ? { slug: tool.slug, name: tool.name } : null;
    const inReview = tool?.status === "pending_review" || tool?.status === "imported";

    return Response.json({ draft, cached, listing, inReview });
  } catch (error) {
    return submissionErrorResponse(error);
  }
}
