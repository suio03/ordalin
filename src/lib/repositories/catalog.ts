import { readResearchedProfile, type CheckedProfile } from "@/lib/catalog-profile/contract";
import { readConfirmedProfile, type ConfirmedProfile } from "@/lib/submissions/profile";
import { cache } from "react";
import { getCloudflareEnv } from "@/lib/cloudflare";
import { cataloguePageSize, toFtsQuery, type CatalogueSort } from "@/lib/catalog";
import type { TagKind } from "@/domain/catalog";

export type ToolCard = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  websiteUrl: string;
  sourceProvider: string | null;
  canonicalDomain: string;
  pricingModel: string;
  primaryCategory: { slug: string; name: string };
  categoryGroups: string[];
  logoAssetKey: string | null;
  publishedAt: number;
  lastCheckedAt: number | null;
  isEditorPick: boolean;
  tags: string[];
};

export type ToolDetail = ToolCard & {
  researchedProfile: CheckedProfile | null;
  submittedProfile: ConfirmedProfile | null;
  description: string;
  categories: Array<{ slug: string; name: string }>;
  tagDetails: TagSummary[];
  screenshotAssetKey: string | null;
  sourceUrl: string | null;
};

export type ToolTaskFit = TaskSummary & {
  bestFor: string;
  keyDifference: string;
  limitation: string;
};

export type CategorySummary = {
  slug: string;
  name: string;
  description: string;
  publishedToolCount: number;
};

export type BrowseCategorySummary = {
  slug: string;
  name: string;
  description: string;
  groupSlug: string;
  groupName: string;
  publishedToolCount: number;
};

export type CollectionSummary = {
  slug: string;
  name: string;
  description: string;
  publishedToolCount: number;
};

export type TaskSummary = {
  slug: string;
  name: string;
  outcome: string;
  guidance: string;
  publishedToolCount: number;
};

export type TaskOption = ToolCard & {
  bestFor: string;
  keyDifference: string;
  limitation: string;
};

export type TagSummary = {
  slug: string;
  name: string;
  kind: TagKind;
  description: string;
  groupSlug: string | null;
  groupName: string | null;
};

export type ToolListOptions = {
  page?: number;
  pageSize?: number;
  query?: string;
  categorySlug?: string;
  browseCategorySlug?: string;
  pricingModel?: string;
  tagSlug?: string;
  sort?: CatalogueSort;
  editorPicksOnly?: boolean;
};

export type PaginatedTools = {
  items: ToolCard[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type ToolRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  website_url: string;
  source_provider: string | null;
  canonical_domain: string;
  pricing_model: string;
  category_slug: string;
  category_name: string;
  logo_asset_key: string | null;
  published_at: number;
  last_checked_at: number | null;
  is_editor_pick: number;
  tag_names: string | null;
  category_group_slugs?: string | null;
};

type ToolDetailRow = ToolRow & {
  import_json: string | null;
  submission_json: string | null;
  description: string;
  category_pairs: string | null;
  tag_pairs: string | null;
  screenshot_asset_key: string | null;
  source_url: string | null;
};

type TaskOptionRow = ToolRow & {
  best_for: string;
  key_difference: string;
  limitation: string;
};

function splitValues(value?: string | null) {
  return value ? value.split(",").filter(Boolean) : [];
}

function mapTool(row: ToolRow): ToolCard {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    websiteUrl: row.website_url,
    sourceProvider: row.source_provider,
    canonicalDomain: row.canonical_domain,
    pricingModel: row.pricing_model,
    primaryCategory: {
      slug: row.category_slug,
      name: row.category_name,
    },
    categoryGroups: splitValues(row.category_group_slugs),
    logoAssetKey: row.logo_asset_key,
    publishedAt: row.published_at,
    lastCheckedAt: row.last_checked_at,
    isEditorPick: Boolean(row.is_editor_pick),
    tags: splitValues(row.tag_names),
  };
}

async function getDatabase() {
  return (await getCloudflareEnv()).DB;
}

export const listCategories = cache(async (): Promise<CategorySummary[]> => {
  const database = await getDatabase();
  const result = await database
    .prepare(
      `SELECT c.slug, c.name, c.description,
        COUNT(DISTINCT CASE WHEN tool.status = 'published' THEN tool.id END) AS published_tool_count
       FROM categories c
       JOIN tags browse_category
         ON browse_category.category_group_id = c.id
        AND browse_category.kind = 'category'
        AND browse_category.is_active = 1
       JOIN tool_tags tt ON tt.tag_id = browse_category.id
       JOIN tools tool ON tool.id = tt.tool_id
       WHERE c.is_active = 1 AND c.slug <> 'other'
       GROUP BY c.id
       HAVING COUNT(DISTINCT CASE WHEN tool.status = 'published' THEN tool.id END) > 0
       ORDER BY c.sort_order ASC`,
    )
    .all<{
      slug: string;
      name: string;
      description: string;
      published_tool_count: number;
    }>();

  return result.results.map((row) => ({
    slug: row.slug,
    name: row.name,
    description: row.description,
    publishedToolCount: Number(row.published_tool_count),
  }));
});

export const getCategoryBySlug = cache(
  async (slug: string): Promise<CategorySummary | null> => {
    const categories = await listCategories();
    return categories.find((category) => category.slug === slug) ?? null;
  },
);

export const listSubmissionCategoryGroups = cache(
  async (): Promise<CategorySummary[]> => {
    const database = await getDatabase();
    const result = await database
      .prepare(
        `SELECT c.slug, c.name, c.description, 0 AS published_tool_count
         FROM categories c
         WHERE c.is_active = 1 AND c.slug <> 'other'
         ORDER BY c.sort_order ASC`,
      )
      .all<{
        slug: string;
        name: string;
        description: string;
        published_tool_count: number;
      }>();
    return result.results.map((row) => ({
      slug: row.slug,
      name: row.name,
      description: row.description,
      publishedToolCount: 0,
    }));
  },
);

export const listBrowseCategories = cache(
  async (groupSlug?: string): Promise<BrowseCategorySummary[]> => {
    const database = await getDatabase();
    const groupCondition = groupSlug ? "AND category_group.slug = ?" : "";
    const statement = database.prepare(
      `SELECT tag.slug, tag.name, tag.description,
        category_group.slug AS group_slug, category_group.name AS group_name,
        COUNT(DISTINCT tool.id) AS published_tool_count
       FROM tags tag
       JOIN categories category_group
         ON category_group.id = tag.category_group_id
        AND category_group.is_active = 1
       JOIN tool_tags tt ON tt.tag_id = tag.id
       JOIN tools tool ON tool.id = tt.tool_id AND tool.status = 'published'
       WHERE tag.kind = 'category' AND tag.is_active = 1 ${groupCondition}
       GROUP BY tag.id
       HAVING COUNT(DISTINCT tool.id) > 0
       ORDER BY category_group.sort_order ASC, tag.name COLLATE NOCASE ASC`,
    );
    const result = groupSlug
      ? await statement.bind(groupSlug).all<{
          slug: string;
          name: string;
          description: string;
          group_slug: string;
          group_name: string;
          published_tool_count: number;
        }>()
      : await statement.all<{
          slug: string;
          name: string;
          description: string;
          group_slug: string;
          group_name: string;
          published_tool_count: number;
        }>();
    return result.results.map((row) => ({
      slug: row.slug,
      name: row.name,
      description: row.description,
      groupSlug: row.group_slug,
      groupName: row.group_name,
      publishedToolCount: Number(row.published_tool_count),
    }));
  },
);

export const getBrowseCategory = cache(
  async (groupSlug: string, slug: string): Promise<BrowseCategorySummary | null> => {
    const categories = await listBrowseCategories(groupSlug);
    return categories.find((category) => category.slug === slug) ?? null;
  },
);

export const listTags = cache(async (): Promise<TagSummary[]> => {
  const database = await getDatabase();
  const result = await database
    .prepare(
      `SELECT tag.slug, tag.name, tag.kind, tag.description,
        category_group.slug AS groupSlug, category_group.name AS groupName
       FROM tags tag
       LEFT JOIN categories category_group ON category_group.id = tag.category_group_id
       WHERE tag.is_active = 1
         AND tag.kind <> 'category'
         AND EXISTS (
           SELECT 1 FROM tool_tags tt
           JOIN tools tool ON tool.id = tt.tool_id
           WHERE tt.tag_id = tag.id AND tool.status = 'published'
         )
       ORDER BY CASE tag.kind WHEN 'interface' THEN 1 ELSE 2 END,
         tag.name COLLATE NOCASE ASC`,
    )
    .all<TagSummary>();
  return result.results;
});

export const listSubmissionTags = cache(async (): Promise<TagSummary[]> => {
  const database = await getDatabase();
  const result = await database
    .prepare(
      `SELECT tag.slug, tag.name, tag.kind, tag.description,
        category_group.slug AS groupSlug, category_group.name AS groupName
       FROM tags tag
       LEFT JOIN categories category_group ON category_group.id = tag.category_group_id
       WHERE tag.is_active = 1
       ORDER BY CASE tag.kind WHEN 'category' THEN 1 WHEN 'interface' THEN 2 ELSE 3 END,
         category_group.sort_order ASC, tag.name COLLATE NOCASE ASC`,
    )
    .all<TagSummary>();
  return result.results;
});

export async function listPublishedTools(
  options: ToolListOptions = {},
): Promise<PaginatedTools> {
  const database = await getDatabase();
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, options.pageSize ?? cataloguePageSize));
  const offset = (page - 1) * pageSize;
  const conditions = ["t.status = 'published'"];
  const bindings: Array<string | number> = [];
  const joins: string[] = [];

  const ftsQuery = options.query ? toFtsQuery(options.query) : "";
  if (ftsQuery) {
    joins.push("JOIN tools_fts ON tools_fts.tool_id = t.id");
    conditions.push("tools_fts MATCH ?");
    bindings.push(ftsQuery);
  }
  if (options.categorySlug) {
    conditions.push(
      "EXISTS (SELECT 1 FROM tool_tags gtt JOIN tags gtag ON gtag.id = gtt.tag_id JOIN categories gc ON gc.id = gtag.category_group_id WHERE gtt.tool_id = t.id AND gtag.kind = 'category' AND gc.slug = ?)",
    );
    bindings.push(options.categorySlug);
  }
  if (options.browseCategorySlug) {
    conditions.push(
      "EXISTS (SELECT 1 FROM tool_tags btt JOIN tags btag ON btag.id = btt.tag_id WHERE btt.tool_id = t.id AND btag.kind = 'category' AND btag.slug = ?)",
    );
    bindings.push(options.browseCategorySlug);
  }
  if (options.pricingModel) {
    conditions.push("t.pricing_model = ?");
    bindings.push(options.pricingModel);
  }
  if (options.tagSlug) {
    conditions.push(
      "EXISTS (SELECT 1 FROM tool_tags ftt JOIN tags ftag ON ftag.id = ftt.tag_id WHERE ftt.tool_id = t.id AND ftag.slug = ?)",
    );
    bindings.push(options.tagSlug);
  }
  if (options.editorPicksOnly) {
    conditions.push("t.is_editor_pick = 1");
  }
  const where = conditions.join(" AND ");
  const joinSql = joins.join(" ");
  const orderSql = options.sort === "oldest"
    ? "t.published_at ASC, t.name COLLATE NOCASE ASC"
    : "t.published_at DESC, t.name COLLATE NOCASE ASC";
  const countStatement = database.prepare(
    `SELECT COUNT(DISTINCT t.id) AS total
     FROM tools t ${joinSql}
     WHERE ${where}`,
  );
  const dataStatement = database.prepare(
    `SELECT t.id, t.slug, t.name, t.tagline, t.website_url, t.canonical_domain,
      t.pricing_model, t.logo_asset_key, t.published_at, t.last_checked_at,
      t.is_editor_pick, c.slug AS category_slug, c.name AS category_name,
      GROUP_CONCAT(DISTINCT tag.name) AS tag_names,
      CASE WHEN EXISTS (
        SELECT 1 FROM tool_sources source
        WHERE source.tool_id = t.id AND source.provider = 'submission'
      ) THEN 'submission' ELSE (
        SELECT provider FROM tool_sources source
        WHERE source.tool_id = t.id ORDER BY source.last_seen_at DESC LIMIT 1
      ) END AS source_provider,
      (SELECT GROUP_CONCAT(DISTINCT category_group.slug)
       FROM tool_tags category_tt
       JOIN tags category_tag ON category_tag.id = category_tt.tag_id
       JOIN categories category_group ON category_group.id = category_tag.category_group_id
       WHERE category_tt.tool_id = t.id AND category_tag.kind = 'category'
         AND category_tag.is_active = 1 AND category_group.is_active = 1) AS category_group_slugs
     FROM tools t
     JOIN categories c ON c.id = t.primary_category_id
     ${joinSql}
     LEFT JOIN tool_tags tt ON tt.tool_id = t.id
     LEFT JOIN tags tag ON tag.id = tt.tag_id AND tag.is_active = 1
     WHERE ${where}
     GROUP BY t.id
     ORDER BY ${orderSql}
     LIMIT ? OFFSET ?`,
  );

  const [countResult, dataResult] = await Promise.all([
    countStatement.bind(...bindings).first<{ total: number }>(),
    dataStatement.bind(...bindings, pageSize, offset).all<ToolRow>(),
  ]);
  const total = Number(countResult?.total ?? 0);

  return {
    items: dataResult.results.map(mapTool),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export const getToolBySlug = cache(
  async (slug: string): Promise<ToolDetail | null> => {
    const database = await getDatabase();
    const row = await database
      .prepare(
        `SELECT t.id, t.slug, t.name, t.tagline, t.description, t.website_url,
          t.canonical_domain, t.pricing_model, t.logo_asset_key, t.published_at,
          t.screenshot_asset_key, t.last_checked_at, t.is_editor_pick, c.slug AS category_slug,
          c.name AS category_name, GROUP_CONCAT(DISTINCT tag.name) AS tag_names,
          GROUP_CONCAT(DISTINCT tag.kind || ':' || tag.slug || ':' || tag.name || ':' || COALESCE(category_group.slug, '') || ':' || COALESCE(category_group.name, '')) AS tag_pairs,
          (SELECT GROUP_CONCAT(DISTINCT group_category.slug)
           FROM tool_tags group_tt
           JOIN tags group_tag ON group_tag.id = group_tt.tag_id
           JOIN categories group_category ON group_category.id = group_tag.category_group_id
           WHERE group_tt.tool_id = t.id AND group_tag.kind = 'category'
             AND group_tag.is_active = 1 AND group_category.is_active = 1) AS category_group_slugs,
          GROUP_CONCAT(DISTINCT ac.slug || ':' || ac.name) AS category_pairs,
          CASE WHEN EXISTS (
            SELECT 1 FROM tool_sources source
            WHERE source.tool_id = t.id AND source.provider = 'submission'
          ) THEN 'submission' ELSE (
            SELECT provider FROM tool_sources source
            WHERE source.tool_id = t.id ORDER BY source.last_seen_at DESC LIMIT 1
          ) END AS source_provider,
          (SELECT source_url FROM tool_sources source
           WHERE source.tool_id = t.id ORDER BY source.last_seen_at DESC LIMIT 1) AS source_url,
          (SELECT raw_json FROM tool_sources source WHERE source.tool_id = t.id AND source.provider = 'submission' ORDER BY source.last_seen_at DESC LIMIT 1) AS submission_json,
          (SELECT raw_json FROM tool_sources source WHERE source.tool_id = t.id AND source.provider IN ('toolify', 'product_hunt') ORDER BY source.last_seen_at DESC LIMIT 1) AS import_json
         FROM tools t
         JOIN categories c ON c.id = t.primary_category_id
         LEFT JOIN tool_tags tt ON tt.tool_id = t.id
         LEFT JOIN tags tag ON tag.id = tt.tag_id AND tag.is_active = 1
         LEFT JOIN categories category_group ON category_group.id = tag.category_group_id
         LEFT JOIN tool_categories tc ON tc.tool_id = t.id
         LEFT JOIN categories ac ON ac.id = tc.category_id
         WHERE t.status = 'published' AND t.slug = ?
         GROUP BY t.id
         LIMIT 1`,
      )
      .bind(slug)
      .first<ToolDetailRow>();

    if (!row) return null;
    return {
      ...mapTool(row),
      description: row.description,
      screenshotAssetKey: row.screenshot_asset_key,
      tagDetails: splitValues(row.tag_pairs).map((pair) => {
        const [kind, tagSlug, name, groupSlug, groupName] = pair.split(":");
        return {
          kind: kind as TagKind,
          slug: tagSlug,
          name,
          description: "",
          groupSlug: groupSlug || null,
          groupName: groupName || null,
        };
      }),
      categories: splitValues(row.category_pairs).map((pair) => {
        const [categorySlug, ...nameParts] = pair.split(":");
        return { slug: categorySlug, name: nameParts.join(":") };
      }),
      sourceUrl: row.source_url,
      submittedProfile: readConfirmedProfile(row.submission_json),
      researchedProfile: readResearchedProfile(row.import_json),
    };
  },
);

export const listCollections = cache(async (): Promise<CollectionSummary[]> => {
  const database = await getDatabase();
  const result = await database
    .prepare(
      `SELECT collection.slug, collection.name, collection.description,
        COUNT(CASE WHEN tool.status = 'published' THEN 1 END) AS published_tool_count
       FROM collections collection
       LEFT JOIN collection_items item ON item.collection_id = collection.id
       LEFT JOIN tools tool ON tool.id = item.tool_id
       WHERE collection.is_published = 1
       GROUP BY collection.id
       ORDER BY collection.published_at DESC, collection.name COLLATE NOCASE ASC`,
    )
    .all<{
      slug: string;
      name: string;
      description: string;
      published_tool_count: number;
    }>();

  return result.results.map((row) => ({
    slug: row.slug,
    name: row.name,
    description: row.description,
    publishedToolCount: Number(row.published_tool_count),
  }));
});

export const getCollectionBySlug = cache(
  async (slug: string): Promise<CollectionSummary | null> => {
    const collections = await listCollections();
    return collections.find((collection) => collection.slug === slug) ?? null;
  },
);

export async function listCollectionTools(slug: string): Promise<ToolCard[]> {
  const database = await getDatabase();
  const result = await database
    .prepare(
      `SELECT t.id, t.slug, t.name, t.tagline, t.website_url, t.canonical_domain,
        t.pricing_model, t.logo_asset_key, t.published_at, t.last_checked_at,
        t.is_editor_pick, c.slug AS category_slug, c.name AS category_name,
        GROUP_CONCAT(DISTINCT tag.name) AS tag_names,
        CASE WHEN EXISTS (
          SELECT 1 FROM tool_sources source
          WHERE source.tool_id = t.id AND source.provider = 'submission'
        ) THEN 'submission' ELSE (
          SELECT provider FROM tool_sources source
          WHERE source.tool_id = t.id ORDER BY source.last_seen_at DESC LIMIT 1
        ) END AS source_provider
       FROM collections collection
       JOIN collection_items item ON item.collection_id = collection.id
       JOIN tools t ON t.id = item.tool_id AND t.status = 'published'
       JOIN categories c ON c.id = t.primary_category_id
       LEFT JOIN tool_tags tt ON tt.tool_id = t.id
       LEFT JOIN tags tag ON tag.id = tt.tag_id AND tag.is_active = 1
       WHERE collection.is_published = 1 AND collection.slug = ?
       GROUP BY t.id
       ORDER BY item.sort_order ASC`,
    )
    .bind(slug)
    .all<ToolRow>();
  return result.results.map(mapTool);
}

export const listTasks = cache(async (): Promise<TaskSummary[]> => {
  const database = await getDatabase();
  const result = await database
    .prepare(
      `SELECT task.slug, task.name, task.outcome, task.guidance,
        COUNT(CASE WHEN tool.status = 'published' THEN 1 END) AS published_tool_count
       FROM tasks task
       LEFT JOIN task_items item ON item.task_id = task.id
       LEFT JOIN tools tool ON tool.id = item.tool_id
       WHERE task.is_published = 1
       GROUP BY task.id
       HAVING COUNT(CASE WHEN tool.status = 'published' THEN 1 END) >= 3
       ORDER BY task.sort_order ASC, task.name COLLATE NOCASE ASC`,
    )
    .all<{
      slug: string;
      name: string;
      outcome: string;
      guidance: string;
      published_tool_count: number;
    }>();

  return result.results.map((row) => ({
    slug: row.slug,
    name: row.name,
    outcome: row.outcome,
    guidance: row.guidance,
    publishedToolCount: Number(row.published_tool_count),
  }));
});

export const getTaskBySlug = cache(
  async (slug: string): Promise<TaskSummary | null> => {
    const tasks = await listTasks();
    return tasks.find((task) => task.slug === slug) ?? null;
  },
);

export async function listTaskOptions(slug: string): Promise<TaskOption[]> {
  const database = await getDatabase();
  const result = await database
    .prepare(
      `SELECT t.id, t.slug, t.name, t.tagline, t.website_url, t.canonical_domain,
        t.pricing_model, t.logo_asset_key, t.published_at, t.last_checked_at,
        t.is_editor_pick, c.slug AS category_slug, c.name AS category_name,
        GROUP_CONCAT(DISTINCT tag.name) AS tag_names,
        CASE WHEN EXISTS (
          SELECT 1 FROM tool_sources source
          WHERE source.tool_id = t.id AND source.provider = 'submission'
        ) THEN 'submission' ELSE (
          SELECT provider FROM tool_sources source
          WHERE source.tool_id = t.id ORDER BY source.last_seen_at DESC LIMIT 1
        ) END AS source_provider,
        item.best_for,
        item.key_difference, item.limitation
       FROM tasks task
       JOIN task_items item ON item.task_id = task.id
       JOIN tools t ON t.id = item.tool_id AND t.status = 'published'
       JOIN categories c ON c.id = t.primary_category_id
       LEFT JOIN tool_tags tt ON tt.tool_id = t.id
       LEFT JOIN tags tag ON tag.id = tt.tag_id AND tag.is_active = 1
       WHERE task.is_published = 1 AND task.slug = ?
       GROUP BY t.id
       ORDER BY item.sort_order ASC`,
    )
    .bind(slug)
    .all<TaskOptionRow>();

  return result.results.map((row) => ({
    ...mapTool(row),
    bestFor: row.best_for,
    keyDifference: row.key_difference,
    limitation: row.limitation,
  }));
}

export async function listTasksForTool(slug: string): Promise<ToolTaskFit[]> {
  const database = await getDatabase();
  const result = await database
    .prepare(
      `SELECT task.slug, task.name, task.outcome, task.guidance,
        selected.best_for, selected.key_difference, selected.limitation,
        COUNT(CASE WHEN option.status = 'published' THEN 1 END) AS published_tool_count
       FROM tasks task
       JOIN task_items item ON item.task_id = task.id
       JOIN tools option ON option.id = item.tool_id
       JOIN task_items selected ON selected.task_id = task.id
       JOIN tools selected_tool ON selected_tool.id = selected.tool_id
       WHERE task.is_published = 1
         AND selected_tool.slug = ?
         AND selected_tool.status = 'published'
       GROUP BY task.id
       HAVING COUNT(CASE WHEN option.status = 'published' THEN 1 END) >= 3
       ORDER BY task.sort_order ASC`,
    )
    .bind(slug)
    .all<{
      slug: string;
      name: string;
      outcome: string;
      guidance: string;
      published_tool_count: number;
      best_for: string;
      key_difference: string;
      limitation: string;
    }>();

  return result.results.map((row) => ({
    slug: row.slug,
    name: row.name,
    outcome: row.outcome,
    guidance: row.guidance,
    publishedToolCount: Number(row.published_tool_count),
    bestFor: row.best_for,
    keyDifference: row.key_difference,
    limitation: row.limitation,
  }));
}

export async function listSitemapEntries() {
  const database = await getDatabase();
  const [toolsResult, categoriesResult, browseCategoriesResult, collectionsResult, tasksResult] = await Promise.all([
    database
      .prepare("SELECT slug, updated_at FROM tools WHERE status = 'published'")
      .all<{ slug: string; updated_at: number }>(),
    database
      .prepare(
        `SELECT category_group.slug, MAX(tool.updated_at) AS updated_at
         FROM categories category_group
         JOIN tags tag ON tag.category_group_id = category_group.id AND tag.kind = 'category'
         JOIN tool_tags tt ON tt.tag_id = tag.id
         JOIN tools tool ON tool.id = tt.tool_id AND tool.status = 'published'
         WHERE category_group.is_active = 1 AND tag.is_active = 1
         GROUP BY category_group.id HAVING COUNT(DISTINCT tool.id) >= 15`,
      )
      .all<{ slug: string; updated_at: number }>(),
    database
      .prepare(
        `SELECT tag.slug, category_group.slug AS group_slug,
          MAX(tool.updated_at) AS updated_at
         FROM tags tag
         JOIN categories category_group ON category_group.id = tag.category_group_id
         JOIN tool_tags tt ON tt.tag_id = tag.id
         JOIN tools tool ON tool.id = tt.tool_id AND tool.status = 'published'
         WHERE tag.kind = 'category' AND tag.is_active = 1
           AND category_group.is_active = 1
         GROUP BY tag.id HAVING COUNT(tool.id) >= 15`,
      )
      .all<{ slug: string; group_slug: string; updated_at: number }>(),
    database
      .prepare(
        "SELECT slug, updated_at FROM collections WHERE is_published = 1",
      )
      .all<{ slug: string; updated_at: number }>(),
    database
      .prepare(
        `SELECT task.slug, task.updated_at
         FROM tasks task
         JOIN task_items item ON item.task_id = task.id
         JOIN tools tool ON tool.id = item.tool_id AND tool.status = 'published'
         WHERE task.is_published = 1
         GROUP BY task.id
         HAVING COUNT(tool.id) >= 3`,
      )
      .all<{ slug: string; updated_at: number }>(),
  ]);
  return {
    tools: toolsResult.results,
    categories: categoriesResult.results,
    browseCategories: browseCategoriesResult.results,
    collections: collectionsResult.results,
    tasks: tasksResult.results,
  };
}
