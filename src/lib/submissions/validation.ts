import { pricingModels, type PricingModel } from "@/domain/catalog";
import { assertPublicHttpsUrl } from "@/lib/catalog-enrichment/url-policy";
import { cleanCatalogWebsiteUrl } from "@/lib/catalog-links";
import { SubmissionError } from "./http";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

function textField(value: FormDataEntryValue | null, label: string, min: number, max: number) {
  const normalized = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  if (normalized.length < min || normalized.length > max || CONTROL_CHARACTERS.test(normalized)) {
    throw new SubmissionError(`${label} must be between ${min} and ${max} characters.`, 400, "invalid_field", { field: label });
  }
  return normalized;
}

function slugList(value: FormDataEntryValue | null, label: string, max: number) {
  try {
    const parsed: unknown = JSON.parse(typeof value === "string" ? value : "[]");
    if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > max || parsed.some((item) => typeof item !== "string" || !/^[a-z0-9-]+$/.test(item))) {
      throw new Error();
    }
    return [...new Set(parsed as string[])];
  } catch {
    throw new SubmissionError(`${label} selection is invalid.`, 400, "invalid_field", { field: label });
  }
}

// Accept a bare domain such as "pixfy.io" and upgrade http:// to https://.
export function websiteInputUrl(input: string) {
  const trimmed = input.trim();
  if (/^http:\/\//i.test(trimmed)) return `https://${trimmed.slice(7)}`;
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function canonicalWebsite(input: string) {
  try {
    const url = cleanCatalogWebsiteUrl(assertPublicHttpsUrl(websiteInputUrl(input)));
    if (!url.hostname.includes(".")) throw new Error("Website needs a full domain");
    return {
      url,
      canonicalDomain: url.hostname.toLowerCase().replace(/^www\./, ""),
    };
  } catch {
    throw new SubmissionError(
      "Enter a public product website, like your-product.com.",
      400,
      "invalid_website",
    );
  }
}

export function parsePublishedSubmission(form: FormData) {
  const email = textField(form.get("contactEmail"), "Contact email", 5, 254).toLowerCase();
  if (!EMAIL_PATTERN.test(email)) throw new SubmissionError("Enter a valid contact email.", 400, "invalid_field", { field: "Contact email" });
  const pricingModel = String(form.get("pricingModel") ?? "");
  if (!pricingModels.includes(pricingModel as PricingModel)) {
    throw new SubmissionError("Choose a valid pricing model.", 400, "invalid_field", { field: "Pricing" });
  }
  const categorySlugs = slugList(form.get("categorySlugs"), "Category groups", 4);
  const primaryCategorySlug = String(form.get("primaryCategorySlug") ?? "");
  if (!categorySlugs.includes(primaryCategorySlug)) {
    throw new SubmissionError("The primary category must be selected.", 400, "invalid_field", { field: "Primary category" });
  }

  let tagSlugs: string[] = [];
  try {
    const parsed: unknown = JSON.parse(String(form.get("tagSlugs") ?? "[]"));
    if (!Array.isArray(parsed) || parsed.length > 8 || parsed.some((item) => typeof item !== "string" || !/^[a-z0-9-]+$/.test(item))) throw new Error();
    tagSlugs = [...new Set(parsed as string[])];
  } catch {
    throw new SubmissionError("Attributes selection is invalid.", 400, "invalid_field", { field: "Attributes" });
  }

  return {
    draftId: textField(form.get("draftId"), "Draft", 10, 80),
    name: textField(form.get("name"), "Name", 2, 80),
    tagline: textField(form.get("tagline"), "Short description", 20, 180),
    description: textField(form.get("description"), "Detailed description", 60, 1_200),
    contactEmail: email,
    pricingModel: pricingModel as PricingModel,
    primaryCategorySlug,
    categorySlugs,
    tagSlugs,
    turnstileToken: textField(form.get("turnstileToken"), "Verification", 5, 2_048),
  };
}

export function createToolSlug(name: string, domain: string) {
  const normalize = (value: string) =>
    value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 64);
  return normalize(name) || normalize(domain) || `tool-${crypto.randomUUID().slice(0, 8)}`;
}
