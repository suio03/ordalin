import { vi } from "vitest";
import { readOnlyBucket, readOnlyDatabase } from "./local-read-only";

describe("local production-data guards", () => {
  it("preserves parameterized catalogue reads", async () => {
    const first = vi.fn(async () => ({ slug: "granola" }));
    const bind = vi.fn(() => ({ first }));
    const prepare = vi.fn(() => ({ bind }));
    const db = readOnlyDatabase({ prepare } as unknown as D1Database);
    expect(await db.prepare("SELECT slug FROM tools WHERE slug = ?").bind("granola").first()).toEqual({ slug: "granola" });
    expect(bind).toHaveBeenCalledWith("granola");
  });
  it("blocks writes and bypasses before reaching the production binding", () => {
    const prepare = vi.fn();
    const db = readOnlyDatabase({ prepare } as unknown as D1Database);
    for (const sql of ["DELETE FROM tools", "UPDATE tools SET name='x'", "SELECT 1; DELETE FROM tools", "PRAGMA writable_schema=1", "WITH x AS (SELECT 1) DELETE FROM tools", "/* read */ DELETE FROM tools"]) {
      expect(() => db.prepare(sql)).toThrow("read-only");
    }
    expect(() => db.exec("DELETE FROM tools")).toThrow("read-only");
    expect(() => db.batch([])).toThrow("read-only");
    expect(() => db.withSession()).toThrow("read-only");
    expect(() => db.prepare("SELECT 1").run()).toThrow("read-only");
    expect(prepare).not.toHaveBeenCalled();
  });
  it("allows image reads but blocks writes and multipart uploads", async () => {
    const get = vi.fn(async () => null);
    const put = vi.fn();
    const bucket = readOnlyBucket({ get, put } as unknown as R2Bucket);
    expect(await bucket.get("tools/image.webp")).toBeNull();
    expect(() => bucket.put("key", "value")).toThrow("read-only");
    expect(() => bucket.delete("key")).toThrow("read-only");
    expect(() => bucket.createMultipartUpload("key")).toThrow("read-only");
    expect(() => bucket.resumeMultipartUpload("key", "id")).toThrow("read-only");
    expect(put).not.toHaveBeenCalled();
  });
});
