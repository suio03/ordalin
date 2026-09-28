import type { MetadataRoute } from "next";
import { listPublishedGuides } from "@/lib/guides";
import { listSitemapEntries } from "@/lib/repositories/catalog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const [entries, guides] = await Promise.all([
    listSitemapEntries(),
    listPublishedGuides(),
  ]);
  const fixed: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/tasks`, changeFrequency: "weekly", priority: 0.85 },
    { url: `${baseUrl}/collections`, changeFrequency: "weekly", priority: 0.8 },
    ...(guides.length
      ? [{ url: `${baseUrl}/guides`, changeFrequency: "weekly" as const, priority: 0.7 }]
      : []),
  ];

  return [
    ...fixed,
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
    ...guides.map((guide) => ({
      url: `${baseUrl}/guides/${guide.slug}`,
      lastModified: new Date(`${guide.updatedAt ?? guide.publishedAt}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
  ];
}
