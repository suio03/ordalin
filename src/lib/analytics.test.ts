import { GA_MEASUREMENT_ID, installAnalytics } from "./analytics";

function browserFor(hostname: string) {
  const scripts: Array<Record<string, unknown>> = [];
  const browser = {
    location: { hostname },
    document: {
      getElementById: (id: string) => scripts.find(script => script.id === id),
      createElement: () => ({ dataset: {} }),
      head: { appendChild: (script: Record<string, unknown>) => scripts.push(script) },
    },
    dataLayer: [] as unknown[],
  };
  return { browser: browser as unknown as Parameters<typeof installAnalytics>[0], scripts, events: browser.dataLayer };
}

describe("production analytics", () => {
  it("uses the supplied Ordalin stream", () => {
    const { browser, scripts } = browserFor("ordalin.com");
    installAnalytics(browser, GA_MEASUREMENT_ID);
    expect(scripts[1].src).toBe("https://www.googletagmanager.com/gtag/js?id=G-L83JR8ZZRV");
  });
  it.each(["localhost", "127.0.0.1", "ordalin.workers.dev", "preview.ordalin.com", "ordalin.com.example.org"])("does not load or report from %s", hostname => {
    const { browser, scripts, events } = browserFor(hostname);
    installAnalytics(browser, "G-TEST123");
    expect(scripts).toHaveLength(0);
    expect(events).toHaveLength(0);
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
