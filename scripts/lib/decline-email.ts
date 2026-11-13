import { existsSync } from "node:fs";
import path from "node:path";
import { explainDecline } from "../../src/lib/submissions/decline-reasons.ts";

// Tells a submitter why their submission was declined, through Resend.
// RESEND_API_KEY lives in the ignored .env.local; ordalin.com must be a verified
// sending domain in Resend. Replies go to the support inbox.

const FROM = "Ordalin <support@ordalin.com>";
const SITE = "https://ordalin.com";

export function loadLocalEnv(projectRoot: string) {
  const file = path.join(projectRoot, ".env.local");
  if (existsSync(file)) process.loadEnvFile(file);
}

export type DeclineEmail = { submissionId: string; to: string; toolName: string; domain: string; storedNote: string; funding: string | null };

export function composeDeclineEmail({ toolName, domain, storedNote, funding }: DeclineEmail) {
  const decline = explainDecline(storedNote);
  if (!decline) throw new Error("No decline reason stored.");
  const lines = [
    "Hi,",
    "",
    `Thanks for submitting ${toolName} (${domain}) to Ordalin. We reviewed it and are not listing it.`,
    "",
    `Why: ${decline.text}${decline.note ? ` ${decline.note}` : ""}`,
    "",
    ...(funding === "credit"
      ? ["The credit you used is back in your balance: " + `${SITE}/account`, ""]
      : decline.creditCanList
        ? ["Credit submissions accept sites built on third-party models, so you can submit it again with a credit: " + `${SITE}/submit`, ""]
        : []),
    "If you think we got something wrong, reply to this email.",
    "",
    "Ordalin",
  ];
  return { subject: `Your Ordalin submission: ${toolName}`, text: lines.join("\n") };
}

export async function sendDeclineEmail(email: DeclineEmail) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false as const, reason: "RESEND_API_KEY is not set" };
  const { subject, text } = composeDeclineEmail(email);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": `decline-${email.submissionId}` },
    body: JSON.stringify({ from: FROM, to: [email.to], reply_to: "support@ordalin.com", subject, text }),
  });
  if (!response.ok) return { sent: false as const, reason: `Resend ${response.status}: ${(await response.text()).slice(0, 200)}` };
  return { sent: true as const, id: ((await response.json()) as { id?: string }).id };
}
