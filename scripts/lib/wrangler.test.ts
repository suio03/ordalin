import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { storageConfigArgs } from "./wrangler";

describe("maintenance storage targets", () => {
  const root = mkdtempSync(path.join(tmpdir(), "ordalin-config-test-"));
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  it("refuses remote operations without explicit private configuration", () => {
    expect(() => storageConfigArgs(root, ["d1", "execute", "DB", "--remote"]))
      .toThrow("Remote operations require wrangler.production.jsonc");
  });

  it("keeps local storage isolated even when production config exists", () => {
    writeFileSync(path.join(root, "wrangler.production.jsonc"), "{}");
    expect(storageConfigArgs(root, ["r2", "object", "put", "--local"]))
      .toEqual(["--config", path.join(root, "wrangler.jsonc"), "--persist-to", path.join(root, ".wrangler/demo")]);
    expect(storageConfigArgs(root, ["d1", "execute", "DB", "--remote"]))
      .toEqual(["--config", path.join(root, "wrangler.production.jsonc")]);
  });
});
