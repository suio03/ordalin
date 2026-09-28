import {
  pricingModels,
  sourceProviders,
  toolStatuses,
  topLevelCategories,
} from "./catalog";

describe("catalog contract", () => {
  it("keeps the approved top-level taxonomy in editorial order", () => {
    expect(topLevelCategories.map(({ name }) => name)).toEqual([
      "Writing & Language",
      "Image & Design",
      "Video & Animation",
      "Voice & Speech",
      "Music & Audio",
      "Coding & Development",
      "Automation & Agents",
      "Productivity",
      "Research & Data",
      "Marketing & Sales",
      "Business & Operations",
      "Education & Learning",
      "Personal & Lifestyle",
      "Other",
    ]);
  });

  it("contains only approved lifecycle and source values", () => {
    expect(toolStatuses).toEqual([
      "imported",
      "pending_review",
      "published",
      "rejected",
      "archived",
    ]);
    expect(sourceProviders).toEqual([
      "product_hunt",
      "toolify",
      "submission",
      "manual",
    ]);
  });

  it("keeps pricing deterministic and free of promotional labels", () => {
    expect(pricingModels).toEqual([
      "free",
      "freemium",
      "paid",
      "free_trial",
      "contact_sales",
      "unknown",
    ]);
  });
});
