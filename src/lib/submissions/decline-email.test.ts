import { describe, expect, it } from "vitest";
import { composeDeclineEmail } from "../../../scripts/lib/decline-email";
import { encodeDeclineNote } from "./decline-reasons";

const base = { submissionId: "s1", to: "maker@example.com", toolName: "Chat Mirror", domain: "chatmirror.example" };

describe("composeDeclineEmail", () => {
  it("offers a credit resubmission to a declined free wrapper", () => {
    const { subject, text } = composeDeclineEmail({ ...base, storedNote: encodeDeclineNote("wrapper", "Runs on a third-party API."), funding: "free" });
    expect(subject).toBe("Your Ordalin submission: Chat Mirror");
    expect(text).toContain("Runs on a third-party API.");
    expect(text).toContain("https://ordalin.com/submit");
    expect(text).not.toMatch(/unofficial/i);
  });

  it("says the credit is back for a credit submission and offers nothing for unlistable reasons", () => {
    expect(composeDeclineEmail({ ...base, storedNote: encodeDeclineNote("not-ai"), funding: "credit" }).text).toContain("credit you used is back");
    expect(composeDeclineEmail({ ...base, storedNote: encodeDeclineNote("not-ai"), funding: "free" }).text).not.toContain("/submit");
  });
});
