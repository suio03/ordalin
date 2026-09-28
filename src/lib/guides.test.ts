import { formatGuideDate, parseGuideMetadata } from "./guides";

describe("guide metadata", () => {
  it("accepts a complete published guide", () => {
    expect(
      parseGuideMetadata("choose-a-transcription-tool", {
        title: "How to choose an AI transcription tool",
        description: "A factual guide to the tradeoffs that matter.",
        author: "Ordalin",
        publishedAt: "2026-08-26",
        status: "published",
        topics: ["Audio", "Audio"],
        relatedLinks: [{ href: "/categories/voice-speech", label: "Voice & Speech" }],
      }),
    ).toMatchObject({
      slug: "choose-a-transcription-tool",
      topics: ["Audio"],
    });
  });

  it("rejects invalid dates and external related links", () => {
    expect(() =>
      parseGuideMetadata("guide", {
        title: "Guide",
        description: "Description",
        author: "Ordalin",
        publishedAt: "26-08-2026",
        status: "published",
      }),
    ).toThrow("publishedAt must use YYYY-MM-DD");

    expect(() =>
      parseGuideMetadata("guide", {
        title: "Guide",
        description: "Description",
        author: "Ordalin",
        publishedAt: "2026-08-26",
        status: "published",
        relatedLinks: [{ href: "https://example.com", label: "Example" }],
      }),
    ).toThrow("related links must use internal paths");
  });

  it("formats editorial dates in UTC", () => {
    expect(formatGuideDate("2026-08-26")).toBe("26 August 2026");
  });
});
