import { checkLlmsTxt } from "./check";
import { parseLlmsTxt, validateLlmsTxt } from "./validate";

const valid = `# Acme

> Acme turns meetings into notes.

Works with Zoom.

## Docs

- [Start](https://acme.com/docs): Set up
- [API](https://acme.com/api)

## Optional

- [Privacy](https://acme.com/privacy)
`;

const statuses = (text: string) => Object.fromEntries(validateLlmsTxt(text).map((check) => [check.id, check.status]));

describe("validateLlmsTxt", () => {
  it("passes a file in the llmstxt.org format", () => {
    expect(statuses(valid)).toEqual({ h1: "pass", summary: "pass", sections: "pass", links: "pass", optional: "info" });
    const parsed = parseLlmsTxt(valid);
    expect(parsed.sections.map((section) => [section.title, section.links.length])).toEqual([["Docs", 2], ["Optional", 1]]);
    expect(parsed.links[0]).toEqual({ name: "Start", url: "https://acme.com/docs", notes: "Set up", section: "Docs", line: 9 });
  });

  it("reports a missing H1, a misplaced summary, H3 sections and bad links", () => {
    const text = `Acme\n\n# Acme\n\nIntro\n\n> Late summary\n\n### Docs\n\n- [A](/a)\n- [B](https://acme.com/b)\n- [B again](https://acme.com/b/)\n- just text\n\n## Empty\n`;
    const checks = validateLlmsTxt(text);
    expect(Object.fromEntries(checks.map((check) => [check.id, check.status]))).toEqual({ h1: "fail", summary: "warn", sections: "pass", links: "warn", optional: "info" });
    expect(checks.find((check) => check.id === "sections")?.evidence).toEqual(["Line 16: “## Empty” has no links", "Line 9: “### Docs”"]);
    expect(checks.find((check) => check.id === "links")?.summary).toBe("3 links; 1 link is not a full URL, 1 link is listed twice.");
    const plain = validateLlmsTxt("# Acme\n\n## Docs\n\n- [A](/a)\n- just text\n").find((check) => check.id === "links");
    expect(plain?.summary).toBe("1 link; 1 link is not a full URL, 1 list item is plain text.");
    expect(plain?.evidence).toContain("Line 6: “- just text” is not a link");
  });

  it("ignores code fences and flags list items that are not links", () => {
    const text = "# Acme\n\n> Notes.\n\n## Docs\n\n```\n## Not a section\n```\n- [A](https://acme.com/a)\n- Plain item\n";
    const parsed = parseLlmsTxt(text);
    expect(parsed.sections).toHaveLength(1);
    expect(parsed.malformed).toEqual([{ line: 11, text: "- Plain item" }]);
    expect(statuses("")).toMatchObject({ h1: "fail", summary: "warn", sections: "warn", links: "warn" });
  });
});

describe("checkLlmsTxt", () => {
  const html = { "content-type": "text/html" };
  function fetcherFor(routes: Record<string, () => Response>) {
    return (async (input: RequestInfo | URL) => routes[String(input)]?.() ?? new Response("", { status: 404 })) as typeof fetch;
  }

  it("checks delivery, format and links", async () => {
    const report = await checkLlmsTxt(
      new URL("https://acme.com/"),
      fetcherFor({
        "https://acme.com/llms.txt": () => new Response(valid, { headers: { "content-type": "text/plain; charset=utf-8" } }),
        "https://acme.com/docs": () => new Response("", { headers: html }),
        "https://acme.com/api": () => new Response(null, { status: 301, headers: { location: "/docs/api" } }),
        "https://acme.com/docs/api": () => new Response("", { headers: html }),
      }),
    );
    expect(report.found).toBe(true);
    expect(report.checks.map((check) => [check.id, check.status])).toEqual([
      ["delivery", "pass"],
      ["h1", "pass"],
      ["summary", "pass"],
      ["sections", "pass"],
      ["links", "pass"],
      ["link-status", "fail"],
      ["optional", "info"],
    ]);
    expect(report.checks.find((check) => check.id === "link-status")?.evidence).toEqual([
      "Line 14: https://acme.com/privacy: HTTP 404",
      "Line 10: https://acme.com/api redirects to https://acme.com/docs/api",
    ]);
    expect([report.linksChecked, report.linksTotal]).toEqual([3, 3]);
  });

  it("reports a missing file and an HTML page served as llms.txt", async () => {
    const missing = await checkLlmsTxt(new URL("https://acme.com/"), fetcherFor({}));
    expect(missing.found).toBe(false);
    expect(missing.checks).toHaveLength(1);
    expect(missing.checks[0].summary).toBe("This site has no llms.txt file.");

    const app = await checkLlmsTxt(
      new URL("https://acme.com/"),
      fetcherFor({ "https://acme.com/llms.txt": () => new Response("<!doctype html><html></html>", { headers: html }) }),
    );
    expect(app.found).toBe(false);
    expect(app.checks[0].status).toBe("fail");
    expect(app.checks[0].summary).toMatch(/returns an HTML page/);
  });
});
