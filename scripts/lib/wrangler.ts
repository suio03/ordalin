import { existsSync } from "node:fs";
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execute = promisify(execFile);

export type DatabaseMode = "--local" | "--remote";

export function databaseMode(args = process.argv): DatabaseMode {
  if (args.includes("--local") === args.includes("--remote")) {
    throw new Error("Choose exactly one database target: --local or --remote.");
  }
  return args.includes("--remote") ? "--remote" : "--local";
}

export function storageConfigArgs(projectRoot: string, args: string[]) {
  if (args.includes("--remote")) {
    const config = path.join(projectRoot, "wrangler.production.jsonc");
    if (!existsSync(config)) {
      throw new Error("Remote operations require wrangler.production.jsonc. Copy and configure the production example first.");
    }
    return ["--config", config];
  }
  return ["--config", path.join(projectRoot, "wrangler.jsonc"), "--persist-to", path.join(projectRoot, ".wrangler/demo")];
}

export async function wrangler(projectRoot: string, args: string[]) {
  const result = await execute("pnpm", ["exec", "wrangler", ...args, ...storageConfigArgs(projectRoot, args)], {
    cwd: projectRoot,
    maxBuffer: 20 * 1024 * 1024,
  });
  return result.stdout;
}

export async function d1Query<T>(projectRoot: string, mode: DatabaseMode, command: string) {
  const output = await wrangler(projectRoot, ["d1", "execute", "DB", mode, "--json", "--command", command]);
  const parsed = JSON.parse(output) as Array<{ results?: T[] }>;
  return parsed[0]?.results ?? [];
}

export async function d1File(projectRoot: string, mode: DatabaseMode, statements: string[]) {
  const directory = await mkdtemp(path.join(tmpdir(), "ordalin-import-sql-"));
  const filename = path.join(directory, "import.sql");
  try {
    await writeFile(filename, `${statements.join(";\n")}\n`, "utf8");
    return await wrangler(projectRoot, ["d1", "execute", "DB", mode, "--file", filename]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

export function sqlText(value: string) {
  return `'${value.replaceAll("\0", "").replaceAll("'", "''")}'`;
}

export function sqlNullable(value: string | null) {
  return value === null ? "NULL" : sqlText(value);
}
