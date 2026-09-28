import { actorHash, clientAddress, submissionHashSalt } from "@/lib/submissions/request";
import { assertPublicHttpsUrl } from "@/lib/catalog-enrichment/url-policy";
import { getCloudflareEnv } from "@/lib/cloudflare";
import { parseSubmissionDraftPayload } from "@/lib/submissions/draft";
import { SubmissionError, submissionErrorResponse } from "@/lib/submissions/http";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "image/svg+xml",
]);

async function fetchCandidateAsset(input: string) {
  let url = assertPublicHttpsUrl(input);
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    const response = await fetch(url.href, {
      redirect: "manual",
      signal: AbortSignal.timeout(8_000),
      headers: { accept: "image/*", "user-agent": "OrdalinCatalogBot/0.1 (+https://ordalin.com/about/ranking)" },
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new SubmissionError("Logo candidate redirected incorrectly.", 502, "asset_fetch_failed");
      url = assertPublicHttpsUrl(new URL(location, url).href);
      continue;
    }
    if (!response.ok) throw new SubmissionError("Logo candidate could not be loaded.", 502, "asset_fetch_failed");
    const type = (response.headers.get("content-type") ?? "").split(";", 1)[0].toLowerCase();
    if (!ALLOWED_TYPES.has(type)) throw new SubmissionError("This candidate is not a supported image.", 415, "unsupported_asset");
    const declared = Number(response.headers.get("content-length") ?? 0);
    if (declared > 2_000_000) throw new SubmissionError("Logo candidate is too large.", 413, "asset_too_large");
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > 2_000_000) throw new SubmissionError("Logo candidate is too large.", 413, "asset_too_large");
    if (type === "image/svg+xml") {
      const svg = new TextDecoder().decode(bytes);
      if (!/<svg\b/i.test(svg) || /<script\b|<foreignObject\b|\son\w+\s*=|(?:href|src)\s*=\s*["'](?:https?:|\/\/)/i.test(svg)) {
        throw new SubmissionError("This SVG candidate cannot be previewed safely.", 415, "unsupported_asset");
      }
    }
    return { bytes, type };
  }
  throw new SubmissionError("Logo candidate redirected too many times.", 502, "asset_fetch_failed");
}

type AssetParams = { params: Promise<{ draftId: string; index: string }> };

export async function GET(request: Request, { params }: AssetParams) {
  try {
    const { draftId, index: rawIndex } = await params;
    const index = Number(rawIndex);
    if (!Number.isInteger(index) || index < 0 || index > 12) throw new SubmissionError("Logo candidate not found.", 404, "asset_not_found");
    const env = await getCloudflareEnv();
    const hash = await actorHash(clientAddress(request), submissionHashSalt((env as CloudflareEnv & { SUBMISSION_HASH_SALT?: string }).SUBMISSION_HASH_SALT));
    const now = Math.floor(Date.now() / 1000);
    const draft = await env.DB
      .prepare("SELECT candidate_json FROM submission_drafts WHERE id = ? AND actor_hash = ? AND status = 'pending' AND expires_at > ?")
      .bind(draftId, hash, now)
      .first<{ candidate_json: string }>();
    if (!draft) throw new SubmissionError("Submission draft has expired.", 404, "draft_expired");
    const { candidate } = parseSubmissionDraftPayload(draft.candidate_json);
    const asset = candidate.assets[index];
    if (!asset) throw new SubmissionError("Logo candidate not found.", 404, "asset_not_found");
    const fetched = await fetchCandidateAsset(asset.value);
    return new Response(fetched.bytes, {
      headers: {
        "content-type": fetched.type,
        "cache-control": "private, max-age=300",
        "content-security-policy": "sandbox; default-src 'none'; img-src 'self' data:",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return submissionErrorResponse(error);
  }
}
