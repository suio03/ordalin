import type { CatalogTaxonomy } from "./contract";

type CategoryRow = { slug: string; name: string; description: string };
type TagRow = {
  slug: string;
  name: string;
  kind: "category" | "interface" | "attribute";
  group_slug: string | null;
  description: string;
};

export async function loadCatalogTaxonomy(database: D1Database): Promise<CatalogTaxonomy> {
  const [categories, tags] = await Promise.all([
    database
      .prepare("SELECT slug, name, description FROM categories WHERE is_active = 1 ORDER BY sort_order, name")
      .all<CategoryRow>(),
    database
      .prepare(
        "SELECT t.slug, t.name, t.kind, c.slug AS group_slug, t.description FROM tags t LEFT JOIN categories c ON c.id = t.category_group_id WHERE t.is_active = 1 ORDER BY t.kind, t.name",
      )
      .all<TagRow>(),
  ]);
  return {
    categories: categories.results,
    tags: tags.results.map((tag) => ({
      slug: tag.slug,
      name: tag.name,
      kind: tag.kind,
      groupSlug: tag.group_slug,
      description: tag.description,
    })),
  };
}
