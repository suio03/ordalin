import { getCloudflareEnv } from "@/lib/cloudflare";
import {
  analyzeCatalogCandidate,
  fallbackCatalogAnalysis,
} from "@/lib/catalog-analysis";
import { loadCatalogTaxonomy } from "@/lib/catalog-analysis/taxonomy";
import { enrichCatalogSite } from "@/lib/catalog-enrichment/enrich";
import { knownToolError, SubmissionError, submissionErrorResponse, type KnownTool } from "@/lib/submissions/http";
import { actorHash, clientAddress, consumeSubmissionLimit, submissionHashSalt } from "@/lib/submissions/request";
import { canonicalWebsite } from "@/lib/submissions/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const length = Number(request.headers.get("content-length") ?? 0);
    if (length > 8_192) throw new SubmissionError("Request is too large.", 413, "request_too_large");
    let body: { websiteUrl?: unknown };
    try {
      body = (await request.json()) as { websiteUrl?: unknown };
    } catch {
      throw new SubmissionError("Enter a valid HTTPS website.", 400, "invalid_website");
    }
    if (typeof body.websiteUrl !== "string" || body.websiteUrl.length > 2_048) {
      throw new SubmissionError("Enter a valid HTTPS website.", 400, "invalid_website");
    }
    const requested = canonicalWebsite(body.websiteUrl);
    const env = await getCloudflareEnv();
    const runtimeEnv = env as CloudflareEnv & {
      SUBMISSION_HASH_SALT?: string;
      OPENAI_API_KEY?: string;
      OPENAI_ANALYSIS_MODEL?: string;
    };
    const hash = await actorHash(
      clientAddress(request),
      submissionHashSalt(runtimeEnv.SUBMISSION_HASH_SALT),
    );
    await consumeSubmissionLimit(env.DB, hash, "enrich", 10);

    const duplicate = await env.DB
      .prepare("SELECT slug, name, status FROM tools WHERE canonical_domain = ? LIMIT 1")
      .bind(requested.canonicalDomain)
      .first<KnownTool>();
    if (duplicate) throw knownToolError(duplicate);

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
    if (postFetchDuplicate) throw knownToolError(postFetchDuplicate);

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
        .prepare("UPDATE submission_drafts SET status = 'expired', updated_at = ? WHERE status = 'pending' AND expires_at <= ?")
        .bind(now, now),
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

    return Response.json({ draftId, candidate, analysis });
  } catch (error) {
    return submissionErrorResponse(error);
  }
}
