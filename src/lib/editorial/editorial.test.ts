import { alternativesPages, bestPages, comparePages } from "@/content/editorial";
import { demoEditorialPages } from "@/content/editorial/demo";
import {
  editorialHref,
  editorialIsComplete,
  editorialToolSlugs,
  missingEditorialTools,
  validateEditorialPage,
  type BestPage,
  type EditorialPage,
} from "./index";

const pick = (toolSlug: string) => ({
  toolSlug,
  label: `Best for ${toolSlug}`,
  bestFor: "You want this.",
  notIdealIf: "You want that.",
  summary: ["It is different."],
});

const bestPage: BestPage = {
  kind: "best",
  slug: "note-takers",
  title: "The best AI note takers",
  description: "Three AI note takers compared by who they suit, what they cost and which platforms they run on today.",
  author: "Ordalin",
  publishedAt: "2026-09-01",
  status: "published",
  groupSlug: "productivity",
  intro: ["Intro."],
  faq: [
    { question: "One?", answer: "Yes." },
    { question: "Two?", answer: "Yes." },
    { question: "Three?", answer: "Yes." },
  ],
  criteria: [],
  picks: [pick("a"), pick("b"), pick("c")],
  decisionGuide: [{ situation: "In meetings", toolSlug: "a" }],
  closing: [],
};

describe("editorial content", () => {
  const all: EditorialPage[] = [...bestPages, ...alternativesPages, ...comparePages, ...demoEditorialPages];

  it.each(all.map((page) => [editorialHref(page), page] as const))("%s is valid", (_href, page) => {
    expect(validateEditorialPage(page)).toEqual([]);
  });

  it("has unique paths", () => {
    const paths = all.map(editorialHref);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("keeps demo fixtures as drafts", () => {
    expect(demoEditorialPages.every((page) => page.status === "draft")).toBe(true);
  });
});

describe("validateEditorialPage", () => {
  it("accepts a complete page", () => {
    expect(validateEditorialPage(bestPage)).toEqual([]);
  });

  it("rejects thin pages", () => {
    const errors = validateEditorialPage({
      ...bestPage,
      description: "Too short.",
      faq: [],
      picks: [pick("a"), pick("a")],
      decisionGuide: [{ situation: "Anywhere", toolSlug: "z" }],
    });
    expect(errors.join("\n")).toMatch(/description/);
    expect(errors.join("\n")).toMatch(/FAQ/);
    expect(errors.join("\n")).toMatch(/more than once/);
    expect(errors.join("\n")).toMatch(/at least 3 picks/);
    expect(errors.join("\n")).toMatch(/not a pick/);
  });

  it("requires compare slugs to name both sides", () => {
    const errors = validateEditorialPage({
      ...bestPage,
      kind: "compare",
      slug: "a-versus-b",
      verdict: "A.",
      sides: [{ toolSlug: "a", chooseIf: ["x", "y"] }, { toolSlug: "b", chooseIf: ["x", "y"] }],
      differences: [
        { topic: "1", left: "", right: "" },
        { topic: "2", left: "", right: "" },
        { topic: "3", left: "", right: "" },
        { topic: "4", left: "", right: "" },
      ],
    });
    expect(errors).toEqual(["compare/a-versus-b: slug must be \"<left>-vs-<right>\"."]);
  });
});

describe("publication gate", () => {
  it("withdraws a best-of page when fewer than three picks are published", () => {
    expect(editorialIsComplete(bestPage, new Set(["a", "b", "c"]))).toBe(true);
    expect(editorialIsComplete(bestPage, new Set(["a", "b"]))).toBe(false);
    expect(missingEditorialTools(bestPage, new Set(["a", "b"]))).toEqual(["c"]);
  });

  it("requires the alternatives anchor to be published", () => {
    const page: EditorialPage = { ...bestPage, kind: "alternatives", anchorSlug: "x", whySwitch: ["Price"] };
    expect(editorialToolSlugs(page)).toEqual(["x", "a", "b", "c"]);
    expect(editorialIsComplete(page, new Set(["a", "b", "c"]))).toBe(false);
    expect(editorialIsComplete(page, new Set(["x", "a", "b", "c"]))).toBe(true);
  });

  it("requires both sides of a comparison", () => {
    const page: EditorialPage = {
      ...bestPage,
      kind: "compare",
      slug: "a-vs-b",
      verdict: "A.",
      sides: [{ toolSlug: "a", chooseIf: [] }, { toolSlug: "b", chooseIf: [] }],
      differences: [],
    };
    expect(editorialIsComplete(page, new Set(["a"]))).toBe(false);
    expect(editorialIsComplete(page, new Set(["a", "b"]))).toBe(true);
  });
});
