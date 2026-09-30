import { looksLikeScriptShell } from "./rendered-fetch.ts";

describe("rendered fetch", () => {
  it("treats a script-only document as a JavaScript shell", () => {
    expect(looksLikeScriptShell(`<html><head><title>Udio</title><script>${"x".repeat(5000)}</script></head><body><div id="root"></div></body></html>`)).toBe(true);
  });

  it("keeps server-rendered pages", () => {
    expect(looksLikeScriptShell(`<main><h1>Plans</h1><p>${"Unlimited downloads for every plan. ".repeat(60)}</p></main>`)).toBe(false);
  });
});
