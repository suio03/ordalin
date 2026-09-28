import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/repositories/catalog", () => ({
  listPublishedTools: vi.fn(),
  listCategories: vi.fn().mockResolvedValue([]),
  listCollections: vi.fn().mockResolvedValue([]),
  listBrowseCategories: vi.fn().mockResolvedValue([]),
  getCategoryBySlug: vi.fn(),
  getBrowseCategory: vi.fn(),
}));

import { listPublishedTools, getCategoryBySlug, getBrowseCategory } from "@/lib/repositories/catalog";
import Home, { generateMetadata as homeMetadata } from "./page";
import Category, { generateMetadata as categoryMetadata } from "./categories/[slug]/page";
import BrowseCategory, { generateMetadata as browseMetadata } from "./categories/[slug]/[categorySlug]/page";

beforeEach(() => {
  vi.mocked(listPublishedTools).mockResolvedValue({ items: [], total: 25, page: 1, pageSize: 12, totalPages: 3 });
  const category = { slug: "coding", name: "Coding", description: "Coding tools", publishedToolCount: 25 };
  vi.mocked(getCategoryBySlug).mockResolvedValue(category);
  vi.mocked(getBrowseCategory).mockResolvedValue({ ...category, groupSlug: "coding", groupName: "Coding" });
});

const home = (params: Record<string, string | undefined> = {}) => ({ searchParams: Promise.resolve(params) });
const category = (page: string) => ({ params: Promise.resolve({ slug: "coding" }), searchParams: Promise.resolve({ page }) });
const browse = (page: string) => ({ params: Promise.resolve({ slug: "coding", categorySlug: "coding-assistant" }), searchParams: Promise.resolve({ page }) });

describe("catalogue pagination SEO", () => {
  it("indexes pure homepage pagination with its own canonical", async () => {
    expect(await homeMetadata(home({ page: "2" }))).toMatchObject({
      alternates: { canonical: "/?page=2" }, robots: { index: true, follow: true },
    });
    expect(await homeMetadata(home({ page: "1" }))).toMatchObject({ alternates: { canonical: "/" } });
  });

  it.each([{ q: "code" }, { category: "coding" }, { pricing: "free" }, { sort: "oldest" }])(
    "keeps filtered and sorted pagination out of indexes: %j", async (params) => {
      expect(await homeMetadata(home({ ...params, page: "2" }))).toMatchObject({ robots: { index: false, follow: true } });
    },
  );

  it("uses self canonicals for both category depths", async () => {
    expect(await categoryMetadata(category("2"))).toMatchObject({ alternates: { canonical: "/categories/coding?page=2" }, robots: { index: true } });
    expect(await browseMetadata(browse("2"))).toMatchObject({ alternates: { canonical: "/categories/coding/coding-assistant?page=2" }, robots: { index: true } });
  });

  it("retains the minimum-inventory indexing rule", async () => {
    vi.mocked(getCategoryBySlug).mockResolvedValue({ slug: "coding", name: "Coding", description: "Coding tools", publishedToolCount: 14 });
    expect(await categoryMetadata(category("1"))).toMatchObject({ robots: { index: false } });
  });

  it("rejects out-of-range pages in metadata and page rendering", async () => {
    for (const render of [
      () => homeMetadata(home({ page: "999" })), () => Home(home({ page: "999" })),
      () => categoryMetadata(category("999")), () => Category(category("999")),
      () => browseMetadata(browse("999")), () => BrowseCategory(browse("999")),
    ]) await expect(render()).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });

  it("allows an empty first page for a search with no matches", async () => {
    vi.mocked(listPublishedTools).mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 12, totalPages: 1 });
    await expect(Home(home({ q: "no matches" }))).resolves.toBeDefined();
    await expect(Home(home({ q: "no matches", page: "2" }))).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });
});
