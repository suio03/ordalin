import { pricingModels, type PricingModel } from "@/domain/catalog";
import type { CatalogAnalysis } from "@/lib/catalog-analysis";
import type { CatalogEnrichmentCandidate } from "@/lib/catalog-enrichment/contract";

type ImportRow = {
  id: string;
  provider: "product_hunt" | "toolify" | "manual";
  external_id: string;
  discovery_url: string;
  website_url: string;
  canonical_domain: string;
  status: "discovered" | "analyzed" | "pending_review" | "published" | "skipped" | "rejected" | "failed";
  candidate_json: string;
  analysis_json: string | null;
  decision_reasons_json: string;
  error_summary: string | null;
  discovered_at: number;
  analyzed_at: number | null;
  tool_id: string | null;
  tool_slug: string | null;
  tool_name: string | null;
  tagline: string | null;
  description: string | null;
  pricing_model: PricingModel | null;
  primary_category_slug: string | null;
  logo_asset_key: string | null;
  screenshot_asset_key: string | null;
};

export type AdminImportCandidate = Omit<ImportRow, "candidate_json" | "analysis_json" | "decision_reasons_json"> & {
  candidate: CatalogEnrichmentCandidate;
  analysis: CatalogAnalysis | null;
  decisionReasons: string[];
  categorySlugs: string[];
  tagSlugs: string[];
};

export async function listAdminImports(database: D1Database, limit = 100) {
  const result = await database.prepare(`
    SELECT i.*, t.slug AS tool_slug, t.name AS tool_name, t.tagline, t.description,
      t.pricing_model, c.slug AS primary_category_slug, t.logo_asset_key, t.screenshot_asset_key
    FROM import_candidates i
    LEFT JOIN tools t ON t.id = i.tool_id
    LEFT JOIN categories c ON c.id = t.primary_category_id
    ORDER BY CASE i.status
      WHEN 'pending_review' THEN 0 WHEN 'failed' THEN 1 WHEN 'published' THEN 2
      WHEN 'skipped' THEN 3 ELSE 4 END, i.updated_at DESC
    LIMIT ?
  `).bind(Math.min(200, Math.max(1, limit))).all<ImportRow>();

  return Promise.all(result.results.map(async (row): Promise<AdminImportCandidate> => {
    const [categories, tags] = row.tool_id
      ? await Promise.all([
          database.prepare("SELECT c.slug FROM tool_categories tc JOIN categories c ON c.id = tc.category_id WHERE tc.tool_id = ? ORDER BY tc.is_primary DESC, c.sort_order").bind(row.tool_id).all<{ slug: string }>(),
          database.prepare("SELECT t.slug FROM tool_tags tt JOIN tags t ON t.id = tt.tag_id WHERE tt.tool_id = ? ORDER BY t.kind, t.name").bind(row.tool_id).all<{ slug: string }>(),
        ])
      : [{ results: [] }, { results: [] }];
    return {
      ...row,
      candidate: JSON.parse(row.candidate_json) as CatalogEnrichmentCandidate,
      analysis: row.analysis_json ? JSON.parse(row.analysis_json) as CatalogAnalysis : null,
      decisionReasons: JSON.parse(row.decision_reasons_json) as string[],
      categorySlugs: categories.results.map((item) => item.slug),
      tagSlugs: tags.results.map((item) => item.slug),
    };
  }));
}

type ReviewFields = {
  name: string;
  tagline: string;
  description: string;
  pricingModel: PricingModel;
  primaryCategorySlug: string;
  categorySlugs: string[];
  tagSlugs: string[];
};

function clean(value: unknown, min: number, max: number, label: string) {
  const text = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  if (text.length < min || text.length > max) throw new Error(`${label} is invalid`);
  return text;
}

export function parseImportReviewFields(value: unknown): ReviewFields {
  if (!value || typeof value !== "object") throw new Error("Review fields are missing");
  const record = value as Record<string, unknown>;
  const pricingModel = pricingModels.includes(record.pricingModel as PricingModel)
    ? record.pricingModel as PricingModel
    : null;
  const list = (input: unknown, max: number) => Array.isArray(input)
    ? [...new Set(input.filter((item): item is string => typeof item === "string" && /^[a-z0-9-]+$/.test(item)))].slice(0, max)
    : [];
  const categorySlugs = list(record.categorySlugs, 4);
  const tagSlugs = list(record.tagSlugs, 8);
  const primaryCategorySlug = clean(record.primaryCategorySlug, 2, 64, "Primary category");
  if (!pricingModel) throw new Error("Pricing is invalid");
  if (!categorySlugs.includes(primaryCategorySlug)) throw new Error("Primary category must be selected");
  return {
    name: clean(record.name, 2, 80, "Name"),
    tagline: clean(record.tagline, 20, 180, "Short description"),
    description: clean(record.description, 60, 1_200, "Description"),
    pricingModel,
    primaryCategorySlug,
    categorySlugs,
    tagSlugs,
  };
}

export async function publishImportCandidate(
  database: D1Database,
  importId: string,
  fields: ReviewFields,
  actor: string,
) {
  const row = await database.prepare("SELECT tool_id FROM import_candidates WHERE id = ? AND status = 'pending_review'").bind(importId).first<{ tool_id: string | null }>();
  if (!row?.tool_id) throw new Error("Pending import was not found");
  const [categories, tags] = await Promise.all([
    database.prepare(`SELECT id, slug, name FROM categories WHERE is_active = 1 AND slug IN (${fields.categorySlugs.map(() => "?").join(", ")})`).bind(...fields.categorySlugs).all<{ id: string; slug: string; name: string }>(),
    fields.tagSlugs.length
      ? database.prepare(`SELECT id, slug, name, kind, category_group_id FROM tags WHERE is_active = 1 AND slug IN (${fields.tagSlugs.map(() => "?").join(", ")})`).bind(...fields.tagSlugs).all<{ id: string; slug: string; name: string; kind: string; category_group_id: string | null }>()
      : Promise.resolve({ results: [] }),
  ]);
  if (categories.results.length !== fields.categorySlugs.length) throw new Error("One or more categories are unavailable");
  if (tags.results.length !== fields.tagSlugs.length) throw new Error("One or more tags are unavailable");
  const primary = categories.results.find((category) => category.slug === fields.primaryCategorySlug);
  if (!primary) throw new Error("Primary category is unavailable");
  const concrete = tags.results.filter((tag) => tag.kind === "category");
  if (!concrete.some((tag) => tag.category_group_id === primary.id)) throw new Error("Choose a concrete category from the primary group");

  const now = Math.floor(Date.now() / 1000);
  const categoryNames = categories.results.map((category) => category.name).join(" ");
  const tagNames = tags.results.map((tag) => tag.name).join(" ");
  await database.batch([
    database.prepare("UPDATE tools SET name = ?, tagline = ?, description = ?, pricing_model = ?, primary_category_id = ?, status = 'published', published_at = COALESCE(published_at, ?), last_checked_at = ?, updated_at = ? WHERE id = ?").bind(fields.name, fields.tagline, fields.description, fields.pricingModel, primary.id, now, now, now, row.tool_id),
    database.prepare("DELETE FROM tool_categories WHERE tool_id = ?").bind(row.tool_id),
    ...categories.results.map((category) => database.prepare("INSERT INTO tool_categories (tool_id, category_id, is_primary) VALUES (?, ?, ?)").bind(row.tool_id, category.id, category.id === primary.id ? 1 : 0)),
    database.prepare("DELETE FROM tool_tags WHERE tool_id = ?").bind(row.tool_id),
    ...tags.results.map((tag) => database.prepare("INSERT INTO tool_tags (tool_id, tag_id) VALUES (?, ?)").bind(row.tool_id, tag.id)),
    database.prepare("DELETE FROM tools_fts WHERE tool_id = ?").bind(row.tool_id),
    database.prepare("INSERT INTO tools_fts (tool_id, name, tagline, description, category_names, tag_names) VALUES (?, ?, ?, ?, ?, ?)").bind(row.tool_id, fields.name, fields.tagline, fields.description, categoryNames, tagNames),
    database.prepare("UPDATE import_candidates SET status = 'published', updated_at = ? WHERE id = ?").bind(now, importId),
    database.prepare("INSERT INTO moderation_events (id, entity_type, entity_id, action, actor_identity, metadata_json, created_at) VALUES (?, 'import_candidate', ?, 'publish', ?, ?, ?)").bind(`event_${crypto.randomUUID()}`, importId, actor, JSON.stringify({ toolId: row.tool_id, mode: "manual-review" }), now),
  ]);
  return row.tool_id;
}

export async function rejectImportCandidate(database: D1Database, importId: string, actor: string) {
  const row = await database.prepare("SELECT tool_id FROM import_candidates WHERE id = ? AND status = 'pending_review'").bind(importId).first<{ tool_id: string | null }>();
  if (!row) throw new Error("Pending import was not found");
  const now = Math.floor(Date.now() / 1000);
  const statements = [
    database.prepare("UPDATE import_candidates SET status = 'rejected', updated_at = ? WHERE id = ?").bind(now, importId),
    database.prepare("INSERT INTO moderation_events (id, entity_type, entity_id, action, actor_identity, metadata_json, created_at) VALUES (?, 'import_candidate', ?, 'reject', ?, '{}', ?)").bind(`event_${crypto.randomUUID()}`, importId, actor, now),
  ];
  if (row.tool_id) statements.push(database.prepare("UPDATE tools SET status = 'rejected', updated_at = ? WHERE id = ?").bind(now, row.tool_id));
  await database.batch(statements);
}
