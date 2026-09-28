const ASSET_KEY_PATTERN = /^tools\/[a-zA-Z0-9_-]+\/(?:logo|screenshots)\/[a-fA-F0-9]{16,128}\.(?:avif|png|webp)$/;

export function isCatalogAssetKey(value: string) {
  return ASSET_KEY_PATTERN.test(value);
}

export function catalogAssetUrl(key: string | null) {
  if (!key || !isCatalogAssetKey(key)) return null;
  return `/assets/${key.split("/").map(encodeURIComponent).join("/")}`;
}
