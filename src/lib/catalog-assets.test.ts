import { catalogAssetUrl, isCatalogAssetKey } from "./catalog-assets";

describe("catalogue asset URLs", () => {
  it("accepts immutable reviewed tool asset keys", () => {
    const key = "tools/tool_lispr/logo/0123456789abcdef.webp";
    expect(isCatalogAssetKey(key)).toBe(true);
    expect(catalogAssetUrl(key)).toBe(`/assets/${key}`);
  });

  it("rejects traversal, mutable, and unrelated keys", () => {
    expect(catalogAssetUrl("../private/logo.webp")).toBeNull();
    expect(catalogAssetUrl("tools/lispr/logo/latest.webp")).toBeNull();
    expect(catalogAssetUrl("imports/product-hunt/raw.json")).toBeNull();
  });
});
