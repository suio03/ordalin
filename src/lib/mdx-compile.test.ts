import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { compile } from "@mdx-js/mdx";
import { describe, expect, it } from "vitest";

// Typecheck and the other tests never compile MDX, so a syntax error in an `export const meta`
// block (a stray quote, 2026-11-07) only showed up in Workers Builds. Compile every content file here.
const CONTENT = join(process.cwd(), "src", "content");
const files = readdirSync(CONTENT, { recursive: true, encoding: "utf8" }).filter((f) => f.endsWith(".mdx"));

describe("content MDX", () => {
  it("compiles every file", async () => {
    const failed: string[] = [];
    for (const file of files) {
      try {
        await compile(readFileSync(join(CONTENT, file), "utf8"));
      } catch (error) {
        failed.push(`${file}: ${(error as Error).message}`);
      }
    }
    expect(failed).toEqual([]);
  }, 60_000);
});
