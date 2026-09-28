const TRACKING_PARAMETER = /^(?:utm_|ref$|referrer$|source$|via$|affiliate$|aff$)/i;

export function cleanCatalogWebsiteUrl(input: string | URL) {
  const url = new URL(input instanceof URL ? input.href : input);
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMETER.test(key)) url.searchParams.delete(key);
  }
  url.hash = "";
  return url;
}

export function catalogWebsiteOutboundUrl(input: string) {
  const url = new URL(input);
  url.searchParams.set("utm_source", "ordalin");
  return url.href;
}

export function catalogWebsiteRel(sourceProvider: string | null) {
  return sourceProvider === "submission" ? "noopener ugc" : "noopener";
}
