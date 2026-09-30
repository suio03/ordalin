import type { Metadata } from "next";
import { editorialHref, type EditorialPage } from "./index";

export function editorialMetadata(page: EditorialPage, indexable: boolean): Metadata {
  const url = editorialHref(page);
  return {
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
  };
}

export const appBaseUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
