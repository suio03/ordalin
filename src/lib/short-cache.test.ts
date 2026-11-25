import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearShortCache, shortCache } from "./short-cache";

function fakeEdgeCache() {
  const store = new Map<string, string>();
  return {
    store,
    default: {
      match: vi.fn(async (url: string) => {
        const body = store.get(url);
        return body === undefined ? undefined : new Response(body);
      }),
      put: vi.fn(async (url: string, response: Response) => {
        store.set(url, await response.text());
      }),
    },
  };
}

describe("shortCache", () => {
  beforeEach(() => {
    clearShortCache();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("loads once within the TTL and again after it", async () => {
    const load = vi.fn().mockResolvedValueOnce(["a"]).mockResolvedValueOnce(["b"]);

    expect(await shortCache("k", 300, load)).toEqual(["a"]);
    expect(await shortCache("k", 300, load)).toEqual(["a"]);
    expect(load).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(301_000);
    expect(await shortCache("k", 300, load)).toEqual(["b"]);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("keeps keys apart", async () => {
    expect(await shortCache("one", 300, async () => 1)).toBe(1);
    expect(await shortCache("two", 300, async () => 2)).toBe(2);
  });

  it("does not remember a failed load", async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error("d1 down")).mockResolvedValueOnce("ok");

    await expect(shortCache("k", 300, load)).rejects.toThrow("d1 down");
    expect(await shortCache("k", 300, load)).toBe("ok");
  });

  it("shares values through the edge cache when memory is empty", async () => {
    const edge = fakeEdgeCache();
    vi.stubGlobal("caches", edge);
    const load = vi.fn().mockResolvedValue({ count: 3 });

    expect(await shortCache("k", 300, load)).toEqual({ count: 3 });
    expect(edge.default.put).toHaveBeenCalledTimes(1);

    clearShortCache(); // a second isolate in the same data centre
    expect(await shortCache("k", 300, load)).toEqual({ count: 3 });
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("falls back to the loader when the edge cache throws", async () => {
    vi.stubGlobal("caches", {
      default: {
        match: vi.fn().mockRejectedValue(new Error("cache down")),
        put: vi.fn().mockRejectedValue(new Error("cache down")),
      },
    });

    expect(await shortCache("k", 300, async () => "ok")).toBe("ok");
  });

  it("is bypassed in local development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const load = vi.fn().mockResolvedValue(1);

    await shortCache("k", 300, load);
    await shortCache("k", 300, load);
    expect(load).toHaveBeenCalledTimes(2);
  });
});
