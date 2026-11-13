import { refundedCredits } from "./billing";
import { packSummary, packTotal } from "./credits";
import { normalizeEmail } from "./email";
import { safeNextPath } from "./google";
import { ipPrefix } from "./signals";

describe("account helpers", () => {
  it("collapses Gmail address variants to one inbox", () => {
    expect(normalizeEmail(" Al.Ice+tools@Gmail.com ")).toBe("alice@gmail.com");
    expect(normalizeEmail("a.lice@googlemail.com")).toBe("alice@gmail.com");
    expect(normalizeEmail("first.last+news@example.com")).toBe("first.last@example.com");
  });

  it("groups addresses by home or office network", () => {
    expect(ipPrefix("198.51.100.10")).toBe("198.51.100.0/24");
    expect(ipPrefix("2001:db8:abcd:12::1")).toBe("2001:db8:abcd::/48");
    expect(ipPrefix("2001:0db8::1")).toBe("2001:db8:0::/48");
    expect(ipPrefix("unavailable")).toBeNull();
  });

  it("prices the three packs and rejects anything else", () => {
    expect(packTotal("one")).toEqual({ pack: "one", quantity: 1, credits: 1, amountCents: 399, currency: "USD" });
    expect(packTotal("three")).toEqual({ pack: "three", quantity: 1, credits: 3, amountCents: 599, currency: "USD" });
    expect(packTotal("ten")).toEqual({ pack: "ten", quantity: 1, credits: 10, amountCents: 999, currency: "USD" });
    expect(packTotal(2)).toBeNull();
    expect(packTotal("twenty")).toBeNull();
    expect(packSummary()).toBe("$3.99 for 1 credit · $5.99 for 3 · $9.99 for 10");
  });

  it("removes refunded credits in proportion to the refund", () => {
    const payment = { credits: 10, amount_cents: 999 };
    expect(refundedCredits(payment, 999)).toBe(10);
    expect(refundedCredits(payment, 100)).toBe(1);
    expect(refundedCredits(payment, 500)).toBe(5);
    expect(refundedCredits(payment, 5000)).toBe(10);
  });

  it("only returns to known pages after sign-in", () => {
    expect(safeNextPath("/account")).toBe("/account");
    expect(safeNextPath("https://evil.example")).toBe("/submit");
    expect(safeNextPath(null)).toBe("/submit");
  });
});

describe("post-login destination", () => {
  it("keeps known pages and the submitted website only", async () => {
    const { safeNextPath, decodeNext, encodeNext, withSignInError } = await import("./google");
    expect(safeNextPath("/pricing")).toBe("/pricing");
    expect(safeNextPath("/account#buy")).toBe("/account");
    expect(safeNextPath("/account?pack=ten#buy")).toBe("/account?pack=ten#buy");
    expect(safeNextPath("/account?pack=evil")).toBe("/account");
    expect(withSignInError("/account?pack=one#buy", "failed")).toBe("/account?pack=one&signin=failed#buy");
    expect(safeNextPath("/submit?website=example.com&x=1")).toBe("/submit?website=example.com");
    expect(safeNextPath("https://evil.example/submit")).toBe("/submit");
    expect(safeNextPath("//evil.example/account")).toBe("/submit");
    expect(safeNextPath("/admin")).toBe("/submit");
    expect(decodeNext(encodeNext("/submit?website=a.ai"))).toBe("/submit?website=a.ai");
    expect(decodeNext("@@not-base64")).toBe("/submit");
    expect(withSignInError("/submit?website=a.ai", "failed")).toBe("/submit?website=a.ai&signin=failed");
  });
});
