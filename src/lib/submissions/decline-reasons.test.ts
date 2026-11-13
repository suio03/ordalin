import { describe, expect, it } from "vitest";
import { DECLINE_REASONS, encodeDeclineNote, explainDecline } from "./decline-reasons";

describe("explainDecline", () => {
  it("returns the reason text, note and credit option for a coded note", () => {
    expect(explainDecline(encodeDeclineNote("wrapper", "Runs on a third-party API."))).toEqual({ text: DECLINE_REASONS.wrapper.text, note: "Runs on a third-party API.", creditCanList: true });
    expect(explainDecline(encodeDeclineNote("no-product"))).toEqual({ text: DECLINE_REASONS["no-product"].text, note: null, creditCanList: false });
  });

  it("shows older free-text notes as written and ignores empty ones", () => {
    expect(explainDecline("Model wrapper without its own product")).toEqual({ text: "Model wrapper without its own product", note: null, creditCanList: false });
    expect(explainDecline(null)).toBeNull();
  });
});
