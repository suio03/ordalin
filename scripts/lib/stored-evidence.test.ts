import { describe, expect, it } from "vitest";
import type { CatalogEnrichmentCandidate } from "../../src/lib/catalog-enrichment/contract.ts";
import { assertStatementFits, storedCandidate } from "./stored-evidence.ts";

const page = (url: string, excerpt: string) => ({ url, role: "features" as const, title: null, description: null, headings: [], excerpt });

describe("storedCandidate", () => {
  const candidate = {
    evidencePages: [
      page("https://example.com/", `Example writes release notes from your commits. ${"a".repeat(5_000)}`),
      page("https://example.com/blog", "b".repeat(5_000)),
    ],
  } as unknown as CatalogEnrichmentCandidate;
  const analysis = {
    evidence: { identity: ["https://example.com/"] },
    profile: { overview: { text: "x", evidence: [{ url: "https://example.com/", quote: "Example writes release notes from your commits." }] } },
  };

  it("keeps cited pages whole and trims uncited ones", () => {
    const stored = storedCandidate(candidate, analysis);
    expect(stored.evidencePages[0].excerpt).toBe(candidate.evidencePages[0].excerpt);
    expect(stored.evidencePages[1].excerpt).toHaveLength(1_000);
  });

  it("rejects statements D1 would refuse", () => {
    expect(() => assertStatementFits("x".repeat(100_001), "row")).toThrow(/100000/);
    expect(assertStatementFits("ok", "row")).toBe("ok");
  });
});
