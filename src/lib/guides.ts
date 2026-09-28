import { cache } from "react";
import type { MDXContent } from "mdx/types";

export type GuideStatus = "draft" | "published";

export type GuideMetadata = {
  title: string;
  description: string;
  author: string;
  publishedAt: string;
  updatedAt?: string;
  status: GuideStatus;
  topics?: string[];
  relatedLinks?: Array<{ href: string; label: string }>;
};

export type GuideSummary = GuideMetadata & { slug: string };
export type PublishedGuide = GuideSummary & { Content: MDXContent };

type GuideModule = {
  default: MDXContent;
  metadata: unknown;
};

type GuideLoader = () => Promise<GuideModule>;

// Add one statically analyzable import here for each MDX file. Avoid runtime
// filesystem reads so the same bundle works on Cloudflare Workers.
const guideLoaders: Record<string, GuideLoader> = {};

function requiredString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Guide metadata ${field} must be a non-empty string.`);
  }
  return value.trim();
}

function isoDate(value: unknown, field: string) {
  const date = requiredString(value, field);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    throw new Error(`Guide metadata ${field} must use YYYY-MM-DD.`);
  }
  return date;
}

function optionalStrings(value: unknown, field: string) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item.trim())) {
    throw new Error(`Guide metadata ${field} must be an array of non-empty strings.`);
  }
  return [...new Set(value.map((item) => item.trim()))];
}

export function parseGuideMetadata(slug: string, input: unknown): GuideSummary {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`Guide slug "${slug}" is invalid.`);
  }
  if (!input || typeof input !== "object") {
    throw new Error(`Guide "${slug}" must export metadata.`);
  }

  const value = input as Record<string, unknown>;
  const status = value.status;
  if (status !== "draft" && status !== "published") {
    throw new Error(`Guide metadata status must be draft or published.`);
  }

  let relatedLinks: GuideMetadata["relatedLinks"];
  if (value.relatedLinks !== undefined) {
    if (!Array.isArray(value.relatedLinks)) {
      throw new Error(`Guide metadata relatedLinks must be an array.`);
    }
    relatedLinks = value.relatedLinks.map((item) => {
      if (!item || typeof item !== "object") {
        throw new Error(`Guide metadata relatedLinks entries must be objects.`);
      }
      const link = item as Record<string, unknown>;
      const href = requiredString(link.href, "relatedLinks.href");
      if (!href.startsWith("/")) {
        throw new Error(`Guide related links must use internal paths.`);
      }
      return { href, label: requiredString(link.label, "relatedLinks.label") };
    });
  }

  const publishedAt = isoDate(value.publishedAt, "publishedAt");
  const updatedAt = value.updatedAt === undefined ? undefined : isoDate(value.updatedAt, "updatedAt");
  if (updatedAt && updatedAt < publishedAt) {
    throw new Error(`Guide metadata updatedAt cannot precede publishedAt.`);
  }

  return {
    slug,
    title: requiredString(value.title, "title"),
    description: requiredString(value.description, "description"),
    author: requiredString(value.author, "author"),
    publishedAt,
    updatedAt,
    status,
    topics: optionalStrings(value.topics, "topics"),
    relatedLinks,
  };
}

const loadGuideSummaries = cache(async () => {
  const entries = await Promise.all(
    Object.entries(guideLoaders).map(async ([slug, load]) => {
      const guideModule = await load();
      return parseGuideMetadata(slug, guideModule.metadata);
    }),
  );
  return entries
    .filter((guide) => guide.status === "published")
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
});

export async function listPublishedGuides() {
  return loadGuideSummaries();
}

export async function getPublishedGuide(slug: string): Promise<PublishedGuide | null> {
  const load = guideLoaders[slug];
  if (!load) return null;
  const guideModule = await load();
  const metadata = parseGuideMetadata(slug, guideModule.metadata);
  if (metadata.status !== "published") return null;
  return { ...metadata, Content: guideModule.default };
}

export function formatGuideDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}
