import type { CatalogEnrichmentCandidate } from "@/lib/catalog-enrichment/contract";
import type { CatalogAnalysis } from "@/lib/catalog-analysis/contract";
import { SubmissionError } from "./http";

export const detailFields = ["features", "pricingDetails", "useCases"] as const;
export type DetailField = typeof detailFields[number];
export const detailLabels: Record<DetailField, string> = {
  features: "Features", pricingDetails: "Pricing & free limits", useCases: "Use cases",
};
export type ExtractedDetail = { text: string; sourceUrl: string };
export type ExtractedDetails = Record<DetailField, ExtractedDetail>;
export type ConfirmedField = { text: string; origin: "website" | "submitter"; sources: string[]; checkedAt: string | null };
export type ConfirmedProfile = {
  schemaVersion: 1;
  fields: Record<string, ConfirmedField>;
  screenshot: "captured" | "uploaded" | "none";
};
export const emptyDetails = (): ExtractedDetails => Object.fromEntries(detailFields.map(key => [key, { text: "", sourceUrl: "" }])) as ExtractedDetails;
const normalize = (value: string) => value.replace(/\s+/g, " ").trim();

// Numbers as written on a page or in AI prose: "US$ 12.50" -> "12.5", "1,000" -> "1000".
function numbers(value: string) {
  return new Set([...value.normalize("NFKC").matchAll(/\d[\d,]*(?:\.\d+)?/g)]
    .map(([match]) => match.replace(/,/g, "").replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "")));
}

// The AI rewrites messy page text into clean prose, so wording is not compared.
// Every section must cite a fetched page, and every number it states (prices,
// credits, limits) must appear somewhere on the fetched site; a features list
// often cites the homepage but repeats limits from the pricing page.
export function supportedDetails(value: unknown, candidate: CatalogEnrichmentCandidate): ExtractedDetails {
  const result = emptyDetails();
  if (!value || typeof value !== "object") return result;
  const siteNumbers = numbers(candidate.evidencePages.flatMap(page => [page.title, page.description, ...page.headings, page.excerpt]).join(" "));
  for (const key of detailFields) {
    const item = (value as Record<string, ExtractedDetail>)[key];
    if (!item || typeof item.text !== "string" || typeof item.sourceUrl !== "string") continue;
    const text = item.text.trim().slice(0, 1200);
    const page = candidate.evidencePages.find(page => page.url === item.sourceUrl);
    if (!text || !page) continue;
    const unsupported = [...numbers(text)].filter(number => !siteNumbers.has(number));
    if (!unsupported.length) result[key] = { text, sourceUrl: page.url };
    else console.warn("Dropped a generated submission detail with numbers absent from the site", { section: key, unsupported });
  }
  return result;
}

export function readDetailFields(form: FormData): Record<DetailField, string> {
  return Object.fromEntries(detailFields.map(key => {
    const value = form.get(key);
    if (value !== null && typeof value !== "string") throw new SubmissionError("Invalid profile content.", 400, "invalid_field");
    const text = (value ?? "").trim();
    if (text.length > 1200 || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(text)) throw new SubmissionError(`${detailLabels[key]} must be no longer than 1200 characters.`, 400, "invalid_field");
    return [key, text];
  })) as Record<DetailField, string>;
}

export function confirmProfile(candidate: CatalogEnrichmentCandidate, analysis: CatalogAnalysis, input: Record<string, unknown>, details: Record<DetailField, string>, screenshot: ConfirmedProfile["screenshot"]): ConfirmedProfile {
  const fields: Record<string, ConfirmedField> = {};
  const allowed = new Set(candidate.evidencePages.map(page => page.url));
  function confirm(key: string, text: string, original: string, urls: string[]) {
    const sources = urls.filter(url => allowed.has(url));
    const fromWebsite = Boolean(text && normalize(text) === normalize(original) && sources.length);
    fields[key] = { text, origin: fromWebsite ? "website" : "submitter", sources: fromWebsite ? sources : [], checkedAt: fromWebsite ? candidate.fetchedAt : null };
  }
  for (const key of ["name", "tagline", "description", "pricingModel"] as const) {
    confirm(key, String(input[key] ?? ""), analysis[key], analysis.evidence[key === "description" ? "description" : key === "pricingModel" ? "pricing" : "identity"]);
  }
  const extracted = supportedDetails(analysis.details, candidate);
  for (const key of detailFields) confirm(key, details[key], extracted[key].text, [extracted[key].sourceUrl]);
  return { schemaVersion: 1, fields, screenshot };
}

export function readConfirmedProfile(raw: string | null): ConfirmedProfile | null {
  try {
    const profile = JSON.parse(raw ?? "{}").confirmed as ConfirmedProfile;
    return profile?.schemaVersion === 1 && profile.fields ? profile : null;
  } catch { return null; }
}
