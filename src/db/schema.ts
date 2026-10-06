import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import {
  importCandidateStatuses,
  pricingModels,
  sourceProviders,
  tagKinds,
  toolStatuses,
} from "@/domain/catalog";

export const categories = sqliteTable(
  "categories",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    sortOrder: integer("sort_order").notNull(),
    isActive: integer("is_active", { mode: "boolean" })
      .notNull()
      .default(true),
  },
  (table) => [
    uniqueIndex("categories_slug_unique").on(table.slug),
    index("categories_active_order").on(table.isActive, table.sortOrder),
  ],
);

export const tools = sqliteTable(
  "tools",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    tagline: text("tagline").notNull(),
    description: text("description").notNull(),
    websiteUrl: text("website_url").notNull(),
    canonicalDomain: text("canonical_domain").notNull(),
    /** Duplicate identity: the domain, or domain + path for one model page of a multi-model vendor. */
    canonicalKey: text("canonical_key"),
    pricingModel: text("pricing_model", { enum: pricingModels }).notNull(),
    status: text("status", { enum: toolStatuses })
      .notNull()
      .default("pending_review"),
    primaryCategoryId: text("primary_category_id")
      .notNull()
      .references(() => categories.id),
    logoAssetKey: text("logo_asset_key"),
    screenshotAssetKey: text("screenshot_asset_key"),
    isEditorPick: integer("is_editor_pick", { mode: "boolean" })
      .notNull()
      .default(false),
    sourceFirstSeenAt: integer("source_first_seen_at").notNull(),
    publishedAt: integer("published_at"),
    lastCheckedAt: integer("last_checked_at"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("tools_slug_unique").on(table.slug),
    index("tools_canonical_domain").on(table.canonicalDomain),
    uniqueIndex("tools_canonical_key_unique").on(table.canonicalKey),
    index("tools_status_published").on(table.status, table.publishedAt),
    index("tools_category_status_published").on(
      table.primaryCategoryId,
      table.status,
      table.publishedAt,
    ),
    index("tools_editor_pick_status").on(table.isEditorPick, table.status),
  ],
);

export const toolCategories = sqliteTable(
  "tool_categories",
  {
    toolId: text("tool_id")
      .notNull()
      .references(() => tools.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    isPrimary: integer("is_primary", { mode: "boolean" })
      .notNull()
      .default(false),
  },
  (table) => [
    primaryKey({ columns: [table.toolId, table.categoryId] }),
    index("tool_categories_category").on(table.categoryId, table.toolId),
  ],
);

export const tags = sqliteTable(
  "tags",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    kind: text("kind", { enum: tagKinds }).notNull().default("attribute"),
    categoryGroupId: text("category_group_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    description: text("description").notNull().default(""),
    isActive: integer("is_active", { mode: "boolean" })
      .notNull()
      .default(true),
  },
  (table) => [
    uniqueIndex("tags_slug_unique").on(table.slug),
    index("tags_kind_group_active").on(
      table.kind,
      table.categoryGroupId,
      table.isActive,
    ),
  ],
);

export const toolTags = sqliteTable(
  "tool_tags",
  {
    toolId: text("tool_id")
      .notNull()
      .references(() => tools.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.toolId, table.tagId] }),
    index("tool_tags_tag").on(table.tagId, table.toolId),
  ],
);

export const toolSources = sqliteTable(
  "tool_sources",
  {
    id: text("id").primaryKey(),
    toolId: text("tool_id")
      .notNull()
      .references(() => tools.id, { onDelete: "cascade" }),
    provider: text("provider", { enum: sourceProviders }).notNull(),
    externalId: text("external_id").notNull(),
    sourceUrl: text("source_url"),
    rawJson: text("raw_json").notNull(),
    firstSeenAt: integer("first_seen_at").notNull(),
    lastSeenAt: integer("last_seen_at").notNull(),
  },
  (table) => [
    uniqueIndex("tool_sources_provider_external_unique").on(
      table.provider,
      table.externalId,
    ),
    index("tool_sources_tool").on(table.toolId),
  ],
);

export const submissions = sqliteTable(
  "submissions",
  {
    id: text("id").primaryKey(),
    submittedName: text("submitted_name").notNull(),
    websiteUrl: text("website_url").notNull(),
    canonicalDomain: text("canonical_domain").notNull(),
    contactEmail: text("contact_email").notNull(),
    description: text("description").notNull(),
    suggestedCategoryId: text("suggested_category_id").references(
      () => categories.id,
      { onDelete: "set null" },
    ),
    status: text("status", {
      enum: ["pending", "accepted", "rejected", "duplicate"],
    })
      .notNull()
      .default("pending"),
    turnstileMetadataJson: text("turnstile_metadata_json").notNull(),
    moderationNote: text("moderation_note"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("submissions_status_created").on(table.status, table.createdAt),
    index("submissions_domain_created").on(
      table.canonicalDomain,
      table.createdAt,
    ),
  ],
);

export const submissionDrafts = sqliteTable(
  "submission_drafts",
  {
    id: text("id").primaryKey(),
    websiteUrl: text("website_url").notNull(),
    canonicalDomain: text("canonical_domain").notNull(),
    candidateJson: text("candidate_json").notNull(),
    actorHash: text("actor_hash").notNull(),
    status: text("status", {
      enum: ["pending", "published", "expired"],
    })
      .notNull()
      .default("pending"),
    expiresAt: integer("expires_at").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("submission_drafts_domain_status").on(
      table.canonicalDomain,
      table.status,
    ),
    index("submission_drafts_expires").on(table.expiresAt),
  ],
);

export const submissionAttempts = sqliteTable(
  "submission_attempts",
  {
    id: text("id").primaryKey(),
    actorHash: text("actor_hash").notNull(),
    action: text("action", { enum: ["enrich", "publish"] }).notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    index("submission_attempts_actor_action_created").on(
      table.actorHash,
      table.action,
      table.createdAt,
    ),
  ],
);

export const collections = sqliteTable(
  "collections",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    isPublished: integer("is_published", { mode: "boolean" })
      .notNull()
      .default(false),
    publishedAt: integer("published_at"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("collections_slug_unique").on(table.slug),
    index("collections_published").on(table.isPublished, table.publishedAt),
  ],
);

export const collectionItems = sqliteTable(
  "collection_items",
  {
    collectionId: text("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    toolId: text("tool_id")
      .notNull()
      .references(() => tools.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull(),
    editorialNote: text("editorial_note"),
  },
  (table) => [
    primaryKey({ columns: [table.collectionId, table.toolId] }),
    uniqueIndex("collection_items_order_unique").on(
      table.collectionId,
      table.sortOrder,
    ),
  ],
);

export const tasks = sqliteTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    outcome: text("outcome").notNull(),
    guidance: text("guidance").notNull(),
    sortOrder: integer("sort_order").notNull(),
    isPublished: integer("is_published", { mode: "boolean" })
      .notNull()
      .default(false),
    publishedAt: integer("published_at"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("tasks_slug_unique").on(table.slug),
    index("tasks_published_order").on(table.isPublished, table.sortOrder),
  ],
);

export const taskItems = sqliteTable(
  "task_items",
  {
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    toolId: text("tool_id")
      .notNull()
      .references(() => tools.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull(),
    bestFor: text("best_for").notNull(),
    keyDifference: text("key_difference").notNull(),
    limitation: text("limitation").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.taskId, table.toolId] }),
    uniqueIndex("task_items_order_unique").on(table.taskId, table.sortOrder),
    index("task_items_tool").on(table.toolId, table.taskId),
  ],
);

export const ingestionRuns = sqliteTable(
  "ingestion_runs",
  {
    id: text("id").primaryKey(),
    provider: text("provider", { enum: sourceProviders }).notNull(),
    cursor: text("cursor"),
    startedAt: integer("started_at").notNull(),
    completedAt: integer("completed_at"),
    fetchedCount: integer("fetched_count").notNull().default(0),
    importedCount: integer("imported_count").notNull().default(0),
    duplicateCount: integer("duplicate_count").notNull().default(0),
    errorCount: integer("error_count").notNull().default(0),
    status: text("status", {
      enum: ["running", "completed", "failed", "partial"],
    }).notNull(),
    errorSummary: text("error_summary"),
  },
  (table) => [
    index("ingestion_runs_provider_started").on(
      table.provider,
      table.startedAt,
    ),
  ],
);

export const importCandidates = sqliteTable(
  "import_candidates",
  {
    id: text("id").primaryKey(),
    provider: text("provider", { enum: sourceProviders }).notNull(),
    externalId: text("external_id").notNull(),
    discoveryUrl: text("discovery_url").notNull(),
    websiteUrl: text("website_url").notNull(),
    canonicalDomain: text("canonical_domain").notNull(),
    canonicalKey: text("canonical_key"),
    status: text("status", { enum: importCandidateStatuses })
      .notNull()
      .default("discovered"),
    candidateJson: text("candidate_json").notNull(),
    analysisJson: text("analysis_json"),
    decisionReasonsJson: text("decision_reasons_json").notNull().default("[]"),
    toolId: text("tool_id").references(() => tools.id, { onDelete: "set null" }),
    errorSummary: text("error_summary"),
    discoveredAt: integer("discovered_at").notNull(),
    analyzedAt: integer("analyzed_at"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("import_candidates_provider_external_unique").on(
      table.provider,
      table.externalId,
    ),
    index("import_candidates_domain").on(table.canonicalDomain),
    uniqueIndex("import_candidates_key_unique").on(table.canonicalKey),
    index("import_candidates_status_updated").on(table.status, table.updatedAt),
    index("import_candidates_tool").on(table.toolId),
  ],
);

export const moderationEvents = sqliteTable(
  "moderation_events",
  {
    id: text("id").primaryKey(),
    entityType: text("entity_type", {
      enum: ["tool", "submission", "collection", "import_candidate"],
    }).notNull(),
    entityId: text("entity_id").notNull(),
    action: text("action", {
      enum: ["publish", "auto_publish", "reject", "merge", "edit", "archive", "analyze", "skip"],
    }).notNull(),
    actorIdentity: text("actor_identity").notNull(),
    metadataJson: text("metadata_json").notNull().default("{}"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    index("moderation_events_entity_created").on(
      table.entityType,
      table.entityId,
      table.createdAt,
    ),
  ],
);
