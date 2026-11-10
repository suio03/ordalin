import { getCloudflareEnv } from "@/lib/cloudflare";
import {
  analyzeCatalogCandidate,
  fallbackCatalogAnalysis,
} from "@/lib/catalog-analysis";
import { loadCatalogTaxonomy } from "@/lib/catalog-analysis/taxonomy";
import { enrichCatalogSite } from "@/lib/catalog-enrichment/enrich";
import { knownToolError, SubmissionError, submissionErrorResponse, type KnownTool } from "@/lib/submissions/http";
import { actorHash, clientAddress, consumeSubmissionLimit, submissionHashSalt } from "@/lib/submissions/request";
import { verifyTurnstile } from "@/lib/submissions/turnstile";
import { canonicalWebsite } from "@/lib/submissions/validation";
import { readCookie } from "@/lib/account/crypto";
import { SESSION_COOKIE, sessionUser } from "@/lib/account/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const length = Number(request.headers.get("content-length") ?? 0);
    if (length > 8_192) throw new SubmissionError("Request is too large.", 413, "request_too_large");
    let body: { websiteUrl?: unknown; turnstileToken?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      throw new SubmissionError("Enter a valid HTTPS website.", 400, "invalid_website");
    }
    if (typeof body.websiteUrl !== "string" || body.websiteUrl.length > 2_048) {
      throw new SubmissionError("Enter a valid HTTPS website.", 400, "invalid_website");
    }
    if (typeof body.turnstileToken !== "string" || body.turnstileToken.length > 4_096) {
      throw new SubmissionError("Verification expired or failed. Please try again.", 400, "turnstile_failed");
    }
    const requested = canonicalWebsite(body.websiteUrl);
    const env = await getCloudflareEnv();
    const runtimeEnv = env as CloudflareEnv & {
      SUBMISSION_HASH_SALT?: string;
      TURNSTILE_SECRET_KEY?: string;
      OPENAI_API_KEY?: string;
      OPENAI_ANALYSIS_MODEL?: string;
    };
    // Drafts call OpenAI, so only signed-in submitters can start one.
    if (!(await sessionUser(env.DB, readCookie(request.headers.get("cookie"), SESSION_COOKIE)))) {
      throw new SubmissionError("Sign in with Google to submit a tool.", 401, "signin_required");
    }
    const address = clientAddress(request);
    const hash = await actorHash(address, submissionHashSalt(runtimeEnv.SUBMISSION_HASH_SALT));
    await consumeSubmissionLimit(env.DB, hash, "enrich", 10);
    // Each check crawls the site and calls OpenAI, so it needs its own verification.
    await verifyTurnstile(body.turnstileToken, address, runtimeEnv.TURNSTILE_SECRET_KEY, "submit-enrich");

    const duplicate = await env.DB
      .prepare("SELECT slug, name, status FROM tools WHERE canonical_domain = ? LIMIT 1")
      .bind(requested.canonicalDomain)
      .first<KnownTool>();
    // A declined domain may come back, but only as a credit submission.
    if (duplicate && duplicate.status !== "rejected") throw knownToolError(duplicate);

    const candidate = await enrichCatalogSite(requested.url.href).catch(() => ({
      schemaVersion: 1 as const, status: "pending_review" as const,
      websiteUrl: requested.url.href, canonicalDomain: requested.canonicalDomain,
      fetchedAt: new Date().toISOString(), identity: { name: null, tagline: null },
      assets: [], pricingSignals: [], platforms: [], officialLinks: [], evidencePages: [],
      warnings: ["We could not read this website. You can fill in the profile and upload images yourself."],
    }));
    const postFetchDuplicate = await env.DB
      .prepare("SELECT slug, name, status FROM tools WHERE canonical_domain = ? LIMIT 1")
      .bind(candidate.canonicalDomain)
      .first<KnownTool>();
    if (postFetchDuplicate && postFetchDuplicate.status !== "rejected") throw knownToolError(postFetchDuplicate);
    const creditOnly = Boolean(duplicate || postFetchDuplicate);

    const taxonomy = await loadCatalogTaxonomy(env.DB);
    let analysis = fallbackCatalogAnalysis(candidate, taxonomy);
    if (runtimeEnv.OPENAI_API_KEY && candidate.evidencePages.length) {
      try {
        analysis = await analyzeCatalogCandidate(candidate, taxonomy, {
          includeDetails: true,
          apiKey: runtimeEnv.OPENAI_API_KEY,
          model: runtimeEnv.OPENAI_ANALYSIS_MODEL,
          safetyIdentifier: hash,
        });
      } catch (error) {
        analysis.needsReviewReasons = ["Automatic analysis failed; review every generated field."];
        console.warn("OpenAI submission analysis failed; using the evidence fallback", {
          domain: candidate.canonicalDomain,
          error: error instanceof Error ? error.message : "unknown error",
        });
      }
    }
    const payload = { schemaVersion: 2 as const, candidate, analysis };
    const now = Math.floor(Date.now() / 1000);
    const draftId = crypto.randomUUID();
    await env.DB.batch([
      env.DB
        .prepare("DELETE FROM submission_drafts WHERE expires_at <= ?")
        .bind(now),
      env.DB
        .prepare(
          "INSERT INTO submission_drafts (id, website_url, canonical_domain, candidate_json, actor_hash, status, expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)",
        )
        .bind(
          draftId,
          candidate.websiteUrl,
          candidate.canonicalDomain,
          JSON.stringify(payload),
          hash,
          now + 30 * 60,
          now,
          now,
        ),
    ]);

    return Response.json({ draftId, candidate, analysis, creditOnly });
  } catch (error) {
    return submissionErrorResponse(error);
  }
}
