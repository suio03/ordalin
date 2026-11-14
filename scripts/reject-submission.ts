import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { databaseMode, d1File, d1Query, sqlText } from "./lib/wrangler.ts";
import { loadLocalEnv, sendDeclineEmail } from "./lib/decline-email.ts";
import { DECLINE_REASONS, encodeDeclineNote, isDeclineReason } from "../src/lib/submissions/decline-reasons.ts";

// Declines a pending visitor submission. A credit submission gets its credit back
// (MVP_PLAN.md §9); a free one does not. The submitter sees the reason on
// /account and gets it by email through Resend. Usage:
//   pnpm submissions:reject --remote --domain=example.com --reason=wrapper [--note="Extra detail for the submitter"]
//   pnpm submissions:reject --remote --domain=example.com --reason=not-ai --no-email   (/account only, no email)
//   pnpm submissions:reject --remote --domain=example.com --email-only   (re-send the email for a declined submission)
const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
loadLocalEnv(projectRoot);
const mode = databaseMode();
const argument = (name: string) => process.argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const domain = argument("domain")?.trim().toLowerCase().replace(/^www\./, "");
const emailOnly = process.argv.includes("--email-only");
const noEmail = process.argv.includes("--no-email");
if (!domain) throw new Error("Provide --domain=example.com.");

type Row = { submission_id: string; user_id: string | null; funding: string | null; contact_email: string; submitted_name: string; moderation_note: string | null; tool_id: string | null };
const status = emailOnly ? "rejected" : "pending";
const [row] = await d1Query<Row>(projectRoot, mode, `SELECT s.id AS submission_id, s.user_id, s.funding, s.contact_email, s.submitted_name, s.moderation_note, t.id AS tool_id FROM submissions s LEFT JOIN tools t ON t.canonical_domain = s.canonical_domain AND t.status = 'pending_review' WHERE s.canonical_domain = ${sqlText(domain)} AND s.status = '${status}' ORDER BY s.created_at DESC LIMIT 1`);
if (!row) throw new Error(`No ${status} submission for ${domain}.`);

let stored = row.moderation_note ?? "";
if (!emailOnly) {
  const reason = argument("reason")?.trim();
  const note = argument("note")?.trim() || undefined;
  if (!reason || !isDeclineReason(reason)) throw new Error(`Provide --reason=<${Object.keys(DECLINE_REASONS).join("|")}>, optionally --note="…".`);
  stored = encodeDeclineNote(reason, note);

  const now = Math.floor(Date.now() / 1000);
  const refund = row.funding === "credit" && row.user_id;
  await d1File(projectRoot, mode, [
    `UPDATE submissions SET status = 'rejected', moderation_note = ${sqlText(stored)}, updated_at = ${now} WHERE id = ${sqlText(row.submission_id)}`,
    ...(row.tool_id ? [
      `UPDATE tools SET status = 'rejected', updated_at = ${now} WHERE id = ${sqlText(row.tool_id)} AND status = 'pending_review'`,
      `INSERT INTO moderation_events (id, entity_type, entity_id, action, actor_identity, metadata_json, created_at) VALUES (${sqlText(`event_${randomUUID()}`)}, 'tool', ${sqlText(row.tool_id)}, 'reject', 'maintainer', ${sqlText(JSON.stringify({ submissionId: row.submission_id, reason, note, funding: row.funding, creditReturned: Boolean(refund) }))}, ${now})`,
    ] : []),
    // Keyed by submission, so running this twice cannot return two credits.
    ...(refund ? [`INSERT INTO credit_ledger (id, user_id, delta, kind, reference, note, created_at) VALUES (${sqlText(`credit_${randomUUID()}`)}, ${sqlText(row.user_id!)}, 1, 'refund_rejected', ${sqlText(row.submission_id)}, ${sqlText(stored)}, ${now}) ON CONFLICT(kind, reference) DO NOTHING`] : []),
  ]);
  console.log(`${domain}: declined${refund ? ", 1 credit returned" : row.funding === "free" ? ", free submission not returned" : ""}.`);
}

if (mode === "--local") {
  console.log("Local database: email not sent.");
} else if (noEmail && !emailOnly) {
  console.log("--no-email: the reason shows on /account only; send it later with --email-only.");
} else {
  const result = await sendDeclineEmail({ submissionId: row.submission_id, to: row.contact_email, toolName: row.submitted_name, domain, storedNote: stored, funding: row.funding });
  console.log(result.sent ? `Email sent (${result.id}).` : `Email not sent: ${result.reason}. Re-send later with --email-only.`);
}
