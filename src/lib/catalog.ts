import type { PricingModel } from "@/domain/catalog";

export const cataloguePageSize = 12;
export const indexableCategoryMinimum = 15;

export type CatalogueSort = "newest" | "oldest";

export const pricingLabels: Record<PricingModel, string> = {
  free: "Free",
  freemium: "Free plan",
  paid: "Paid",
  free_trial: "Free trial",
  contact_sales: "Contact sales",
  unknown: "Pricing unverified",
};

export function parsePage(value: string | string[] | undefined) {
  const firstValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(firstValue ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function parseCatalogueSort(value: string | string[] | undefined): CatalogueSort {
  const firstValue = Array.isArray(value) ? value[0] : value;
  return firstValue === "oldest" ? "oldest" : "newest";
}

export function toFtsQuery(value: string) {
  const terms = value.toLocaleLowerCase("en").match(/[\p{L}\p{N}]+/gu) ?? [];
  return terms.slice(0, 8).map((term) => `"${term.replaceAll('"', '""')}"*`).join(" AND ");
}

export function toolMark(name: string) {
  const words = name.match(/[\p{L}\p{N}]+/gu) ?? [];
  const [firstWord = "", secondWord = ""] = words;
  if (words.length === 0) return "AI";
  if (words.length === 1) return firstWord.slice(0, 2).toLocaleUpperCase("en");
  return `${firstWord.charAt(0)}${secondWord.charAt(0)}`.toLocaleUpperCase("en");
}

export function formatCheckedDate(timestamp: number | null) {
  if (!timestamp) return "Check pending";
  return `Checked ${new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(timestamp * 1000))}`;
}

export function formatPricingModel(value: string) {
  return pricingLabels[value as PricingModel] ?? pricingLabels.unknown;
}
