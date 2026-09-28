import {
  catalogWebsiteOutboundUrl,
  catalogWebsiteRel,
  cleanCatalogWebsiteUrl,
} from "./catalog-links";

describe("catalog website links", () => {
  it("adds Ordalin attribution to an official website URL", () => {
    expect(catalogWebsiteOutboundUrl("https://example.com/product")).toBe(
      "https://example.com/product?utm_source=ordalin",
    );
  });

  it("preserves product parameters and fragments while replacing prior attribution", () => {
    expect(
      catalogWebsiteOutboundUrl(
        "https://example.com/product?plan=pro&utm_source=toolify#pricing",
      ),
    ).toBe("https://example.com/product?plan=pro&utm_source=ordalin#pricing");
  });

  it("removes discovery attribution before storage and crawling", () => {
    expect(
      cleanCatalogWebsiteUrl(
        "https://example.com/product?plan=pro&utm_source=toolify&ref=producthunt#pricing",
      ).href,
    ).toBe("https://example.com/product?plan=pro");
  });

  it("marks public submissions as user-generated links", () => {
    expect(catalogWebsiteRel("submission")).toBe("noopener ugc");
    expect(catalogWebsiteRel("toolify")).toBe("noopener");
    expect(catalogWebsiteRel(null)).toBe("noopener");
  });
});
