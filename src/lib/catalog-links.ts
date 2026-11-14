const TRACKING_PARAMETER = /^(?:utm_|ref$|referrer$|source$|via$|affiliate$|aff$|dub_id$)/i;

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

export type SubmissionLinkPolicy = "credit" | "free" | "legacy";

// Free submissions published from this moment link with nofollow; earlier
// submissions keep rel="ugc" unchanged (maintainer decision, 2026-11-14).
export const FREE_SUBMISSION_NOFOLLOW_SINCE = 1794614400; // 2026-11-14T00:00:00Z

// Selected next to source_provider (alias `t` = tools). A credit-funded submission
// for the domain wins; otherwise the tool's publish time picks free vs legacy.
export const submissionLinkPolicySql = `CASE WHEN NOT EXISTS (
        SELECT 1 FROM tool_sources source
        WHERE source.tool_id = t.id AND source.provider = 'submission'
      ) THEN NULL
      WHEN EXISTS (
        SELECT 1 FROM submissions paid
        WHERE paid.canonical_domain = t.canonical_domain AND paid.funding = 'credit' AND paid.status = 'accepted'
      ) THEN 'credit'
      WHEN t.published_at >= ${FREE_SUBMISSION_NOFOLLOW_SINCE} THEN 'free'
      ELSE 'legacy' END AS link_policy`;

export function catalogWebsiteRel(tool: { linkPolicy?: SubmissionLinkPolicy | null }) {
  switch (tool.linkPolicy) {
    case "free": return "noopener nofollow";
    case "legacy": return "noopener ugc";
    default: return "noopener";
  }
}
