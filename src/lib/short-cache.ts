// Short-lived cache for small, JSON-serialisable read results that every page needs
// (navigation counts). Two layers: this isolate's memory, then the Cloudflare Cache API
// shared by isolates in the same data centre. A value can be served for up to twice the
// TTL when an edge hit lands just before it expires.

type Entry = { expires: number; value: unknown };

const memory = new Map<string, Entry>();
const cacheOrigin = "https://short-cache.ordalin.internal/v1/";

function edgeCache(): Cache | undefined {
  return (globalThis as { caches?: { default?: Cache } }).caches?.default;
}

export async function shortCache<T>(
  key: string,
  ttlSeconds: number,
  load: () => Promise<T>,
): Promise<T> {
  // Local preview reads production data; keep it live so edits show up at once.
  if (process.env.NODE_ENV === "development") return load();

  const hit = memory.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;

  const remember = (value: T) => {
    memory.set(key, { expires: Date.now() + ttlSeconds * 1000, value });
    return value;
  };
  const cache = edgeCache();
  const url = cacheOrigin + encodeURIComponent(key);

  if (cache) {
    try {
      const stored = await cache.match(url);
      if (stored) return remember((await stored.json()) as T);
    } catch {
      // A cache failure must never break the page; fall through to the loader.
    }
  }

  const value = remember(await load());
  if (cache) {
    try {
      await cache.put(
        url,
        new Response(JSON.stringify(value), {
          headers: {
            "content-type": "application/json",
            "cache-control": `public, max-age=${ttlSeconds}`,
          },
        }),
      );
    } catch {
      // Same as above: the value is already in hand.
    }
  }
  return value;
}

export function clearShortCache() {
  memory.clear();
}
