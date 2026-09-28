import { getCloudflareEnv } from "@/lib/cloudflare";
import { captureWebsitePreview } from "@/lib/catalog-preview";
import { parseSubmissionDraftPayload } from "@/lib/submissions/draft";
import { SubmissionError, submissionErrorResponse } from "@/lib/submissions/http";
import { actorHash, clientAddress, submissionHashSalt } from "@/lib/submissions/request";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ draftId: string }> }) {
  try {
    const { draftId } = await params;
    const env = await getCloudflareEnv();
    const salt = (env as CloudflareEnv & { SUBMISSION_HASH_SALT?: string }).SUBMISSION_HASH_SALT;
    const hash = await actorHash(clientAddress(request), submissionHashSalt(salt));
    const now = Math.floor(Date.now() / 1000);
    const row = await env.DB.prepare("SELECT candidate_json FROM submission_drafts WHERE id = ? AND actor_hash = ? AND status = 'pending' AND expires_at > ?").bind(draftId, hash, now).first<{ candidate_json: string }>();
    if (!row) throw new SubmissionError("This preview expired. Check the website again.", 410, "draft_expired");
    const payload = parseSubmissionDraftPayload(row.candidate_json);
    if ((payload.screenshotAttempts ?? 0) >= 3) throw new SubmissionError("Capture limit reached. Upload a screenshot or continue without one.", 429, "capture_limit");
    payload.screenshotAttempts = (payload.screenshotAttempts ?? 0) + 1;
    const reserved = JSON.stringify(payload);
    const lock = await env.DB.prepare("UPDATE submission_drafts SET candidate_json = ?, updated_at = ? WHERE id = ? AND candidate_json = ? AND status = 'pending'").bind(reserved, now, draftId, row.candidate_json).run();
    if (!lock.meta.changes) throw new SubmissionError("A capture is already in progress. Try again shortly.", 409, "capture_busy");
    let image;
    try { image = await captureWebsitePreview(env, payload.candidate.websiteUrl); }
    catch { throw new SubmissionError("We could not capture this website. Try again, upload an image, or continue without a screenshot.", 502, "capture_failed"); }
    payload.screenshotHashes = [...(payload.screenshotHashes ?? []), image.hash];
    const saved = await env.DB.prepare("UPDATE submission_drafts SET candidate_json = ?, updated_at = ? WHERE id = ? AND candidate_json = ? AND status = 'pending' AND expires_at > ?").bind(JSON.stringify(payload), Math.floor(Date.now() / 1000), draftId, reserved, Math.floor(Date.now() / 1000)).run();
    if (!saved.meta.changes) throw new SubmissionError("The preview changed. Try capturing again.", 409, "capture_changed");
    return new Response(image.bytes, { headers: { "content-type": "image/webp", "cache-control": "private, no-store", "x-content-type-options": "nosniff" } });
  } catch (error) { return submissionErrorResponse(error); }
}
