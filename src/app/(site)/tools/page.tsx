import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";
import { notFound } from "next/navigation";
import { cache } from "react";
import { DirectoryExplorer } from "@/components/directory/directory-explorer";
import { pricingModels, topLevelCategories, type PricingModel } from "@/domain/catalog";
import { cataloguePageSize, parseCatalogueSort, parsePage, type CatalogueSort } from "@/lib/catalog";
import {
  listCategories,
  listCollections,
  listPublishedTools,
} from "@/lib/repositories/catalog";

export const dynamic = "force-dynamic";

type ToolsProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const getCatalogue = cache(async (
  query: string, category: string, pricing: string, sort: CatalogueSort, page: number,
) => {
  const result = await listPublishedTools({
    query: query || undefined,
    categorySlug: category || undefined,
    pricingModel: pricing || undefined,
    sort,
    page,
    pageSize: cataloguePageSize,
  });
  if (page > result.totalPages) notFound();
  return result;
});

function catalogueState(params: Awaited<ToolsProps["searchParams"]>) {
  const query = firstSearchParam(params.q)?.trim() ?? "";
  const requestedCategory = firstSearchParam(params.category) ?? "";
  const category = topLevelCategories.some(
    (item) => item.slug !== "other" && item.slug === requestedCategory,
  ) ? requestedCategory : "";
  const requestedPricing = firstSearchParam(params.pricing) ?? "";
  const pricing = pricingModels.includes(requestedPricing as PricingModel)
    ? requestedPricing
    : "";
  const sort = parseCatalogueSort(params.sort);
  const page = parsePage(params.page);
  return { query, category, pricing, sort, page };
}

export async function generateMetadata({ searchParams }: ToolsProps): Promise<Metadata> {
  const params = await searchParams;
  const { query, category, pricing, sort, page } = catalogueState(params);
  await getCatalogue(query, category, pricing, sort, page);
  const hasFilters = ["q", "category", "pricing", "sort"]
    .some((key) => Boolean(firstSearchParam(params[key])));
  return withSocial({
    title: page > 1 ? `All AI tools — page ${page}` : "All AI tools",
    description: "Browse every published AI tool on Ordalin with pricing, category and official-website check dates.",
    alternates: { canonical: !hasFilters && page > 1 ? `/tools?page=${page}` : "/tools" },
    robots: { index: !hasFilters, follow: true },
  });
}

export default async function ToolsPage({ searchParams }: ToolsProps) {
  const { query, category, pricing, sort, page } = catalogueState(await searchParams);
  const [categories, catalogue, editorPicks, collections] = await Promise.all([
    listCategories(),
    getCatalogue(query, category, pricing, sort, page),
    listPublishedTools({ editorPicksOnly: true, pageSize: 4 }),
    listCollections(),
  ]);

  return (
    <DirectoryExplorer
      categories={categories.map(({ slug, name }) => ({ slug, name }))}
      tools={catalogue.items}
      total={catalogue.total}
      page={catalogue.page}
      totalPages={catalogue.totalPages}
      editorPicks={editorPicks.items}
      collections={collections}
      initialState={{
        query,
        category: category || "all",
        pricing: pricing || "all",
        sort,
      }}
    />
  );
}
