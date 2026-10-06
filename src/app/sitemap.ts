import type { MetadataRoute } from "next";
import { listPublishedGuides } from "@/lib/guides";
import {
  editorialHref,
  editorialIsComplete,
  editorialKinds,
  editorialPaths,
  listEditorialPages,
} from "@/lib/editorial";
import { allAgentsPaths } from "@/lib/agents/content";
import { allAgents, CHECKED_ON } from "@/lib/agents/data";
import { indexableModelsMinimum, modelTagSlug } from "@/lib/catalog";
import { listPublishedToolSlugs, listPublishedTools, listSitemapEntries } from "@/lib/repositories/catalog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const [entries, guides, publishedTools, models] = await Promise.all([
    listSitemapEntries(),
    listPublishedGuides(),
    listPublishedToolSlugs(),
    listPublishedTools({ tagSlug: modelTagSlug, pageSize: 1 }),
  ]);
  // Only pages production serves as indexable: published and fully backed by the catalogue.
  const editorial = listEditorialPages().filter(
    (page) => page.status === "published" && editorialIsComplete(page, publishedTools),
  );
  const editorialHubs = editorialKinds.filter((kind) => editorial.some((page) => page.kind === kind));
  const fixed: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/tools`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/tasks`, changeFrequency: "weekly", priority: 0.85 },
    { url: `${baseUrl}/collections`, changeFrequency: "weekly", priority: 0.8 },
    ...(models.total >= indexableModelsMinimum
      ? [{ url: `${baseUrl}/models`, changeFrequency: "weekly" as const, priority: 0.8 }]
      : []),
    ...(guides.length
      ? [{ url: `${baseUrl}/guides`, changeFrequency: "weekly" as const, priority: 0.7 }]
      : []),
    ...editorialHubs.map((kind) => ({
      url: `${baseUrl}${editorialPaths[kind]}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    { url: `${baseUrl}/about/how-we-review`, changeFrequency: "monthly", priority: 0.4 },
  ];

  // AI agent pages synced from agentsversus, dated by their last fact check.
  const agentDates = new Map(allAgents().map((agent) => [`/agents/${agent.slug}`, agent.checked_on ?? CHECKED_ON]));
  const agents: MetadataRoute.Sitemap = allAgentsPaths().map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: agentDates.get(path) ?? CHECKED_ON,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    ...fixed,
    ...agents,
    ...entries.tools.map((entry) => ({
      url: `${baseUrl}/tools/${entry.slug}`,
      lastModified: new Date(entry.updated_at * 1000),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...entries.categories.map((entry) => ({
      url: `${baseUrl}/categories/${entry.slug}`,
      lastModified: new Date(entry.updated_at * 1000),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...entries.browseCategories.map((entry) => ({
      url: `${baseUrl}/categories/${entry.group_slug}/${entry.slug}`,
      lastModified: new Date(entry.updated_at * 1000),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...entries.collections.map((entry) => ({
      url: `${baseUrl}/collections/${entry.slug}`,
      lastModified: new Date(entry.updated_at * 1000),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...entries.tasks.map((entry) => ({
      url: `${baseUrl}/tasks/${entry.slug}`,
      lastModified: new Date(entry.updated_at * 1000),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...editorial.map((page) => ({
      url: `${baseUrl}${editorialHref(page)}`,
      lastModified: new Date(`${page.updatedAt ?? page.publishedAt}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...guides.map((guide) => ({
      url: `${baseUrl}/guides/${guide.slug}`,
      lastModified: new Date(`${guide.updatedAt ?? guide.publishedAt}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
  ];
}
