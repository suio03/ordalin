import type { SourceProvider } from "../../domain/catalog";
import type { CatalogAnalysis, CatalogTaxonomy } from "../catalog-analysis/contract";
import type { CatalogEnrichmentCandidate } from "../catalog-enrichment/contract";

export type DirectoryProvider = Extract<SourceProvider, "product_hunt" | "toolify">;
/** Directory discovery, or an operator-supplied official URL (`manual`). */
export type ImportProvider = DirectoryProvider | Extract<SourceProvider, "manual">;

export type DiscoveredCatalogUrl = {
  provider: ImportProvider;
  externalId: string;
  discoveryUrl: string;
  websiteUrl: string;
};
export type CatalogImportBundle = DiscoveredCatalogUrl & {
  schemaVersion: 1;
  preparedAt: string;
  candidate: CatalogEnrichmentCandidate;
  analysis: CatalogAnalysis | null;
  /** Duplicate identity (`catalogIdentityKey`); absent means the bare canonical domain. Set to domain + path for one model page of a multi-model vendor. */
  canonicalKey?: string;
  /** Crawl failures the operator checked in a browser: added as evidence, or recorded as holding no official content. */
  browserEvidence?: Array<{ requestedUrl: string; url: string; resolvedWarning: string; unavailableReason: string | null; capturedAt: string }>;
};

export type CatalogImportManifest = {
  schemaVersion: 1;
  preparedAt: string;
  limit: number;
  taxonomy: CatalogTaxonomy;
  files: string[];
  discovery: {
    fetched: number;
    duplicates: number;
    failed: number;
    prepared: number;
  };
};
