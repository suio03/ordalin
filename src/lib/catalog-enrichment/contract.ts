export type CandidatePricingModel =
  | "free"
  | "freemium"
  | "paid"
  | "free_trial"
  | "contact_sales"
  | "unknown";

export type CandidateValue<T> = {
  value: T;
  sourceUrl: string;
  evidence?: string;
};

export type AssetCandidate = CandidateValue<string> & {
  kind: "logo" | "icon" | "social_preview";
};

export type EnrichmentEvidencePage = {
  url: string;
  role: "homepage" | "pricing" | "features" | "docs" | "security" | "privacy";
  title: string | null;
  description: string | null;
  headings: string[];
  excerpt: string;
};

export type CatalogEnrichmentCandidate = {
  schemaVersion: 1;
  status: "pending_review";
  websiteUrl: string;
  canonicalDomain: string;
  fetchedAt: string;
  identity: {
    name: CandidateValue<string> | null;
    tagline: CandidateValue<string> | null;
  };
  assets: AssetCandidate[];
  pricingSignals: CandidateValue<CandidatePricingModel>[];
  platforms: CandidateValue<string>[];
  officialLinks: Array<CandidateValue<string> & { role: EnrichmentEvidencePage["role"] }>;
  evidencePages: EnrichmentEvidencePage[];
  warnings: string[];
};

export type EnrichmentOptions = {
  research?: boolean;
  fetcher?: typeof fetch;
  fetchedAt?: Date;
  maxPages?: number;
  maxBytesPerPage?: number;
  timeoutMs?: number;
};
