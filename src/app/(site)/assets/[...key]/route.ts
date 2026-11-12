import { getCloudflareEnv } from "@/lib/cloudflare";
import { isCatalogAssetKey } from "@/lib/catalog-assets";

export const dynamic = "force-dynamic";

type AssetParams = { params: Promise<{ key: string[] }> };

export async function GET(_: Request, { params }: AssetParams) {
  const key = (await params).key.join("/");
  if (!isCatalogAssetKey(key)) {
    return new Response("Not found", { status: 404 });
  }

  const object = await (await getCloudflareEnv()).CATALOG_ASSETS.get(key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  const metadata = object.httpMetadata;
  if (metadata?.contentType) headers.set("content-type", metadata.contentType);
  if (metadata?.contentDisposition) headers.set("content-disposition", metadata.contentDisposition);
  if (metadata?.contentEncoding) headers.set("content-encoding", metadata.contentEncoding);
  if (metadata?.contentLanguage) headers.set("content-language", metadata.contentLanguage);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  headers.set("x-content-type-options", "nosniff");

  // Wrangler's Next.js development bridge cannot serialize an R2 stream across
  // its runtime boundary. Catalogue assets are bounded at ingestion, so return
  // a concrete buffer here and keep production and local behavior identical.
  return new Response(await object.arrayBuffer(), { headers });
}
