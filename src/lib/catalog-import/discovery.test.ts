import { describe, expect, it, vi } from "vitest";
import {
  discoverDetailUrls,
  extractHtmlLinks,
  officialLinkCandidates,
  resolveOfficialWebsite,
} from "./discovery";

describe("catalog directory discovery", () => {
  it("extracts and deduplicates Product Hunt product pages", () => {
    const html = `
      <a href="/products/alpha">Alpha</a>
      <a href="/products/alpha?ref=home">Alpha again</a>
      <a href="/categories/ai">Category</a>
      <a href="https://example.com">External</a>`;
    expect(discoverDetailUrls("product_hunt", html, "https://www.producthunt.com/")).toEqual([
      "https://www.producthunt.com/products/alpha",
    ]);
  });

  it("extracts localized Toolify tool pages", () => {
    const html = `<a href="/tool/one/">One</a><a href="/es/tool/two">Two</a>`;
    expect(discoverDetailUrls("toolify", html, "https://www.toolify.ai/new")).toEqual([
      "https://www.toolify.ai/tool/one",
      "https://www.toolify.ai/es/tool/two",
    ]);
  });

  it("decodes links and prioritizes the official-site action", () => {
    const html = `<a href="https://x.com/test">Social</a><a href="https://docs.example.com/terms">Terms</a><a href="https://example.ai/?utm_source=toolify">Open site</a>`;
    expect(extractHtmlLinks(html, "https://www.toolify.ai/tool/test")).toHaveLength(3);
    expect(officialLinkCandidates("toolify", html, "https://www.toolify.ai/tool/test")[0]).toContain("example.ai");
    expect(officialLinkCandidates("toolify", html, "https://www.toolify.ai/tool/test")).not.toContain("https://docs.example.com/terms");
  });

  it("follows a directory redirect and removes tracking parameters", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: "https://product.example/?utm_source=ph" } }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));
    const result = await resolveOfficialWebsite(
      "product_hunt",
      "https://www.producthunt.com/products/test-product",
      `<a href="/r/test-product">Visit website</a>`,
      fetcher,
    );
    expect(result).toMatchObject({
      externalId: "test-product",
      websiteUrl: "https://product.example/",
    });
  });
});
