import { reviewedImportScreenshot } from "./lib/import-screenshot.ts";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { checkResearchedProfile } from "../src/lib/catalog-profile/contract.ts";
import { decideCatalogAnalysis } from "../src/lib/catalog-analysis/gate.ts";
import { parseCatalogAnalysis, type CatalogTaxonomy } from "../src/lib/catalog-analysis/contract.ts";
import type { DomainCategory } from "../src/lib/catalog-analysis/content-policy.ts";
import { assertPublicHttpsUrl } from "../src/lib/catalog-enrichment/url-policy.ts";
import type { CatalogImportBundle, CatalogImportManifest, ImportProvider } from "../src/lib/catalog-import/contract.ts";
import { catalogDayBounds } from "../src/lib/catalog-import/schedule.ts";
import { databaseMode, d1File, d1Query, sqlNullable, sqlText } from "./lib/wrangler.ts";
import { assertStatementFits, storedCandidate } from "./lib/stored-evidence.ts";

const execute = promisify(execFile);
const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const mode = databaseMode();
const files = process.argv.slice(2).filter((argument) => !argument.startsWith("--"));
const manifestArgument = process.argv.find((argument) => argument.startsWith("--manifest="))?.split("=", 2)[1];
const BATCH_PUBLISH_LIMIT = 20;
const DAILY_PUBLISH_LIMIT = 20;
const ASSET_SCRIPT_TIMEOUT_MS = 90_000;
const ORPHANED_IMPORT_GRACE_SECONDS = 15 * 60;

function positiveIntegerOption(name: string) {
  const raw = process.argv.find((argument) => argument.startsWith(`${name}=`))?.split("=", 2)[1];
  if (raw === undefined) return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) throw new Error(`${name} must be a positive integer.`);
  return value;
}

const requestedPublishLimit = positiveIntegerOption("--publish-limit");
const requestedDailyPublishLimit = positiveIntegerOption("--daily-publish-limit");
if (!manifestArgument && (requestedPublishLimit !== null || requestedDailyPublishLimit !== null)) {
  throw new Error("Publication limits require --manifest so the batch can be counted deterministically.");
}
if (requestedPublishLimit !== null && requestedPublishLimit !== BATCH_PUBLISH_LIMIT) {
  throw new Error(`--publish-limit must be ${BATCH_PUBLISH_LIMIT}.`);
}
if (requestedDailyPublishLimit !== null && requestedDailyPublishLimit !== DAILY_PUBLISH_LIMIT) {
  throw new Error(`--daily-publish-limit must be ${DAILY_PUBLISH_LIMIT}.`);
}
const publishLimit = manifestArgument ? BATCH_PUBLISH_LIMIT : null;
const dailyPublishLimit = manifestArgument ? DAILY_PUBLISH_LIMIT : null;

type CategoryRow = { id: string; slug: string; name: string; description: string };
type TagRow = {
  id: string;
  slug: string;
  name: string;
  kind: "category" | "interface" | "attribute";
  group_slug: string | null;
  description: string;
};
type ApplyOutcome = "published" | "skipped" | "duplicate" | "batch_limit_reached" | "daily_limit_reached";
type BatchContext = {
  manifest: CatalogImportManifest;
  manifestPath: string;
  allowedFiles: Set<string>;
  domains: string[];
};

function normalizeDomain(value: string) {
  return value.toLowerCase().replace(/^www\./, "");
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function cleanText(value: string, max: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

async function taxonomy() {
  const categories = await d1Query<CategoryRow>(projectRoot, mode, "SELECT id, slug, name, description FROM categories WHERE is_active = 1 ORDER BY sort_order, name");
  const tags = await d1Query<TagRow>(projectRoot, mode, "SELECT t.id, t.slug, t.name, t.kind, c.slug AS group_slug, t.description FROM tags t LEFT JOIN categories c ON c.id = t.category_group_id WHERE t.is_active = 1 ORDER BY t.kind, t.name");
  if (!categories.length || !tags.length) throw new Error("The catalogue taxonomy is empty.");
  const publicTaxonomy: CatalogTaxonomy = {
    categories: categories.map(({ slug, name, description }) => ({ slug, name, description })),
    tags: tags.map(({ slug, name, kind, group_slug, description }) => ({
      slug,
      name,
      kind,
      groupSlug: group_slug,
      description,
    })),
  };
  return { categories, tags, publicTaxonomy };
}

function parseBundle(value: unknown): CatalogImportBundle {
  if (!value || typeof value !== "object") throw new Error("Import bundle is not an object.");
  const record = value as Partial<CatalogImportBundle>;
  if (record.schemaVersion !== 1) throw new Error("Unsupported import bundle version.");
  if (record.provider !== "toolify" && record.provider !== "product_hunt" && record.provider !== "manual") throw new Error("Unsupported import provider.");
  if (!record.externalId || !record.discoveryUrl || !record.websiteUrl || !record.preparedAt) throw new Error("Import bundle metadata is incomplete.");
  assertPublicHttpsUrl(record.discoveryUrl);
  const website = assertPublicHttpsUrl(record.websiteUrl);
  if (!record.candidate || record.candidate.schemaVersion !== 1) throw new Error("Website evidence is missing.");
  if (normalizeDomain(website.hostname) !== record.candidate.canonicalDomain) throw new Error("Bundle website and evidence domain do not match.");
  if (record.canonicalKey !== undefined && (record.canonicalKey !== record.candidate.canonicalDomain && !record.canonicalKey.startsWith(`${record.candidate.canonicalDomain}/`))) {
    throw new Error("Bundle canonicalKey must be the evidence domain or a path on it.");
  }
  if (!record.analysis) throw new Error("analysis is null; Codex must analyze this bundle before it can be applied.");
  return { ...record, analysis: parseCatalogAnalysis(record.analysis) } as CatalogImportBundle;
}

function parseManifest(value: unknown): CatalogImportManifest {
  if (!value || typeof value !== "object") throw new Error("Import manifest is not an object.");
  const record = value as Partial<CatalogImportManifest>;
  if (record.schemaVersion !== 1 || !record.preparedAt || !Array.isArray(record.files)) {
    throw new Error("Import manifest is incomplete or unsupported.");
  }
  return record as CatalogImportManifest;
}

async function loadBatchContext(): Promise<BatchContext | null> {
  if (!manifestArgument) return null;
  const manifestPath = path.resolve(projectRoot, manifestArgument);
  const manifest = parseManifest(JSON.parse(await readFile(manifestPath, "utf8")));
  const manifestDirectory = path.dirname(manifestPath);
  const allowedFiles = new Set(manifest.files.map((filename) => path.resolve(manifestDirectory, filename)));
  const domains = await Promise.all(manifest.files.map(async (filename) => {
    const value = JSON.parse(await readFile(path.resolve(manifestDirectory, filename), "utf8")) as Partial<CatalogImportBundle>;
    if (value.preparedAt !== manifest.preparedAt || !value.candidate?.canonicalDomain) {
      throw new Error(`${filename} does not belong to the selected manifest.`);
    }
    return value.canonicalKey ?? value.candidate.canonicalDomain;
  }));
  return { manifest, manifestPath, allowedFiles, domains: [...new Set(domains)] };
}

async function publishedCountForBatch(context: BatchContext) {
  if (!context.domains.length) return 0;
  const domains = context.domains.map(sqlText).join(", ");
  const rows = await d1Query<{ count: number }>(projectRoot, mode, `
    SELECT COUNT(*) AS count
    FROM import_candidates
    WHERE status = 'published' AND canonical_key IN (${domains})
  `);
  return Number(rows[0]?.count ?? 0);
}

async function publishedCountForMelbourneDay() {
  const { start, end } = catalogDayBounds();
  const startSeconds = Math.floor(start.getTime() / 1_000);
  const endSeconds = Math.floor(end.getTime() / 1_000);
  const rows = await d1Query<{ count: number }>(projectRoot, mode, `
    SELECT COUNT(*) AS count
    FROM import_candidates i
    INNER JOIN tools t ON t.id = i.tool_id
    WHERE i.status = 'published'
      AND t.published_at >= ${startSeconds}
      AND t.published_at < ${endSeconds}
  `);
  return Number(rows[0]?.count ?? 0);
}

async function uniqueSlug(name: string, domain: string) {
  const base = slugify(name) || slugify(domain) || `tool-${crypto.randomUUID().slice(0, 8)}`;
  const candidates = [base, `${base}-${domain.split(".")[0]}`.slice(0, 72), `${base.slice(0, 63)}-${crypto.randomUUID().slice(0, 8)}`];
  for (const candidate of candidates) {
    const rows = await d1Query<{ found: number }>(projectRoot, mode, `SELECT 1 AS found FROM tools WHERE slug = ${sqlText(candidate)} LIMIT 1`);
    if (!rows.length) return candidate;
  }
  throw new Error("A unique tool slug could not be created.");
}

const identityKey = (bundle: CatalogImportBundle) => bundle.canonicalKey ?? bundle.candidate.canonicalDomain;

async function duplicate(bundle: CatalogImportBundle) {
  return (await d1Query<{ id: string }>(projectRoot, mode, `
    SELECT id FROM import_candidates
      WHERE (provider = ${sqlText(bundle.provider)} AND external_id = ${sqlText(bundle.externalId)})
         OR canonical_key = ${sqlText(identityKey(bundle))}
    UNION ALL
    SELECT id FROM tools WHERE canonical_key = ${sqlText(identityKey(bundle))}
    LIMIT 1
  `))[0] ?? null;
}

type SubmittedTool = { id: string; slug: string; screenshot_asset_key: string | null };

// A visitor submission is stored hidden; the researched bundle for its domain completes and publishes it.
async function pendingSubmission(bundle: CatalogImportBundle) {
  return (await d1Query<SubmittedTool>(projectRoot, mode, `
    SELECT t.id, t.slug, t.screenshot_asset_key FROM tools t
    WHERE t.canonical_domain = ${sqlText(bundle.candidate.canonicalDomain)}
      AND t.status = 'pending_review'
      AND EXISTS (SELECT 1 FROM tool_sources s WHERE s.tool_id = t.id AND s.provider = 'submission')
    LIMIT 1
  `))[0] ?? null;
}

async function runAssetScript(script: "catalog:logos" | "catalog:screenshots", toolId: string, screenshotFile?: string) {
  const result = await execute("pnpm", [script, "--", mode, `--tool-id=${toolId}`, "--include-pending", ...(screenshotFile ? [`--screenshot-file=${screenshotFile}`] : [])], {
    cwd: projectRoot,
    maxBuffer: 20 * 1024 * 1024,
    timeout: ASSET_SCRIPT_TIMEOUT_MS,
  });
  if (result.stdout.trim()) console.log(result.stdout.trim());
}

async function recordWithoutTool(
  bundle: CatalogImportBundle,
  status: "skipped" | "failed",
  reasons: string[],
  errorSummary: string | null,
) {
  const now = Math.floor(Date.now() / 1000);
  const importId = `import_${crypto.randomUUID()}`;
  await d1File(projectRoot, mode, [
    `INSERT INTO import_candidates (id, provider, external_id, discovery_url, website_url, canonical_domain, canonical_key, status, candidate_json, analysis_json, decision_reasons_json, tool_id, error_summary, discovered_at, analyzed_at, created_at, updated_at) VALUES (${sqlText(importId)}, ${sqlText(bundle.provider)}, ${sqlText(bundle.externalId)}, ${sqlText(bundle.discoveryUrl)}, ${sqlText(bundle.websiteUrl)}, ${sqlText(bundle.candidate.canonicalDomain)}, ${sqlText(identityKey(bundle))}, ${sqlText(status)}, ${sqlText(JSON.stringify(storedCandidate(bundle.candidate, bundle.analysis)))}, ${sqlText(JSON.stringify(bundle.analysis))}, ${sqlText(JSON.stringify(reasons))}, NULL, ${sqlNullable(errorSummary)}, ${now}, ${now}, ${now}, ${now})`,
    `INSERT INTO moderation_events (id, entity_type, entity_id, action, actor_identity, metadata_json, created_at) VALUES (${sqlText(`event_${crypto.randomUUID()}`)}, 'import_candidate', ${sqlText(importId)}, ${sqlText(status === "skipped" ? "skip" : "analyze")}, 'codex-schedule', ${sqlText(JSON.stringify({ provider: bundle.provider, reasons }))}, ${now})`,
  ]);
}

/**
 * Cloudflare's content categories for the domain, which the gate checks for adult, gambling and threat
 * sites. Production imports fail (and stay retryable) when the lookup does; local runs skip it.
 */
async function domainCategories(domain: string): Promise<DomainCategory[]> {
  if (mode !== "--remote") return [];
  try {
    const { stdout } = await execute("cf", ["intel", "domains", "get", "--domain", domain, "--skip-dns", "--skip-ranking"], { timeout: 60_000 });
    const parsed = JSON.parse(stdout) as { content_categories?: DomainCategory[] };
    return parsed.content_categories ?? [];
  } catch (error) {
    throw new Error(`Cloudflare domain category lookup failed for ${domain}: ${error instanceof Error ? error.message : error}`);
  }
}

async function skipPreparedTool(
  bundle: CatalogImportBundle,
  importId: string,
  toolId: string,
  reasons: string[],
  errorSummary: string,
) {
  const now = Math.floor(Date.now() / 1000);
  const uniqueReasons = [...new Set(reasons)];
  await d1File(projectRoot, mode, [
    `UPDATE import_candidates SET status = 'skipped', decision_reasons_json = ${sqlText(JSON.stringify(uniqueReasons))}, tool_id = NULL, error_summary = ${sqlText(errorSummary)}, updated_at = ${now} WHERE id = ${sqlText(importId)} AND status = 'pending_review'`,
    `DELETE FROM tools WHERE id = ${sqlText(toolId)} AND status = 'pending_review'`,
    `INSERT INTO moderation_events (id, entity_type, entity_id, action, actor_identity, metadata_json, created_at) VALUES (${sqlText(`event_${crypto.randomUUID()}`)}, 'import_candidate', ${sqlText(importId)}, 'skip', 'codex-schedule', ${sqlText(JSON.stringify({ provider: bundle.provider, reasons: uniqueReasons, errorSummary }))}, ${now})`,
  ]);
}

type OrphanedImportRow = {
  import_id: string;
  provider: ImportProvider;
  tool_id: string | null;
  decision_reasons_json: string;
};

function parsedReasons(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((reason) => typeof reason === "string") ? parsed : [];
  } catch {
    return [];
  }
}

async function skipOrphanedAutomaticImports() {
  const staleBefore = Math.floor(Date.now() / 1000) - ORPHANED_IMPORT_GRACE_SECONDS;
  const orphaned = await d1Query<OrphanedImportRow>(projectRoot, mode, `
    SELECT i.id AS import_id, i.provider, i.tool_id, i.decision_reasons_json
    FROM import_candidates i
    LEFT JOIN tools t ON t.id = i.tool_id
    WHERE i.status = 'pending_review'
      AND i.updated_at < ${staleBefore}
      AND (t.id IS NULL OR t.status = 'pending_review')
      AND EXISTS (
        SELECT 1 FROM moderation_events e
        WHERE e.entity_type = 'import_candidate'
          AND e.entity_id = i.id
          AND e.action = 'analyze'
          AND e.actor_identity = 'codex-schedule'
      )
  `);
  for (const orphan of orphaned) {
    const now = Math.floor(Date.now() / 1000);
    const errorSummary = "Previous automatic import did not reach a publish-or-skip outcome.";
    const reasons = [...new Set([...parsedReasons(orphan.decision_reasons_json), "Automatic import did not finish; the candidate was skipped permanently."])];
    await d1File(projectRoot, mode, [
      `UPDATE import_candidates SET status = 'skipped', decision_reasons_json = ${sqlText(JSON.stringify(reasons))}, tool_id = NULL, error_summary = ${sqlText(errorSummary)}, updated_at = ${now} WHERE id = ${sqlText(orphan.import_id)} AND status = 'pending_review'`,
      ...(orphan.tool_id ? [`DELETE FROM tools WHERE id = ${sqlText(orphan.tool_id)} AND status = 'pending_review'`] : []),
      `INSERT INTO moderation_events (id, entity_type, entity_id, action, actor_identity, metadata_json, created_at) VALUES (${sqlText(`event_${crypto.randomUUID()}`)}, 'import_candidate', ${sqlText(orphan.import_id)}, 'skip', 'codex-schedule', ${sqlText(JSON.stringify({ provider: orphan.provider, reasons, errorSummary }))}, ${now})`,
    ]);
    console.log(`${orphan.import_id}: skipped orphaned automatic import`);
  }
}

async function applyBundle(filename: string, batchContext: BatchContext | null): Promise<ApplyOutcome> {
  const resolvedFilename = path.resolve(projectRoot, filename);
  const bundle = parseBundle(JSON.parse(await readFile(resolvedFilename, "utf8")));
  if (batchContext) {
    if (!batchContext.allowedFiles.has(resolvedFilename) || bundle.preparedAt !== batchContext.manifest.preparedAt) {
      throw new Error(`${filename} does not belong to ${path.relative(projectRoot, batchContext.manifestPath)}.`);
    }
  }
  const submitted = await pendingSubmission(bundle);
  if (!submitted && await duplicate(bundle)) {
    console.log(`${bundle.candidate.canonicalDomain}: already known, no-op`);
    return "duplicate";
  }
  if (batchContext && publishLimit !== null && await publishedCountForBatch(batchContext) >= publishLimit) {
    console.log(`${bundle.candidate.canonicalDomain}: batch publish limit of ${publishLimit} reached, no-op`);
    return "batch_limit_reached";
  }
  if (dailyPublishLimit !== null && await publishedCountForMelbourneDay() >= dailyPublishLimit) {
    console.log(`${bundle.candidate.canonicalDomain}: Melbourne daily publish limit of ${dailyPublishLimit} reached, no-op`);
    return "daily_limit_reached";
  }

  const catalog = await taxonomy();
  const decision = decideCatalogAnalysis(
    bundle.candidate,
    bundle.analysis!,
    catalog.publicTaxonomy,
    await domainCategories(bundle.candidate.canonicalDomain),
  );
  if (decision.outcome === "auto_publish") {
    const research = checkResearchedProfile(bundle.analysis!.profile, bundle.candidate);
    if (!research.profile) {
      // Incomplete research stays local and retryable, rather than permanently losing the candidate.
      throw new Error(research.reasons.join(" "));
    }
    bundle.analysis!.profile = research.profile;
  }
  if (submitted && decision.outcome !== "auto_publish") {
    // Never skip a visitor's submission permanently; it waits for a better bundle.
    throw new Error(`Submitted tool needs a publishable analysis: ${decision.reasons.join(" ")}`);
  }
  if (decision.outcome === "skip") {
    await recordWithoutTool(bundle, "skipped", decision.reasons, null);
    console.log(`${bundle.candidate.canonicalDomain}: skipped permanently (${decision.reasons.length} deterministic reason${decision.reasons.length === 1 ? "" : "s"})`);
    return "skipped";
  }

  const screenshotDirectory = process.argv.find(arg => arg.startsWith("--screenshot-dir="))?.slice("--screenshot-dir=".length)
    ?? path.join(path.dirname(resolvedFilename), "screenshots");
  // Fail before any production write if the browser screenshot is not ready.
  const screenshotFile = submitted?.screenshot_asset_key
    ? undefined
    : await reviewedImportScreenshot(screenshotDirectory, bundle.candidate.canonicalDomain, bundle.websiteUrl);

  const categoryBySlug = new Map(catalog.categories.map((category) => [category.slug, category]));
  const tagBySlug = new Map(catalog.tags.map((tag) => [tag.slug, tag]));
  const fallbackCategory = catalog.categories.find((category) => category.slug !== "other") ?? catalog.categories[0];
  const primaryCategory = categoryBySlug.get(bundle.analysis!.primaryCategorySlug) ?? fallbackCategory;
  if (!primaryCategory) {
    await recordWithoutTool(bundle, "failed", decision.reasons, "No active category is available.");
    throw new Error("No active category is available.");
  }
  const selectedCategories = [...new Set([primaryCategory.slug, ...bundle.analysis!.categorySlugs])]
    .map((slug) => categoryBySlug.get(slug))
    .filter((category): category is CategoryRow => Boolean(category))
    .slice(0, 4);
  const selectedTags = bundle.analysis!.tagSlugs
    .map((slug) => tagBySlug.get(slug))
    .filter((tag): tag is TagRow => Boolean(tag))
    .slice(0, 8);
  const name = cleanText(bundle.analysis!.name || bundle.candidate.identity.name?.value || bundle.candidate.canonicalDomain, 80);
  const tagline = cleanText(bundle.analysis!.tagline || bundle.candidate.identity.tagline?.value || "Review the official website before publishing this catalogue entry.", 180);
  const description = cleanText(bundle.analysis!.description || bundle.candidate.evidencePages[0]?.excerpt || tagline, 1_200);
  const reasons = [...decision.reasons];
  if (submitted) {
    return completeSubmission(bundle, submitted, { name, tagline, description, primaryCategory, selectedCategories, selectedTags, reasons, screenshotFile });
  }
  const toolId = `tool_${crypto.randomUUID()}`;
  const importId = `import_${crypto.randomUUID()}`;
  const slug = await uniqueSlug(name, bundle.candidate.canonicalDomain);
  const now = Math.floor(Date.now() / 1000);
  const statements = [
    `INSERT INTO tools (id, slug, name, tagline, description, website_url, canonical_domain, canonical_key, pricing_model, status, primary_category_id, logo_asset_key, screenshot_asset_key, is_editor_pick, source_first_seen_at, published_at, last_checked_at, created_at, updated_at) VALUES (${sqlText(toolId)}, ${sqlText(slug)}, ${sqlText(name)}, ${sqlText(tagline)}, ${sqlText(description)}, ${sqlText(bundle.websiteUrl)}, ${sqlText(bundle.candidate.canonicalDomain)}, ${sqlText(identityKey(bundle))}, ${sqlText(bundle.analysis!.pricingModel)}, 'pending_review', ${sqlText(primaryCategory.id)}, NULL, NULL, 0, ${now}, NULL, ${now}, ${now}, ${now})`,
    ...selectedCategories.map((category) => `INSERT INTO tool_categories (tool_id, category_id, is_primary) VALUES (${sqlText(toolId)}, ${sqlText(category.id)}, ${category.id === primaryCategory.id ? 1 : 0})`),
    ...selectedTags.map((tag) => `INSERT INTO tool_tags (tool_id, tag_id) VALUES (${sqlText(toolId)}, ${sqlText(tag.id)})`),
    `INSERT INTO tool_sources (id, tool_id, provider, external_id, source_url, raw_json, first_seen_at, last_seen_at) VALUES (${sqlText(`source_${crypto.randomUUID()}`)}, ${sqlText(toolId)}, ${sqlText(bundle.provider as ImportProvider)}, ${sqlText(bundle.externalId)}, ${sqlText(bundle.discoveryUrl)}, ${sqlText(JSON.stringify({ ...bundle, candidate: storedCandidate(bundle.candidate, bundle.analysis) }))}, ${now}, ${now})`,
    `INSERT INTO import_candidates (id, provider, external_id, discovery_url, website_url, canonical_domain, canonical_key, status, candidate_json, analysis_json, decision_reasons_json, tool_id, error_summary, discovered_at, analyzed_at, created_at, updated_at) VALUES (${sqlText(importId)}, ${sqlText(bundle.provider)}, ${sqlText(bundle.externalId)}, ${sqlText(bundle.discoveryUrl)}, ${sqlText(bundle.websiteUrl)}, ${sqlText(bundle.candidate.canonicalDomain)}, ${sqlText(identityKey(bundle))}, 'pending_review', ${sqlText(JSON.stringify(storedCandidate(bundle.candidate, bundle.analysis)))}, ${sqlText(JSON.stringify(bundle.analysis))}, ${sqlText(JSON.stringify(reasons))}, ${sqlText(toolId)}, NULL, ${now}, ${now}, ${now}, ${now})`,
    `INSERT INTO moderation_events (id, entity_type, entity_id, action, actor_identity, metadata_json, created_at) VALUES (${sqlText(`event_${crypto.randomUUID()}`)}, 'import_candidate', ${sqlText(importId)}, 'analyze', 'codex-schedule', ${sqlText(JSON.stringify({ provider: bundle.provider, decision: decision.outcome, reasons }))}, ${now})`,
  ];
  await d1File(projectRoot, mode, statements.map((statement) => assertStatementFits(statement, `${bundle.candidate.canonicalDomain} import statement`)));

  let screenshotAssetKey: string | null = null;
  try {
    let screenshotError: string | null = null;
    try {
      await runAssetScript("catalog:screenshots", toolId, screenshotFile);
    } catch (error) {
      screenshotError = error instanceof Error ? error.message : "Screenshot capture failed.";
    }

    const asset = (await d1Query<{ screenshot_asset_key: string | null }>(projectRoot, mode, `SELECT screenshot_asset_key FROM tools WHERE id = ${sqlText(toolId)} LIMIT 1`))[0];
    if (!asset?.screenshot_asset_key) {
      const errorSummary = screenshotError ?? "Screenshot capture did not store an asset.";
      reasons.push("Automatic screenshot capture failed; the candidate was skipped permanently.");
      await skipPreparedTool(bundle, importId, toolId, reasons, errorSummary);
      console.log(`${bundle.candidate.canonicalDomain}: skipped permanently (screenshot unavailable)`);
      return "skipped";
    }
    screenshotAssetKey = asset.screenshot_asset_key;
  } catch (error) {
    const errorSummary = error instanceof Error ? error.message : "Automatic screenshot finalization failed.";
    reasons.push("Automatic screenshot finalization failed; the candidate was skipped permanently.");
    await skipPreparedTool(bundle, importId, toolId, reasons, errorSummary);
    console.log(`${bundle.candidate.canonicalDomain}: skipped permanently (screenshot finalization failed)`);
    return "skipped";
  }

  try {
    await runAssetScript("catalog:logos", toolId);
  } catch (error) {
    console.warn(`${bundle.candidate.canonicalDomain}: logo unavailable; text fallback will be used (${error instanceof Error ? error.message : "unknown error"})`);
  }

  const categoryNames = selectedCategories.map((category) => category.name).join(" ");
  const tagNames = selectedTags.map((tag) => tag.name).join(" ");
  const publishedAt = Math.floor(Date.now() / 1000);
  await d1File(projectRoot, mode, [
    `UPDATE tools SET status = 'published', published_at = ${publishedAt}, last_checked_at = ${publishedAt}, updated_at = ${publishedAt} WHERE id = ${sqlText(toolId)} AND status = 'pending_review'`,
    `INSERT INTO tools_fts (tool_id, name, tagline, description, category_names, tag_names) VALUES (${sqlText(toolId)}, ${sqlText(name)}, ${sqlText(tagline)}, ${sqlText(description)}, ${sqlText(categoryNames)}, ${sqlText(tagNames)})`,
    `UPDATE import_candidates SET status = 'published', updated_at = ${publishedAt} WHERE id = ${sqlText(importId)}`,
    `INSERT INTO moderation_events (id, entity_type, entity_id, action, actor_identity, metadata_json, created_at) VALUES (${sqlText(`event_${crypto.randomUUID()}`)}, 'import_candidate', ${sqlText(importId)}, 'auto_publish', 'codex-schedule', ${sqlText(JSON.stringify({ toolId, screenshotAssetKey, reasons: [] }))}, ${publishedAt})`,
  ]);
  console.log(`${bundle.candidate.canonicalDomain}: published automatically at /tools/${slug}`);
  return "published";
}

type Completion = {
  name: string;
  tagline: string;
  description: string;
  primaryCategory: CategoryRow;
  selectedCategories: CategoryRow[];
  selectedTags: TagRow[];
  reasons: string[];
  screenshotFile: string | undefined;
};

// Assets are filled first and the listing is rewritten in one write, so a failure leaves the submission hidden and retryable.
async function completeSubmission(bundle: CatalogImportBundle, tool: SubmittedTool, values: Completion): Promise<ApplyOutcome> {
  const { name, tagline, description, primaryCategory, selectedCategories, selectedTags, reasons, screenshotFile } = values;
  const domain = bundle.candidate.canonicalDomain;
  if (screenshotFile) await runAssetScript("catalog:screenshots", tool.id, screenshotFile);
  const asset = (await d1Query<{ screenshot_asset_key: string | null }>(projectRoot, mode, `SELECT screenshot_asset_key FROM tools WHERE id = ${sqlText(tool.id)} LIMIT 1`))[0];
  if (!asset?.screenshot_asset_key) throw new Error(`${domain}: screenshot capture did not store an asset; the submission stays in review.`);
  try {
    await runAssetScript("catalog:logos", tool.id);
  } catch (error) {
    console.warn(`${domain}: logo unavailable; text fallback will be used (${error instanceof Error ? error.message : "unknown error"})`);
  }

  const importId = `import_${crypto.randomUUID()}`;
  const toolId = sqlText(tool.id);
  const publishedAt = Math.floor(Date.now() / 1000);
  const categoryNames = selectedCategories.map((category) => category.name).join(" ");
  const tagNames = selectedTags.map((tag) => tag.name).join(" ");
  const stored = storedCandidate(bundle.candidate, bundle.analysis);
  const statements = [
    `DELETE FROM tool_categories WHERE tool_id = ${toolId}`,
    `DELETE FROM tool_tags WHERE tool_id = ${toolId}`,
    ...selectedCategories.map((category) => `INSERT INTO tool_categories (tool_id, category_id, is_primary) VALUES (${toolId}, ${sqlText(category.id)}, ${category.id === primaryCategory.id ? 1 : 0})`),
    ...selectedTags.map((tag) => `INSERT INTO tool_tags (tool_id, tag_id) VALUES (${toolId}, ${sqlText(tag.id)})`),
    `INSERT INTO tool_sources (id, tool_id, provider, external_id, source_url, raw_json, first_seen_at, last_seen_at) VALUES (${sqlText(`source_${crypto.randomUUID()}`)}, ${toolId}, ${sqlText(bundle.provider as ImportProvider)}, ${sqlText(bundle.externalId)}, ${sqlText(bundle.discoveryUrl)}, ${sqlText(JSON.stringify({ ...bundle, candidate: stored }))}, ${publishedAt}, ${publishedAt})`,
    `INSERT INTO import_candidates (id, provider, external_id, discovery_url, website_url, canonical_domain, canonical_key, status, candidate_json, analysis_json, decision_reasons_json, tool_id, error_summary, discovered_at, analyzed_at, created_at, updated_at) VALUES (${sqlText(importId)}, ${sqlText(bundle.provider)}, ${sqlText(bundle.externalId)}, ${sqlText(bundle.discoveryUrl)}, ${sqlText(bundle.websiteUrl)}, ${sqlText(domain)}, ${sqlText(identityKey(bundle))}, 'published', ${sqlText(JSON.stringify(stored))}, ${sqlText(JSON.stringify(bundle.analysis))}, ${sqlText(JSON.stringify(reasons))}, ${toolId}, NULL, ${publishedAt}, ${publishedAt}, ${publishedAt}, ${publishedAt})`,
    `UPDATE tools SET name = ${sqlText(name)}, tagline = ${sqlText(tagline)}, description = ${sqlText(description)}, pricing_model = ${sqlText(bundle.analysis!.pricingModel)}, primary_category_id = ${sqlText(primaryCategory.id)}, status = 'published', published_at = ${publishedAt}, last_checked_at = ${publishedAt}, updated_at = ${publishedAt} WHERE id = ${toolId} AND status = 'pending_review'`,
    `DELETE FROM tools_fts WHERE tool_id = ${toolId}`,
    `INSERT INTO tools_fts (tool_id, name, tagline, description, category_names, tag_names) VALUES (${toolId}, ${sqlText(name)}, ${sqlText(tagline)}, ${sqlText(description)}, ${sqlText(categoryNames)}, ${sqlText(tagNames)})`,
    `UPDATE submissions SET status = 'accepted', moderation_note = 'Published with a researched profile', updated_at = ${publishedAt} WHERE canonical_domain = ${sqlText(domain)} AND status = 'pending'`,
    `INSERT INTO moderation_events (id, entity_type, entity_id, action, actor_identity, metadata_json, created_at) VALUES (${sqlText(`event_${crypto.randomUUID()}`)}, 'import_candidate', ${sqlText(importId)}, 'auto_publish', 'codex-schedule', ${sqlText(JSON.stringify({ toolId: tool.id, submission: true, screenshotAssetKey: asset.screenshot_asset_key }))}, ${publishedAt})`,
  ];
  await d1File(projectRoot, mode, statements.map((statement) => assertStatementFits(statement, `${domain} submission statement`)));
  console.log(`${domain}: researched submission published at /tools/${tool.slug}`);
  return "published";
}

if (!files.length) {
  console.error("Usage: pnpm imports:apply -- --remote [--manifest=manifest.json --publish-limit=20 --daily-publish-limit=20] path/to/import.json [more.json ...]");
  process.exitCode = 1;
} else {
  const failures: string[] = [];
  const outcomes: ApplyOutcome[] = [];
  const batchContext = await loadBatchContext();
  await skipOrphanedAutomaticImports();
  for (const filename of files) {
    try {
      const outcome = await applyBundle(filename, batchContext);
      outcomes.push(outcome);
      if (outcome === "batch_limit_reached" || outcome === "daily_limit_reached") break;
    } catch (error) {
      failures.push(filename);
      console.error(`${filename}: ${error instanceof Error ? error.message : "import failed"}`);
    }
  }
  const counts = new Map<ApplyOutcome, number>();
  for (const outcome of outcomes) counts.set(outcome, (counts.get(outcome) ?? 0) + 1);
  console.log(`Apply summary: published=${counts.get("published") ?? 0}, skipped=${counts.get("skipped") ?? 0}, duplicates=${counts.get("duplicate") ?? 0}, limit_reached=${(counts.get("batch_limit_reached") ?? 0) + (counts.get("daily_limit_reached") ?? 0)}, failed=${failures.length}`);
  if (failures.length) {
    console.error(`${failures.length}/${files.length} import bundles failed.`);
    process.exitCode = 1;
  }
}
