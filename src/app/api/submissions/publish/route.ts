import { submissionFormData } from "@/lib/submissions/body";
import { confirmProfile, readDetailFields } from "@/lib/submissions/profile";
import { getCloudflareEnv, getCloudflareRuntime } from "@/lib/cloudflare";
import { validateSubmissionLogo, validateSubmissionScreenshot } from "@/lib/submissions/image";
import { knownToolError, SubmissionError, submissionErrorResponse, type KnownTool } from "@/lib/submissions/http";
import { parseSubmissionDraftPayload } from "@/lib/submissions/draft";
import { actorHash, clientAddress, consumeSubmissionLimit, submissionHashSalt } from "@/lib/submissions/request";
import { verifyTurnstile } from "@/lib/submissions/turnstile";
import { createToolSlug, parsePublishedSubmission } from "@/lib/submissions/validation";

export const dynamic = "force-dynamic";

function sqlPlaceholders(count: number) {
  return Array.from({ length: count }, () => "?").join(", ");
}

export async function POST(request: Request) {
  let storedLogoKey: string | null = null;
  let storedScreenshotKey: string | null = null;
  let committed = false;
  try {
    const form = await submissionFormData(request);
    const input = parsePublishedSubmission(form);
    const details = readDetailFields(form);
    const screenshot = await validateSubmissionScreenshot(form.get("screenshotFile"));
    const screenshotChoice = String(form.get("screenshotChoice") ?? "none");
    if (!["captured", "uploaded", "none"].includes(screenshotChoice) || (screenshotChoice === "none" ? Boolean(screenshot) : !screenshot)) throw new SubmissionError("Confirm your screenshot selection.", 400, "invalid_screenshot");
    const logo = await validateSubmissionLogo(form.get("logoFile"));
    const runtime = await getCloudflareRuntime();
    const env = runtime.env;
    const runtimeEnv = env as CloudflareEnv & {
      SUBMISSION_HASH_SALT?: string;
      TURNSTILE_SECRET_KEY?: string;
    };
    const address = clientAddress(request);
    const hash = await actorHash(address, submissionHashSalt(runtimeEnv.SUBMISSION_HASH_SALT));
    await consumeSubmissionLimit(env.DB, hash, "publish", 5);
    const turnstile = await verifyTurnstile(input.turnstileToken, address, runtimeEnv.TURNSTILE_SECRET_KEY);

    const now = Math.floor(Date.now() / 1000);
    const draft = await env.DB
      .prepare("SELECT website_url, canonical_domain, candidate_json FROM submission_drafts WHERE id = ? AND actor_hash = ? AND status = 'pending' AND expires_at > ?")
      .bind(input.draftId, hash, now)
      .first<{ website_url: string; canonical_domain: string; candidate_json: string }>();
    if (!draft) throw new SubmissionError("This preview expired. Check the website again.", 410, "draft_expired");
    const payload = parseSubmissionDraftPayload(draft.candidate_json);
    const { candidate, analysis } = payload;
    if (screenshotChoice === "captured" && !payload.screenshotHashes?.includes(screenshot!.hash)) throw new SubmissionError("This screenshot was not captured for this preview.", 400, "invalid_screenshot");
    const confirmed = confirmProfile(candidate, analysis, input, details, screenshotChoice as "captured" | "uploaded" | "none");

    const duplicate = await env.DB
      .prepare("SELECT slug, name, status FROM tools WHERE canonical_domain = ? LIMIT 1")
      .bind(draft.canonical_domain)
      .first<KnownTool>();
    if (duplicate) throw knownToolError(duplicate);

    const categoryRows = await env.DB
      .prepare(`SELECT id, slug, name FROM categories WHERE is_active = 1 AND slug IN (${sqlPlaceholders(input.categorySlugs.length)})`)
      .bind(...input.categorySlugs)
      .all<{ id: string; slug: string; name: string }>();
    if (categoryRows.results.length !== input.categorySlugs.length) throw new SubmissionError("One or more categories are unavailable.", 400, "invalid_category");
    const primaryCategory = categoryRows.results.find((category) => category.slug === input.primaryCategorySlug);
    if (!primaryCategory) throw new SubmissionError("Primary category is unavailable.", 400, "invalid_category");

    const tagRows = input.tagSlugs.length
      ? await env.DB
          .prepare(`SELECT id, slug, name, kind, category_group_id FROM tags WHERE is_active = 1 AND slug IN (${sqlPlaceholders(input.tagSlugs.length)})`)
          .bind(...input.tagSlugs)
          .all<{ id: string; slug: string; name: string; kind: string; category_group_id: string | null }>()
      : { results: [] };
    if (tagRows.results.length !== input.tagSlugs.length) throw new SubmissionError("One or more attributes are unavailable.", 400, "invalid_tag");
    const browseCategories = tagRows.results.filter((tag) => tag.kind === "category");
    if (!browseCategories.length || browseCategories.length > 4) {
      throw new SubmissionError("Choose at least one specific category.", 400, "invalid_tag");
    }
    if (!browseCategories.some((tag) => tag.category_group_id === primaryCategory.id)) {
      throw new SubmissionError("Choose a specific category from the primary group.", 400, "invalid_tag");
    }

    const toolId = `tool_${crypto.randomUUID()}`;
    const submissionId = `submission_${crypto.randomUUID()}`;
    let slug = createToolSlug(input.name, draft.canonical_domain);
    const slugExists = await env.DB.prepare("SELECT 1 FROM tools WHERE slug = ? LIMIT 1").bind(slug).first();
    if (slugExists) slug = `${slug}-${draft.canonical_domain.split(".")[0]}`.slice(0, 72);
    const secondSlugExists = await env.DB.prepare("SELECT 1 FROM tools WHERE slug = ? LIMIT 1").bind(slug).first();
    if (secondSlugExists) slug = `${slug.slice(0, 63)}-${crypto.randomUUID().slice(0, 8)}`;

    if (logo) {
      storedLogoKey = `tools/${toolId}/logo/${logo.hash}.webp`;
      await env.CATALOG_ASSETS.put(storedLogoKey, logo.bytes, {
        httpMetadata: { contentType: "image/webp", cacheControl: "public, max-age=31536000, immutable" },
        customMetadata: { width: String(logo.width), height: String(logo.height), source: "public-submission" },
      });
    }

    if (screenshot) {
      storedScreenshotKey = `tools/${toolId}/screenshots/${screenshot.hash}.webp`;
      await env.CATALOG_ASSETS.put(storedScreenshotKey, screenshot.bytes, {
        httpMetadata: { contentType: "image/webp", cacheControl: "public, max-age=31536000, immutable" },
        customMetadata: { width: "1440", height: "900", source: screenshotChoice === "captured" ? "website-preview" : "public-submission" },
      });
    }
    // The submission stays hidden until Ordalin researches it to the catalogue
    // profile standard; `pnpm imports:apply` publishes it (docs/catalog-enrichment.md).
    const statements = [
      env.DB
        .prepare("INSERT INTO tools (id, slug, name, tagline, description, website_url, canonical_domain, canonical_key, pricing_model, status, primary_category_id, logo_asset_key, screenshot_asset_key, is_editor_pick, source_first_seen_at, published_at, last_checked_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_review', ?, ?, ?, 0, ?, NULL, ?, ?, ?)")
        .bind(toolId, slug, input.name, input.tagline, input.description, draft.website_url, draft.canonical_domain, draft.canonical_domain, input.pricingModel, primaryCategory.id, storedLogoKey, storedScreenshotKey, now, candidate.evidencePages.length ? Math.floor(Date.parse(candidate.fetchedAt) / 1000) : null, now, now),
      ...categoryRows.results.map((category) =>
        env.DB
          .prepare("INSERT INTO tool_categories (tool_id, category_id, is_primary) VALUES (?, ?, ?)")
          .bind(toolId, category.id, category.slug === input.primaryCategorySlug ? 1 : 0),
      ),
      ...tagRows.results.map((tag) =>
        env.DB.prepare("INSERT INTO tool_tags (tool_id, tag_id) VALUES (?, ?)").bind(toolId, tag.id),
      ),
      env.DB
        .prepare("INSERT INTO tool_sources (id, tool_id, provider, external_id, source_url, raw_json, first_seen_at, last_seen_at) VALUES (?, ?, 'submission', ?, ?, ?, ?, ?)")
        .bind(`source_${crypto.randomUUID()}`, toolId, input.draftId, candidate.websiteUrl, JSON.stringify({ ...payload, confirmed }), now, now),
      env.DB
        .prepare("INSERT INTO submissions (id, submitted_name, website_url, canonical_domain, contact_email, description, suggested_category_id, status, turnstile_metadata_json, moderation_note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)")
        .bind(submissionId, input.name, draft.website_url, draft.canonical_domain, input.contactEmail, input.description, primaryCategory.id, JSON.stringify({ success: true, action: turnstile.action ?? null, hostname: turnstile.hostname ?? null }), "Awaiting a researched profile before publication", now, now),
      env.DB
        .prepare("INSERT INTO moderation_events (id, entity_type, entity_id, action, actor_identity, metadata_json, created_at) VALUES (?, 'tool', ?, 'submit', ?, ?, ?)")
        .bind(`event_${crypto.randomUUID()}`, toolId, `public-submission:${hash.slice(0, 12)}`, JSON.stringify({ submissionId, mode: "review", analysisSchemaVersion: analysis.schemaVersion }), now),
      env.DB
        .prepare("UPDATE submission_drafts SET status = 'published', updated_at = ? WHERE id = ? AND status = 'pending'")
        .bind(now, input.draftId),
    ];
    await env.DB.batch(statements);
    committed = true;
    return Response.json({ status: "in_review" }, { status: 202 });
  } catch (error) {
    if (!committed && (storedLogoKey || storedScreenshotKey)) {
      try {
        const env = await getCloudflareEnv();
        await env.CATALOG_ASSETS.delete([storedLogoKey, storedScreenshotKey].filter((key): key is string => Boolean(key)));
      } catch {
        // A content-hashed orphan is safe and can be removed by maintenance.
      }
    }
    if (error instanceof Error && /UNIQUE constraint failed: tools\.canonical_(domain|key)/i.test(error.message)) {
      return submissionErrorResponse(new SubmissionError("This website is already listed on Ordalin.", 409, "duplicate_domain"));
    }
    return submissionErrorResponse(error);
  }
}
