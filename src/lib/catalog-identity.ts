/** Catalogue identity used for duplicate checks: the bare domain for a product site, or domain + path when an operator imports one model page of a multi-model vendor (`bfl.ai/models/flux-3-video`). */
export function catalogDomain(input: string | URL) {
  return new URL(input).hostname.toLowerCase().replace(/^www\./, "");
}

export function catalogIdentityKey(input: string | URL, { withPath = false } = {}) {
  const url = new URL(input);
  const path = withPath ? url.pathname.replace(/\/+$/, "").toLowerCase() : "";
  return `${catalogDomain(url)}${path}`;
}
