import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { middleware } from "./middleware";

describe("canonical host proxy", () => {
  it("redirects www requests to the root domain and preserves the URL", () => {
    const response = middleware(new NextRequest("https://www.ordalin.com/tools/lispr?from=www"));

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://ordalin.com/tools/lispr?from=www");
  });

  it.each(["http://ordalin.com", "http://www.ordalin.com"])("redirects %s directly to HTTPS and preserves path and query", (origin) => {
    const response = middleware(new NextRequest(`${origin}/categories/coding?page=2`));
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://ordalin.com/categories/coding?page=2");
  });

  it("leaves local HTTP development accessible", () => {
    expect(middleware(new NextRequest("http://localhost:3000/")).headers.get("x-middleware-next")).toBe("1");
  });

  it("passes root-domain and workers.dev requests through", () => {
    expect(middleware(new NextRequest("https://ordalin.com/")).headers.get("x-middleware-next")).toBe("1");
    expect(middleware(new NextRequest("https://ordalin.laughinglyl90.workers.dev/")).headers.get("x-middleware-next")).toBe("1");
  });
});


describe("local read-only requests", () => {
  it.each(["POST", "PUT", "PATCH", "DELETE"])("blocks local %s before routing", method => {
    const response = middleware(new NextRequest("http://127.0.0.1:3107/api/submissions/publish", { method }));
    expect(response.status).toBe(403);
  });
  it("preserves production submission requests", () => {
    const response = middleware(new NextRequest("https://ordalin.com/api/submissions/publish", { method: "POST" }));
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
