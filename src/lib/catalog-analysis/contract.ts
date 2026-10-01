import {
  pricingModels,
  type PricingModel,
  type TagKind,
} from "../../domain/catalog.ts";

export const catalogAnalysisSchemaVersion = 1 as const;

export type CatalogTaxonomyCategory = {
  slug: string;
  name: string;
  description: string;
};

export type CatalogTaxonomyTag = {
  slug: string;
  name: string;
  kind: TagKind;
  groupSlug: string | null;
  description: string;
};

export type CatalogTaxonomy = {
  categories: CatalogTaxonomyCategory[];
  tags: CatalogTaxonomyTag[];
};

export type CatalogAnalysis = {
  schemaVersion: typeof catalogAnalysisSchemaVersion;
  isAiTool: boolean;
  name: string;
  tagline: string;
  description: string;
  pricingModel: PricingModel;
  primaryCategorySlug: string;
  categorySlugs: string[];
  tagSlugs: string[];
  evidence: {
    identity: string[];
    description: string[];
    pricing: string[];
    classification: string[];
  };
  profile?: unknown;
  details?: import("../submissions/profile").ExtractedDetails;
  needsReviewReasons: string[];
};

export type CatalogAnalysisDecision = {
  outcome: "auto_publish" | "skip";
  reasons: string[];
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function cleanText(value: unknown, max: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, max)
    : "";
}

function uniqueSlugs(value: unknown) {
  return isStringArray(value)
    ? [...new Set(value.filter((item) => /^[a-z0-9-]+$/.test(item)))]
    : [];
}

function evidenceUrls(value: unknown) {
  return isStringArray(value)
    ? [...new Set(value.filter((item) => {
        try {
          return new URL(item).protocol === "https:";
        } catch {
          return false;
        }
      }))]
    : [];
}

export function parseCatalogAnalysis(value: unknown): CatalogAnalysis {
  if (!value || typeof value !== "object") throw new Error("Catalog analysis is not an object");
  const record = value as Record<string, unknown>;
  const evidence = record.evidence && typeof record.evidence === "object"
    ? record.evidence as Record<string, unknown>
    : {};
  const pricingModel = pricingModels.includes(record.pricingModel as PricingModel)
    ? record.pricingModel as PricingModel
    : "unknown";

  return {
    schemaVersion: catalogAnalysisSchemaVersion,
    ...(record.profile !== undefined ? { profile: record.profile } : {}),
    isAiTool: record.isAiTool === true,
    name: cleanText(record.name, 80),
    tagline: cleanText(record.tagline, 180),
    description: cleanText(record.description, 1_200),
    pricingModel,
    primaryCategorySlug: cleanText(record.primaryCategorySlug, 64),
    categorySlugs: uniqueSlugs(record.categorySlugs).slice(0, 4),
    tagSlugs: uniqueSlugs(record.tagSlugs).slice(0, 8),
    evidence: {
      identity: evidenceUrls(evidence.identity),
      description: evidenceUrls(evidence.description),
      pricing: evidenceUrls(evidence.pricing),
      classification: evidenceUrls(evidence.classification),
    },
    needsReviewReasons: isStringArray(record.needsReviewReasons)
      ? [...new Set(record.needsReviewReasons.map((item) => cleanText(item, 240)).filter(Boolean))].slice(0, 8)
      : [],
  };
}

export function catalogAnalysisJsonSchema(taxonomy: CatalogTaxonomy) {
  const categorySlugs = taxonomy.categories.map((category) => category.slug);
  const tagSlugs = taxonomy.tags.map((tag) => tag.slug);
  const evidence = {
    type: "array",
    items: { type: "string" },
    maxItems: 6,
  } as const;

  return {
    type: "object",
    additionalProperties: false,
    properties: {
      schemaVersion: { type: "integer", const: catalogAnalysisSchemaVersion },
      isAiTool: { type: "boolean" },
      name: { type: "string", maxLength: 80 },
      tagline: { type: "string", maxLength: 180 },
      description: { type: "string", maxLength: 1_200 },
      pricingModel: { type: "string", enum: pricingModels },
      primaryCategorySlug: { type: "string", enum: categorySlugs },
      categorySlugs: {
        type: "array",
        items: { type: "string", enum: categorySlugs },
        minItems: 1,
        maxItems: 4,
      },
      tagSlugs: {
        type: "array",
        items: { type: "string", enum: tagSlugs },
        minItems: 1,
        maxItems: 8,
      },
      evidence: {
        type: "object",
        additionalProperties: false,
        properties: {
          identity: evidence,
          description: evidence,
          pricing: evidence,
          classification: evidence,
        },
        required: ["identity", "description", "pricing", "classification"],
      },
      needsReviewReasons: {
        type: "array",
        items: { type: "string", maxLength: 240 },
        maxItems: 8,
      },
    },
    required: [
      "schemaVersion",
      "isAiTool",
      "name",
      "tagline",
      "description",
      "pricingModel",
      "primaryCategorySlug",
      "categorySlugs",
      "tagSlugs",
      "evidence",
      "needsReviewReasons",
    ],
  };
}
