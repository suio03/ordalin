import { eventForLink, GA_MEASUREMENT_ID, installAnalytics, normalizeSearchQuery, resultBucket } from "./analytics";

function browserFor(hostname: string) {
  const scripts: Array<Record<string, unknown>> = [];
  const browser = {
    location: { hostname, href: `https://${hostname}/` },
    plausible: undefined as unknown,
    document: {
      addEventListener: () => {},
      getElementById: (id: string) => scripts.find(script => script.id === id),
      createElement: () => ({ dataset: {} }),
      head: { appendChild: (script: Record<string, unknown>) => scripts.push(script) },
    },
    dataLayer: [] as unknown[],
  };
  return { browser: browser as unknown as Parameters<typeof installAnalytics>[0], scripts, events: browser.dataLayer, raw: browser };
}

describe("production analytics", () => {
  it("uses the supplied Ordalin stream", () => {
    const { browser, scripts } = browserFor("ordalin.com");
    installAnalytics(browser, GA_MEASUREMENT_ID);
    expect(scripts[1].src).toBe("https://www.googletagmanager.com/gtag/js?id=G-L83JR8ZZRV");
  });
  it.each(["localhost", "127.0.0.1", "ordalin.workers.dev", "preview.ordalin.com", "ordalin.com.example.org"])("does not load or report from %s", hostname => {
    const { browser, scripts, events, raw } = browserFor(hostname);
    installAnalytics(browser, "G-TEST123");
    expect(scripts).toHaveLength(0);
    expect(events).toHaveLength(0);
    expect(raw.plausible).toBeUndefined();
  });
  it.each(["ordalin.com", "www.ordalin.com"])("initializes each tracker only once on %s", hostname => {
    const { browser, scripts, events } = browserFor(hostname);
    installAnalytics(browser, "G-TEST123");
    installAnalytics(browser, "G-TEST123");
    expect(scripts).toHaveLength(2);
    expect(scripts[0].dataset).toEqual({ domain: "ordalin.com" });
    expect(scripts[1].src).toBe("https://www.googletagmanager.com/gtag/js?id=G-TEST123");
    expect(events.map(event => Array.from(event as ArrayLike<unknown>)[0])).toEqual(["js", "config"]);
  });
  it("keeps Plausible independent when GA4 is unconfigured", () => {
    const { browser, scripts, events } = browserFor("ordalin.com");
    installAnalytics(browser);
    installAnalytics(browser, "invalid-id");
    expect(scripts).toHaveLength(1);
    expect(events).toHaveLength(0);
  });
});

describe("Plausible custom events", () => {
  const page = new URL("https://ordalin.com/tasks/meeting-notes");

  it("queues events until the Plausible script loads", () => {
    const { browser, raw } = browserFor("ordalin.com");
    installAnalytics(browser);
    const plausible = raw.plausible as ((name: string, options?: unknown) => void) & { q?: unknown[] };
    plausible("Search", { props: { query: "notes" } });
    expect(plausible.q).toEqual([["Search", { props: { query: "notes" } }]]);
  });

  it("tags official-site links as outbound clicks", () => {
    expect(eventForLink("https://www.granola.ai/?utm_source=ordalin", { tool: "granola", placement: "task" }, page))
      .toEqual({ name: "Outbound Click", props: { tool: "granola", placement: "task" } });
    expect(eventForLink("https://www.granola.ai/?utm_source=ordalin", {}, page))
      .toEqual({ name: "Outbound Click", props: { tool: "granola.ai", placement: "tasks" } });
  });

  it("ignores external links without Ordalin attribution", () => {
    expect(eventForLink("https://github.com/suio03/ordalin", {}, page)).toBeNull();
  });

  it("tracks progression to a tool profile", () => {
    expect(eventForLink("/tools/granola", {}, new URL("https://ordalin.com/tools?q=notes")))
      .toEqual({ name: "Tool Open", props: { tool: "granola", from: "tools", search: "yes" } });
    expect(eventForLink("/tools/granola", {}, new URL("https://ordalin.com/")))
      .toEqual({ name: "Tool Open", props: { tool: "granola", from: "home", search: "no" } });
  });

  it("ignores other internal links and self-links", () => {
    expect(eventForLink("/tools", {}, page)).toBeNull();
    expect(eventForLink("/tasks/meeting-notes", {}, page)).toBeNull();
    expect(eventForLink("/tools/granola", {}, new URL("https://ordalin.com/tools/granola"))).toBeNull();
  });

  it("normalizes queries and buckets result counts", () => {
    expect(normalizeSearchQuery("  Meeting   NOTES ")).toBe("meeting notes");
    expect(normalizeSearchQuery("x".repeat(150))).toHaveLength(100);
    expect([0, 1, 5, 6, 20, 21].map(resultBucket)).toEqual(["0", "1-5", "1-5", "6-20", "6-20", "21+"]);
  });
});
