import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sourcePath = path.join(projectRoot, "data/catalog.seed.json");
const outputPath = path.join(projectRoot, "seed/catalog.sql");
const seed = JSON.parse(await readFile(sourcePath, "utf8"));

function quote(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function unix(value) {
  return Math.floor(new Date(value).getTime() / 1000);
}

function id(prefix, slug) {
  return `${prefix}_${slug.replaceAll("-", "_")}`;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(seed.tools.length === 16, "The Phase B.5 validation seed must contain exactly 16 tools.");
assert(seed.tasks.length === 5, "The Phase B.5 seed must contain exactly 5 tasks.");
assert(new Set(seed.tools.map((tool) => tool.slug)).size === seed.tools.length, "Tool slugs must be unique.");
assert(new Set(seed.tools.map((tool) => tool.canonicalDomain)).size === seed.tools.length, "Canonical domains must be unique.");
assert(new Set(seed.tasks.map((task) => task.slug)).size === seed.tasks.length, "Task slugs must be unique.");

const categorySlugs = new Set(seed.categories.map((category) => category.slug));
const tagSlugs = new Set(seed.tags.map((tag) => tag.slug));
const tagBySlug = new Map(seed.tags.map((tag) => [tag.slug, tag]));
const toolSlugs = new Set(seed.tools.map((tool) => tool.slug));
for (const tool of seed.tools) {
  assert(categorySlugs.has(tool.primaryCategory), `Unknown primary category for ${tool.slug}.`);
  assert(tool.categories.includes(tool.primaryCategory), `Primary category missing from categories for ${tool.slug}.`);
  assert(tool.categories.every((slug) => categorySlugs.has(slug)), `Unknown category for ${tool.slug}.`);
  assert(tool.tags.every((slug) => tagSlugs.has(slug)), `Unknown tag for ${tool.slug}.`);
  const browseCategories = tool.tags.map((slug) => tagBySlug.get(slug)).filter((tag) => tag?.kind === "category");
  assert(browseCategories.length > 0, `At least one browse category is required for ${tool.slug}.`);
  assert(browseCategories.some((tag) => tag.group === tool.primaryCategory), `Primary category group needs a matching browse category for ${tool.slug}.`);
  assert(tool.websiteUrl.startsWith("https://"), `Website URL must use HTTPS for ${tool.slug}.`);
  assert(tool.sourceUrl.startsWith("https://"), `Source URL must use HTTPS for ${tool.slug}.`);
}
for (const tag of seed.tags) {
  if (tag.kind === "category") {
    assert(tag.group && categorySlugs.has(tag.group), `Unknown category group for ${tag.slug}.`);
  }
}

const lines = [
  "PRAGMA foreign_keys = ON;",
];

seed.categories.forEach((category, index) => {
  const isActive = category.isActive === false ? 0 : 1;
  lines.push(`INSERT INTO categories (id, slug, name, description, sort_order, is_active) VALUES (${quote(id("cat", category.slug))}, ${quote(category.slug)}, ${quote(category.name)}, ${quote(category.description)}, ${index + 1}, ${isActive}) ON CONFLICT(slug) DO UPDATE SET name = excluded.name, description = excluded.description, sort_order = excluded.sort_order, is_active = excluded.is_active;`);
});

seed.tags.forEach((tag) => {
  const groupId = tag.group ? id("cat", tag.group) : null;
  lines.push(`INSERT INTO tags (id, slug, name, kind, category_group_id, description, is_active) VALUES (${quote(id("tag", tag.slug))}, ${quote(tag.slug)}, ${quote(tag.name)}, ${quote(tag.kind)}, ${quote(groupId)}, ${quote(tag.description ?? "")}, 1) ON CONFLICT(slug) DO UPDATE SET name = excluded.name, kind = excluded.kind, category_group_id = excluded.category_group_id, description = excluded.description, is_active = 1;`);
});

for (const tool of seed.tools) {
  const toolId = id("tool", tool.slug);
  const checkedAt = unix(seed.checkedAt);
  lines.push(`INSERT INTO tools (id, slug, name, tagline, description, website_url, canonical_domain, canonical_key, pricing_model, status, primary_category_id, logo_asset_key, screenshot_asset_key, is_editor_pick, source_first_seen_at, published_at, last_checked_at, created_at, updated_at) VALUES (${quote(toolId)}, ${quote(tool.slug)}, ${quote(tool.name)}, ${quote(tool.tagline)}, ${quote(tool.description)}, ${quote(tool.websiteUrl)}, ${quote(tool.canonicalDomain)}, ${quote(tool.canonicalDomain)}, ${quote(tool.pricingModel)}, 'published', ${quote(id("cat", tool.primaryCategory))}, NULL, NULL, ${tool.editorPick ? 1 : 0}, ${unix(tool.firstSeenAt)}, unixepoch(), ${checkedAt}, unixepoch(), unixepoch()) ON CONFLICT(slug) DO UPDATE SET name = excluded.name, tagline = excluded.tagline, description = excluded.description, website_url = excluded.website_url, canonical_domain = excluded.canonical_domain, canonical_key = excluded.canonical_key, pricing_model = excluded.pricing_model, status = 'published', primary_category_id = excluded.primary_category_id, is_editor_pick = excluded.is_editor_pick, last_checked_at = excluded.last_checked_at, updated_at = unixepoch();`);
  lines.push(`DELETE FROM tool_categories WHERE tool_id = ${quote(toolId)};`);
  tool.categories.forEach((category) => {
    lines.push(`INSERT INTO tool_categories (tool_id, category_id, is_primary) VALUES (${quote(toolId)}, ${quote(id("cat", category))}, ${category === tool.primaryCategory ? 1 : 0});`);
  });
  lines.push(`DELETE FROM tool_tags WHERE tool_id = ${quote(toolId)};`);
  tool.tags.forEach((tag) => {
    lines.push(`INSERT INTO tool_tags (tool_id, tag_id) VALUES (${quote(toolId)}, ${quote(id("tag", tag))});`);
  });
  const rawJson = JSON.stringify({
    discoveredVia: tool.discoveredVia,
    discoveryUrl: tool.discoveryUrl,
    verifiedSourceUrl: tool.sourceUrl,
    checkedAt: seed.checkedAt,
  });
  lines.push(`INSERT INTO tool_sources (id, tool_id, provider, external_id, source_url, raw_json, first_seen_at, last_seen_at) VALUES (${quote(id("source", tool.slug))}, ${quote(toolId)}, 'manual', ${quote(`phase-b:${tool.slug}`)}, ${quote(tool.sourceUrl)}, ${quote(rawJson)}, ${unix(tool.firstSeenAt)}, ${checkedAt}) ON CONFLICT(provider, external_id) DO UPDATE SET source_url = excluded.source_url, raw_json = excluded.raw_json, last_seen_at = excluded.last_seen_at;`);
}

seed.tasks.forEach((task, taskIndex) => {
  assert(task.tools.length >= 3 && task.tools.length <= 5, `${task.slug} must contain 3 to 5 tools.`);
  assert(new Set(task.tools.map((item) => item.slug)).size === task.tools.length, `Duplicate task tool in ${task.slug}.`);
  assert(task.tools.every((item) => toolSlugs.has(item.slug)), `Unknown task tool in ${task.slug}.`);
  const taskId = id("task", task.slug);
  lines.push(`INSERT INTO tasks (id, slug, name, outcome, guidance, sort_order, is_published, published_at, created_at, updated_at) VALUES (${quote(taskId)}, ${quote(task.slug)}, ${quote(task.name)}, ${quote(task.outcome)}, ${quote(task.guidance)}, ${taskIndex + 1}, 1, unixepoch(), unixepoch(), unixepoch()) ON CONFLICT(slug) DO UPDATE SET name = excluded.name, outcome = excluded.outcome, guidance = excluded.guidance, sort_order = excluded.sort_order, is_published = 1, updated_at = unixepoch();`);
  lines.push(`DELETE FROM task_items WHERE task_id = ${quote(taskId)};`);
  task.tools.forEach((item, index) => {
    lines.push(`INSERT INTO task_items (task_id, tool_id, sort_order, best_for, key_difference, limitation) VALUES (${quote(taskId)}, ${quote(id("tool", item.slug))}, ${index + 1}, ${quote(item.bestFor)}, ${quote(item.keyDifference)}, ${quote(item.limitation)});`);
  });
});

for (const collection of seed.collections) {
  assert(collection.tools.every((slug) => toolSlugs.has(slug)), `Unknown collection tool in ${collection.slug}.`);
  const collectionId = id("collection", collection.slug);
  lines.push(`INSERT INTO collections (id, slug, name, description, is_published, published_at, created_at, updated_at) VALUES (${quote(collectionId)}, ${quote(collection.slug)}, ${quote(collection.name)}, ${quote(collection.description)}, 1, unixepoch(), unixepoch(), unixepoch()) ON CONFLICT(slug) DO UPDATE SET name = excluded.name, description = excluded.description, is_published = 1, updated_at = unixepoch();`);
  lines.push(`DELETE FROM collection_items WHERE collection_id = ${quote(collectionId)};`);
  collection.tools.forEach((toolSlug, index) => {
    lines.push(`INSERT INTO collection_items (collection_id, tool_id, sort_order, editorial_note) VALUES (${quote(collectionId)}, ${quote(id("tool", toolSlug))}, ${index + 1}, NULL);`);
  });
}

lines.push("DELETE FROM tools_fts;");
for (const tool of seed.tools) {
  const categoryNames = tool.categories
    .map((slug) => seed.categories.find((category) => category.slug === slug)?.name)
    .filter(Boolean)
    .join(" ");
  const tagNames = tool.tags
    .map((slug) => seed.tags.find((tag) => tag.slug === slug)?.name)
    .filter(Boolean)
    .join(" ");
  lines.push(`INSERT INTO tools_fts (tool_id, name, tagline, description, category_names, tag_names) VALUES (${quote(id("tool", tool.slug))}, ${quote(tool.name)}, ${quote(tool.tagline)}, ${quote(tool.description)}, ${quote(categoryNames)}, ${quote(tagNames)});`);
}
lines.push("");

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, lines.join("\n"), "utf8");
console.log(`Generated ${path.relative(projectRoot, outputPath)} with ${seed.tools.length} tools, ${seed.tasks.length} tasks, and ${seed.collections.length} collections.`);
