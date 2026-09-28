import { parseCatalogueSort, parsePage, toFtsQuery, toolMark } from "./catalog";

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
});
