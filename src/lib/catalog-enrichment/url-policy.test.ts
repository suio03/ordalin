import { assertPublicHttpsUrl, robotsAllows } from "./url-policy";

describe("public URL policy", () => {
  it("accepts a normal HTTPS product URL", () => {
    expect(assertPublicHttpsUrl("https://www.example.com/product#demo").href).toBe(
      "https://www.example.com/product",
    );
  });

  it.each([
    "http://example.com",
    "https://127.0.0.1",
    "https://2130706433",
    "https://[::1]",
    "https://user:secret@example.com",
    "https://example.com:8443",
  ])("rejects unsafe target %s", (target) => {
    expect(() => assertPublicHttpsUrl(target)).toThrow();
  });
});

describe("robots policy", () => {
  it("uses the most specific wildcard rule", () => {
    const robots = "User-agent: *\nDisallow: /private\nAllow: /private/pricing";
    expect(robotsAllows(robots, "/private/account")).toBe(false);
    expect(robotsAllows(robots, "/private/pricing")).toBe(true);
    expect(robotsAllows(robots, "/features")).toBe(true);
  });
});
