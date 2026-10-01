import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";
import { editorialHref, editorialPaths, type EditorialKind, type EditorialPage } from "./index";
import { listLiveEditorial } from "./load";

export function editorialMetadata(page: EditorialPage, indexable: boolean): Metadata {
  const url = editorialHref(page);
  return withSocial({
    title: { absolute: `${page.title} | Ordalin` },
    description: page.description,
    alternates: { canonical: url },
    robots: { index: indexable, follow: true },
    openGraph: {
      type: "article",
      title: page.title,
      description: page.description,
      url,
      siteName: "Ordalin",
      publishedTime: page.publishedAt,
      modifiedTime: page.updatedAt ?? page.publishedAt,
    },
  });
}

/** A hub stays out of the index until it lists a published page, matching the sitemap. */
export async function editorialHubMetadata(kind: EditorialKind, title: string, description: string): Promise<Metadata> {
  const { pages } = await listLiveEditorial(kind);
  return withSocial({
    title,
    description,
    alternates: { canonical: editorialPaths[kind] },
    robots: { index: pages.some((page) => page.status === "published"), follow: true },
  });
}

export const appBaseUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
