export const GA_MEASUREMENT_ID = "G-L83JR8ZZRV";
export const PLAUSIBLE_DOMAIN = "ordalin.com";
export const PLAUSIBLE_SCRIPT = "https://actone.app/js/script.js";

export function isProductionAnalyticsHost(hostname: string) {
  return hostname === "ordalin.com" || hostname === "www.ordalin.com";
}

export function validGaMeasurementId(value: string | undefined) {
  return value && /^G-[A-Z0-9]+$/.test(value) ? value : null;
}

type EventProps = Record<string, string>;
type PlausibleOptions = { props?: EventProps; callback?: () => void };
type Plausible = ((event: string, options?: PlausibleOptions) => void) & { q?: unknown[] };

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  plausible?: Plausible;
};

export type TrackedEvent = { name: string; props: EventProps };

// Custom events go to Plausible only. `window.plausible` exists only on the
// production hosts (installAnalytics creates its queue), so this is a no-op elsewhere.
export function trackEvent(name: string, props?: EventProps, callback?: () => void) {
  const plausible = typeof window === "undefined" ? undefined : (window as AnalyticsWindow).plausible;
  if (!plausible) {
    callback?.();
    return;
  }
  plausible(name, { props, callback });
}

export function normalizeSearchQuery(query: string) {
  return query.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 100);
}

export function resultBucket(total: number) {
  if (total <= 0) return "0";
  if (total <= 5) return "1-5";
  if (total <= 20) return "6-20";
  return "21+";
}

function pageSection(pathname: string) {
  return pathname.split("/")[1] || "home";
}

// Maps a clicked link to the event it represents, or null for untracked links.
// Official-site links are recognised by the `utm_source=ordalin` tag that every
// visitor-facing outbound link carries; `data-tool` / `data-placement` add context.
export function eventForLink(
  href: string,
  dataset: { tool?: string; placement?: string },
  current: URL,
): TrackedEvent | null {
  let url: URL;
  try {
    url = new URL(href, current);
  } catch {
    return null;
  }
  if (url.origin !== current.origin) {
    if (url.searchParams.get("utm_source") !== "ordalin") return null;
    return {
      name: "Outbound Click",
      props: {
        tool: dataset.tool || url.hostname.replace(/^www\./, ""),
        placement: dataset.placement || pageSection(current.pathname),
      },
    };
  }
  const tool = /^\/tools\/([^/]+)\/?$/.exec(url.pathname)?.[1];
  if (!tool || url.pathname === current.pathname) return null;
  return {
    name: "Tool Open",
    props: {
      tool,
      from: pageSection(current.pathname),
      search: current.searchParams.get("q")?.trim() ? "yes" : "no",
    },
  };
}

function installClickTracking(browser: AnalyticsWindow) {
  browser.document.addEventListener("click", (event) => {
    const anchor = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!anchor) return;
    const tracked = eventForLink(anchor.href, anchor.dataset, new URL(browser.location.href));
    if (!tracked) return;
    const sameTabExit = tracked.name === "Outbound Click"
      && !event.defaultPrevented && event.button === 0
      && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
      && (!anchor.target || anchor.target === "_self");
    if (!sameTabExit) {
      trackEvent(tracked.name, tracked.props);
      return;
    }
    // Plausible sends with XHR, which an immediate same-tab navigation cancels.
    event.preventDefault();
    let left = false;
    const leave = () => {
      if (left) return;
      left = true;
      browser.location.assign(anchor.href);
    };
    trackEvent(tracked.name, tracked.props, leave);
    browser.setTimeout(leave, 1000);
  });
}

// Loaded once from the root layout. Both trackers handle History API navigation;
// do not add a second usePathname-based pageview sender.
export function installAnalytics(browser: AnalyticsWindow, measurementId?: string) {
  if (!isProductionAnalyticsHost(browser.location.hostname)) return;
  const document = browser.document;
  if (!document.getElementById("ordalin-plausible")) {
    // Plausible's documented command queue; the script replays it once loaded.
    const queue: Plausible = (...args) => { (queue.q = queue.q || []).push(args); };
    browser.plausible = browser.plausible || queue;
    installClickTracking(browser);
    const script = document.createElement("script");
    script.id = "ordalin-plausible";
    script.defer = true;
    script.dataset.domain = PLAUSIBLE_DOMAIN;
    script.src = PLAUSIBLE_SCRIPT;
    document.head.appendChild(script);
  }

  const gaId = validGaMeasurementId(measurementId);
  if (!gaId || document.getElementById("ordalin-ga4")) return;
  browser.dataLayer = browser.dataLayer || [];
  browser.gtag = browser.gtag || function () {
    // Preserve Google's documented gtag command queue format.
    // eslint-disable-next-line prefer-rest-params
    browser.dataLayer!.push(arguments);
  };
  browser.gtag("js", new Date());
  browser.gtag("config", gaId);
  const script = document.createElement("script");
  script.id = "ordalin-ga4";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);
}
