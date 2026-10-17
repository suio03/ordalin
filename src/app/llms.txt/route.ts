import { editorialHref, editorialIsComplete, listEditorialPages } from "@/lib/editorial";
import { listCategories, listCollections, listPublishedToolSlugs, listTasks } from "@/lib/repositories/catalog";

export const dynamic = "force-dynamic";

// Ordalin's own llms.txt (llmstxt.org format), built from live catalogue data.
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const [categories, tasks, collections, publishedTools] = await Promise.all([
    listCategories(),
    listTasks(),
    listCollections(),
    listPublishedToolSlugs(),
  ]);
  // Same rule as the sitemap: only published articles fully backed by the catalogue.
  const editorial = listEditorialPages().filter(
    (page) => page.status === "published" && editorialIsComplete(page, publishedTools),
  );
  const link = (path: string, name: string, notes?: string | null) =>
    `- [${name}](${baseUrl}${path})${notes ? `: ${notes.replace(/\s+/g, " ").trim()}` : ""}`;
  const section = (title: string, lines: string[]) => (lines.length ? ["", `## ${title}`, "", ...lines] : []);

  const lines = [
    "# Ordalin",
    "",
    "> Ordalin is a directory of AI tools, organised by category and by the job you need done. Pricing and platforms on each tool profile are checked against the tool's official website.",
    "",
    "Each tool has a profile at /tools/{slug} with what it does, who it suits, pricing, platforms and limitations. Profiles are researched from official sources and dated; see How we review for the method.",
    ...section("Browse", [
      link("/tools", "All AI tools", "The full catalogue with search, category and pricing filters"),
      link("/tasks", "Find by goal", "Tools grouped by the outcome you want, with which option suits which situation"),
      link("/collections", "Collections", "Curated sets of tools"),
      link("/agents", "AI agents", "AI agents compared by what they can do"),
    ]),
    ...section("Categories", categories.map((category) => link(`/categories/${category.slug}`, category.name, category.description))),
    ...section("Goals", tasks.map((task) => link(`/tasks/${task.slug}`, task.name, task.outcome))),
    ...section("Guides", editorial.map((page) => link(editorialHref(page), page.title, page.description))),
    ...section("Free tools", [
      link("/free-tools/ai-visibility-checker", "AI visibility checker", "Test whether AI search crawlers can reach and read a website"),
      link("/free-tools/llms-txt-generator", "llms.txt generator", "Generate an llms.txt file from a site's sitemap"),
      link("/free-tools/llms-txt-checker", "llms.txt checker", "Validate an llms.txt file's format, delivery and links"),
    ]),
    ...section("About", [
      link("/about/how-we-review", "How we review", "How tool profiles are researched, checked and kept current"),
      link("/submit", "Submit a tool", "Free listing for AI tool makers"),
    ]),
    ...section("Optional", collections.map((collection) => link(`/collections/${collection.slug}`, collection.name, collection.description))),
  ];

  return new Response(`${lines.join("\n")}\n`, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
