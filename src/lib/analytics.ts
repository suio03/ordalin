export const GA_MEASUREMENT_ID = "G-L83JR8ZZRV";
export const PLAUSIBLE_DOMAIN = "ordalin.com";
export const PLAUSIBLE_SCRIPT = "https://actone.app/js/script.js";

export function isProductionAnalyticsHost(hostname: string) {
  return hostname === "ordalin.com" || hostname === "www.ordalin.com";
}

export function validGaMeasurementId(value: string | undefined) {
  return value && /^G-[A-Z0-9]+$/.test(value) ? value : null;
}

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

// Loaded once from the root layout. Both trackers handle History API navigation;
// do not add a second usePathname-based pageview sender.
export function installAnalytics(browser: AnalyticsWindow, measurementId?: string) {
  if (!isProductionAnalyticsHost(browser.location.hostname)) return;
  const document = browser.document;
  if (!document.getElementById("ordalin-plausible")) {
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
