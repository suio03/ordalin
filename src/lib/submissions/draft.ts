import type { CatalogAnalysis } from "@/lib/catalog-analysis";
import type { CatalogEnrichmentCandidate } from "@/lib/catalog-enrichment/contract";

export type SubmissionDraftPayload = {
  schemaVersion: 2;
  candidate: CatalogEnrichmentCandidate;
  analysis: CatalogAnalysis;
  screenshotAttempts?: number;
  screenshotHashes?: string[];
};

export function parseSubmissionDraftPayload(value: string): SubmissionDraftPayload {
  const parsed = JSON.parse(value) as SubmissionDraftPayload | CatalogEnrichmentCandidate;
  if ("candidate" in parsed && "analysis" in parsed) return parsed;
  throw new Error("This submission draft uses an unsupported analysis format");
}
