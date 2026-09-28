import type { CatalogEnrichmentCandidate } from "../catalog-enrichment/contract.ts";

export type ProfileEvidence = { url: string; quote: string };
export type ProfileClaim = { text: string; evidence: ProfileEvidence[] };
export type ProfileFeature = ProfileClaim & { title: string };
export type ProfilePlan = { name: string; price: string; cadence: string; detail: string; evidence: ProfileEvidence[] };
export const optionalSections = ["platforms", "billingNotes", "freeLimits", "limitations"] as const;
export type ProfileSection = typeof optionalSections[number];
export type ResearchedProfile = {
  schemaVersion: 1;
  overview: ProfileClaim;
  pricingSummary: ProfileClaim;
  platforms: ProfileClaim[];
  features: ProfileFeature[];
  plans: ProfilePlan[];
  billingNotes: ProfileClaim[];
  freeLimits: ProfileClaim[];
  useCases: ProfileClaim[];
  limitations: ProfileFeature[];
  // Only record an evidence gap after checking the relevant official pages.
  unverified: ProfileSection[];
};
export type CheckedProfile = ResearchedProfile & { checkedAt: string };
const object = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const normalize = (value: string) => value.replace(/\s+/g, " ").trim();

/** Validate every claim against a fetched page, rather than trusting a URL alone. */
export function checkResearchedProfile(value: unknown, candidate: CatalogEnrichmentCandidate): { profile: CheckedProfile | null; reasons: string[] } {
  const record = object(value);
  if (record.schemaVersion !== 1) return { profile: null, reasons: ["A Granola-standard researched profile is required before publication."] };
  const reasons: string[] = [];
  const pages = new Map(candidate.evidencePages.map(page => [page.url, normalize([page.title, page.description, ...page.headings, page.excerpt].join(" "))]));
  const text = (value: unknown, label: string, max = 1200) => {
    if (typeof value !== "string" || !value.trim() || value.length > max) { reasons.push(`Profile ${label} is missing or exceeds ${max} characters.`); return ""; }
    return normalize(value);
  };
  function evidence(value: unknown, label: string): ProfileEvidence[] {
    if (!Array.isArray(value) || !value.length || value.length > 6) { reasons.push(`Profile ${label} needs 1–6 supporting official-page quotes.`); return []; }
    return value.map(item => {
      const ref = object(item);
      const url = typeof ref.url === "string" ? ref.url : "";
      const quote = typeof ref.quote === "string" ? normalize(ref.quote) : "";
      if (quote.length < 12 || quote.length > 1200 || !pages.get(url)?.includes(quote)) reasons.push(`Profile ${label} has an unsupported quote or unfetched URL.`);
      return { url, quote };
    });
  }
  function claim(value: unknown, label: string): ProfileClaim {
    const item = object(value);
    return { text: text(item.text, label), evidence: evidence(item.evidence, label) };
  }
  function list<T>(key: string, min: number, parse: (value: unknown, label: string) => T): T[] {
    const items = record[key];
    if (!Array.isArray(items) || items.length < min || items.length > 12) { reasons.push(`Profile ${key} requires ${min}–12 items.`); return []; }
    return items.map((item, index) => parse(item, `${key}[${index}]`));
  }
  const feature = (value: unknown, label: string): ProfileFeature => ({ ...claim(value, label), title: text(object(value).title, `${label}.title`, 120) });
  const profile: CheckedProfile = {
    schemaVersion: 1,
    checkedAt: candidate.fetchedAt,
    overview: claim(record.overview, "overview"),
    pricingSummary: claim(record.pricingSummary, "pricingSummary"),
    platforms: list("platforms", 0, claim),
    features: list("features", 3, feature),
    plans: list("plans", 1, (value, label) => {
      const item = object(value);
      return { name: text(item.name, `${label}.name`, 120), price: text(item.price, `${label}.price`, 120), cadence: text(item.cadence, `${label}.cadence`, 240), detail: text(item.detail, `${label}.detail`), evidence: evidence(item.evidence, label) };
    }),
    billingNotes: list("billingNotes", 0, claim),
    freeLimits: list("freeLimits", 0, claim),
    useCases: list("useCases", 1, claim),
    limitations: list("limitations", 0, feature),
    unverified: [],
  };
  if (!Array.isArray(record.unverified) || record.unverified.some(key => !optionalSections.includes(key as ProfileSection))) reasons.push("Profile unverified sections are invalid.");
  else profile.unverified = [...new Set(record.unverified)] as ProfileSection[];
  for (const key of optionalSections) {
    if ((!profile[key].length) !== profile.unverified.includes(key)) reasons.push(`Profile ${key} must contain evidence-backed facts or be explicitly marked unverified, never both.`);
  }
  if (!Number.isFinite(Date.parse(candidate.fetchedAt))) reasons.push("Profile evidence check date is invalid.");
  for (const key of ["features", "plans", "useCases"] as const) {
    const items = profile[key].map(item => "text" in item ? item.text.toLowerCase() : item.name.toLowerCase());
    if (new Set(items).size !== items.length) reasons.push(`Profile ${key} contains duplicate items.`);
  }
  return { profile: reasons.length ? null : profile, reasons: [...new Set(reasons)] };
}

export function readResearchedProfile(raw: string | null): CheckedProfile | null {
  try {
    const bundle = JSON.parse(raw ?? "{}");
    if (!bundle.candidate || !bundle.analysis?.profile) return null;
    return checkResearchedProfile(bundle.analysis.profile, bundle.candidate).profile;
  } catch { return null; }
}
