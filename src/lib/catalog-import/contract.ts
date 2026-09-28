import type { SourceProvider } from "../../domain/catalog";
import type { CatalogAnalysis, CatalogTaxonomy } from "../catalog-analysis/contract";
import type { CatalogEnrichmentCandidate } from "../catalog-enrichment/contract";

export type DirectoryProvider = Extract<SourceProvider, "product_hunt" | "toolify">;

export type DiscoveredCatalogUrl = {
  provider: DirectoryProvider;
  externalId: string;
  discoveryUrl: string;
  websiteUrl: string;
};
export type CatalogImportBundle = DiscoveredCatalogUrl & {
  schemaVersion: 1;
  preparedAt: string;
  candidate: CatalogEnrichmentCandidate;
  analysis: CatalogAnalysis | null;
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
