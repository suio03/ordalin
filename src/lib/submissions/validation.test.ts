import { SubmissionError } from "./http";
import { canonicalWebsite, createToolSlug, parsePublishedSubmission } from "./validation";

function validForm() {
  const form = new FormData();
  form.set("draftId", "draft-123456789");
  form.set("name", "Voice Studio");
  form.set("tagline", "Create clear narration from a browser workspace.");
  form.set(
    "description",
    "Voice Studio turns written scripts into narration and lets teams organize the resulting audio in a shared browser workspace.",
  );
  form.set("contactEmail", "OWNER@EXAMPLE.COM");
  form.set("pricingModel", "freemium");
  form.set("primaryCategorySlug", "audio");
  form.set("categorySlugs", JSON.stringify(["audio", "productivity"]));
  form.set("tagSlugs", JSON.stringify(["web-app", "free-plan"]));
  form.set("turnstileToken", "verified-token");
  return form;
}

describe("submission validation", () => {
  it("normalizes a public product website", () => {
    const result = canonicalWebsite(
      "https://www.Example.com/product?plan=pro&utm_source=elsewhere&ref=listing#demo",
    );
    expect(result).toMatchObject({
      canonicalDomain: "example.com",
    });
    expect(result.url.href).toBe("https://www.example.com/product?plan=pro");
  });

  it("accepts a bare domain and upgrades http", () => {
    expect(canonicalWebsite("pixfy.io").url.href).toBe("https://pixfy.io/");
    expect(canonicalWebsite(" http://www.pixfy.io/app ").url.href).toBe("https://www.pixfy.io/app");
    expect(() => canonicalWebsite("pixfy")).toThrow(SubmissionError);
    expect(() => canonicalWebsite("ftp://pixfy.io")).toThrow(SubmissionError);
  });

  it("returns a client-facing error for unsafe websites", () => {
    expect(() => canonicalWebsite("https://127.0.0.1/admin")).toThrow(SubmissionError);
  });

  it("accepts and normalizes confirmed fields", () => {
    const result = parsePublishedSubmission(validForm());
    expect(result.contactEmail).toBe("owner@example.com");
    expect(result.categorySlugs).toEqual(["audio", "productivity"]);
  });

  it("requires the primary category in the selected set", () => {
    const form = validForm();
    form.set("primaryCategorySlug", "writing");
    expect(() => parsePublishedSubmission(form)).toThrow(
      "The primary category must be selected.",
    );
  });

  it("creates stable URL-safe slugs", () => {
    expect(createToolSlug("Crème Voice AI", "example.com")).toBe("creme-voice-ai");
  });
});
