// Fixed reasons for declining a visitor submission. The reject script stores the
// code (plus an optional maintainer note) in submissions.moderation_note, and
// /account shows the submitter the matching text.

export const DECLINE_REASONS = {
  wrapper: {
    text: "It is built on another company's model without a product of its own. Free submissions list tools from the company that builds them.",
    creditCanList: true,
  },
  reseller: {
    text: "It resells or repackages another company's product. Free submissions list tools from the company that builds them.",
    creditCanList: true,
  },
  "no-product": {
    text: "We could not find a working product: the site was down, behind a waitlist, or a placeholder.",
    creditCanList: false,
  },
  "not-ai": {
    text: "It is not an AI product, so it is outside what Ordalin lists.",
    creditCanList: false,
  },
  explicit: {
    text: "It shows sexually explicit content, which Ordalin does not list.",
    creditCanList: false,
  },
  unlawful: {
    text: "It appears to be illegal or to use someone else's name, likeness or content without permission.",
    creditCanList: false,
  },
} as const;

export type DeclineReason = keyof typeof DECLINE_REASONS;

export function isDeclineReason(value: string): value is DeclineReason {
  return Object.hasOwn(DECLINE_REASONS, value);
}

export function encodeDeclineNote(reason: DeclineReason, note?: string) {
  return JSON.stringify(note ? { reason, note } : { reason });
}

export type DeclineExplanation = { text: string; note: string | null; creditCanList: boolean };

/** Reads a stored moderation note; older free-text notes are shown as they are. */
export function explainDecline(stored: string | null): DeclineExplanation | null {
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored) as { reason?: unknown; note?: unknown };
    if (typeof parsed.reason === "string" && isDeclineReason(parsed.reason)) {
      const entry = DECLINE_REASONS[parsed.reason];
      return { text: entry.text, note: typeof parsed.note === "string" && parsed.note ? parsed.note : null, creditCanList: entry.creditCanList };
    }
  } catch {
    // Not JSON: a note written before reason codes existed.
  }
  return { text: stored, note: null, creditCanList: false };
}
