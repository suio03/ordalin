import { SubmissionError } from "./http";

type TurnstileResult = {
  success: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
};

export async function verifyTurnstile(
  token: string,
  remoteAddress: string,
  secret: string | undefined,
) {
  if (!secret) {
    if (process.env.NODE_ENV !== "production" && token === "development-bypass") {
      return { success: true, action: "submit-tool", hostname: "localhost" };
    }
    throw new SubmissionError("Submission protection is not configured.", 503, "turnstile_unavailable");
  }

  const body = new FormData();
  body.set("secret", secret);
  body.set("response", token);
  if (remoteAddress !== "unavailable") body.set("remoteip", remoteAddress);
  body.set("idempotency_key", crypto.randomUUID());
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new SubmissionError("Verification service is unavailable.", 503, "turnstile_unavailable");
  const result = (await response.json()) as TurnstileResult;
  if (!result.success || (result.action && result.action !== "submit-tool")) {
    throw new SubmissionError("Verification expired or failed. Please try again.", 400, "turnstile_failed");
  }
  return result;
}
