import { parseCatalogueSort, parsePage, toFtsQuery, toolMark, toolPageTitle } from "./catalog";

describe("catalogue presentation helpers", () => {
  it("defaults catalogue sorting to newest and accepts oldest", () => {
    expect(parseCatalogueSort(undefined)).toBe("newest");
    expect(parseCatalogueSort("newest")).toBe("newest");
    expect(parseCatalogueSort("oldest")).toBe("oldest");
    expect(parseCatalogueSort("unsupported")).toBe("newest");
  });

  it("normalizes unsafe or invalid page values", () => {
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("two")).toBe(1);
    expect(parsePage("3")).toBe(3);
  });

  it("turns free text into a bounded FTS prefix query", () => {
    expect(toFtsQuery("  Video + voice! ")).toBe('"video"* AND "voice"*');
    expect(toFtsQuery("***")).toBe("");
  });

  it("creates deterministic two-character fallback marks", () => {
    expect(toolMark("Zen Whisper")).toBe("ZW");
    expect(toolMark("Playyy")).toBe("PL");
    expect(toolMark("--")).toBe("AI");
  });

  it("titles tool pages by their main use in the primary category", () => {
    const tag = (name: string, groupSlug: string | null, kind = "category") => ({ kind, name, groupSlug });
    const tool = (tagDetails: ReturnType<typeof tag>[]) => ({ name: "AdAnt", primaryCategory: { slug: "video", name: "Video & Animation" }, tagDetails });
    expect(toolPageTitle(tool([tag("Social media", "marketing"), tag("Video generation", "video"), tag("Ad creative", "marketing")])))
      .toBe("AdAnt — AI Video Generation");
    expect(toolPageTitle(tool([tag("DevOps and monitoring", "coding"), tag("Web", null, "interface")])))
      .toBe("AdAnt — AI DevOps and Monitoring");
    expect(toolPageTitle(tool([tag("SEO", "marketing")]))).toBe("AdAnt — AI SEO");
    expect(toolPageTitle(tool([]))).toBe("AdAnt — AI Video & Animation");
  });
});
