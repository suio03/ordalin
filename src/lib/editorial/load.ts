import { cache } from "react";
import {
  listEditorialTools,
  listPublishedToolSlugs,
  type EditorialTool,
} from "@/lib/repositories/catalog";
import {
  editorialHref,
  editorialIsComplete,
  editorialPreviewEnabled,
  editorialToolSlugs,
  getEditorialPage,
  listEditorialPages,
  missingEditorialTools,
  type EditorialKind,
  type EditorialPage,
} from "./index";

/**
 * Resolve one article for rendering. Production serves only published pages
 * whose named tools are published; previews also show incomplete drafts.
 */
export const loadEditorial = cache(async <K extends EditorialKind>(kind: K, slug: string) => {
  const page = getEditorialPage(kind, slug);
  if (!page) return null;
  const [published, tools] = await Promise.all([
    listPublishedToolSlugs(),
    listEditorialTools(editorialToolSlugs(page)),
  ]);
  const complete = editorialIsComplete(page, published);
  if (!complete && !editorialPreviewEnabled()) return null;
  return { page, tools, missing: missingEditorialTools(page, published), indexable: complete && page.status === "published" };
});

/** Articles that can be listed publicly, with tool marks for their cards. */
export const listLiveEditorial = cache(async (kind?: EditorialKind) => {
  const published = await listPublishedToolSlugs();
  const pages = listEditorialPages(kind).filter(
    (page) => editorialPreviewEnabled() || editorialIsComplete(page, published),
  );
  const tools = await listEditorialTools(pages.flatMap(editorialToolSlugs));
  return { pages, tools };
});

export function editorialStructuredData(page: EditorialPage, tools: Map<string, EditorialTool>, baseUrl: string) {
  const url = `${baseUrl}${editorialHref(page)}`;
  const listed = editorialToolSlugs(page)
    .filter((slug) => !(page.kind === "alternatives" && slug === page.anchorSlug))
    .map((slug) => tools.get(slug))
    .filter((tool): tool is EditorialTool => Boolean(tool));
  return [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: page.title,
      description: page.description,
      datePublished: page.publishedAt,
      dateModified: page.updatedAt ?? page.publishedAt,
      author: { "@type": "Organization", name: page.author },
      publisher: { "@type": "Organization", name: "Ordalin", url: baseUrl },
      mainEntityOfPage: url,
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: listed.map((tool, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${baseUrl}/tools/${tool.slug}`,
        name: tool.name,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ];
}

/** Live articles that name a tool, for the tool page's "Featured in" block. */
export async function listLiveEditorialForTool(toolSlug: string) {
  const { pages, tools } = await listLiveEditorial();
  return { pages: pages.filter((page) => editorialToolSlugs(page).includes(toolSlug)), tools };
}
