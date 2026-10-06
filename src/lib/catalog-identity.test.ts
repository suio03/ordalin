import { catalogDomain, catalogIdentityKey } from "./catalog-identity";

describe("catalog identity", () => {
  it("keys product sites by bare domain", () => {
    expect(catalogDomain("https://www.Granola.ai/pricing")).toBe("granola.ai");
    expect(catalogIdentityKey("https://www.granola.ai/pricing")).toBe("granola.ai");
  });

  it("keys a model page by domain and path when asked", () => {
    expect(catalogIdentityKey("https://bfl.ai/models/FLUX-3-video/?ref=x#top", { withPath: true })).toBe("bfl.ai/models/flux-3-video");
    expect(catalogIdentityKey("https://bfl.ai/models/flux-4", { withPath: true })).not.toBe("bfl.ai/models/flux-3-video");
  });

  it("falls back to the domain for a root URL even with a path key", () => {
    expect(catalogIdentityKey("https://www.bfl.ai/", { withPath: true })).toBe("bfl.ai");
  });
});
