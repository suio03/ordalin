import { refundedCredits } from "./billing";
import { packTotal } from "./credits";
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

  it("prices packs and caps the quantity", () => {
    expect(packTotal(2)).toEqual({ quantity: 2, credits: 6, amountCents: 1800, currency: "USD" });
    expect(packTotal(0)).toBeNull();
    expect(packTotal(21)).toBeNull();
    expect(packTotal(1.5)).toBeNull();
  });

  it("removes refunded credits in proportion to the refund", () => {
    const payment = { credits: 6, amount_cents: 1800 };
    expect(refundedCredits(payment, 1800)).toBe(6);
    expect(refundedCredits(payment, 300)).toBe(1);
    expect(refundedCredits(payment, 900)).toBe(3);
    expect(refundedCredits(payment, 5000)).toBe(6);
  });

  it("only returns to known pages after sign-in", () => {
    expect(safeNextPath("/account")).toBe("/account");
    expect(safeNextPath("https://evil.example")).toBe("/submit");
    expect(safeNextPath(null)).toBe("/submit");
  });
});
