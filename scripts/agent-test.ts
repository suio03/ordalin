// Ordalin's hands-on test for /skills and /mcp pages (MVP_PLAN.md, "Agent skills" and "MCP servers").
//
//   pnpm agent-test -- <spec> [--agent=claude|codex] [--model=<id>] [--only=with|without] [--dry-run]
//
// <spec> is a file name in scripts/agent-test/specs/ (without .json) or a path.
// Each run gets its own folder in .ordalin-tests/ (ignored by Git):
//   repo/              the skill or server repository, checked out at the spec's commit
//   with/, without/    copies of the fixture; "without" exists only when the spec has a baseline
//   <variant>.jsonl    the agent's full event stream
//   <variant>.diff     what the agent changed in its copy
//   <variant>.after.txt  output of the spec's `after` commands
//   summary.json       date, agent and model versions, cost, tokens, duration, tools listed,
//                      final answers, and files the run left in the home folder
//
// Each skill or server is tested once. After its page is published (images copied to public/),
// delete the run folders: rm -rf .ordalin-tests
//
// Claude Code runs headless on the maintainer's subscription with project settings only, no
// user plugins and no MCP servers except the one under test. Codex runs are started by the
// maintainer, not by an AI session; the script prints the command instead when CODEX is unset.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

type Spec = {
  kind: "skill" | "mcp";
  name: string;
  repo: string;
  /** Pinned commit; the test records exactly what it ran. */
  commit: string;
  /** Folder in scripts/agent-test/fixtures/, or "git:<path>" for the tracked files of a local repository. Empty when omitted. */
  fixture?: string;
  install?: {
    /** Claude Code: a plugin folder (loaded with --plugin-dir, hooks included) or a skill folder (copied into .claude/skills/); "." is a skill at the repository root, named after the repository. A list installs sibling skills that link to each other. */
    claude?: { plugin?: string; skill?: string | string[] };
    /** Codex: a skill folder, copied into .agents/skills/. */
    codex?: { skill?: string };
  };
  /**
   * MCP server under test. {repo} and {run} are replaced with the run's repo and run folders,
   * and {env:NAME} with an environment variable, e.g. {env:AGENT_TEST_DEPS} for downloaded tools.
   */
  mcp?: { command: string; args?: string[]; env?: Record<string, string> };
  /** Shell commands run once in repo/ before the test, e.g. a build. */
  setup?: string[];
  task: string;
  /** Tier 2 only: the same request for the run without the skill. */
  baseline?: string;
  /** Later messages in the same session (Claude Code --resume), for skills that ask before they build. Sent to both runs. */
  followUps?: string[];
  /** Shell commands run in each copy after the agent finishes, e.g. a checker. */
  after?: string[];
  env?: Record<string, string>;
  /** Codex sandbox: allow network inside the workspace sandbox. */
  network?: boolean;
  timeoutMinutes?: number;
};

const ROOT = process.cwd();
const SPECS = join(ROOT, "scripts", "agent-test", "specs");
const FIXTURES = join(ROOT, "scripts", "agent-test", "fixtures");
const OUT = join(ROOT, ".ordalin-tests");

const flags = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.startsWith("--")).map((a) => {
    const [k, ...v] = a.slice(2).split("=");
    return [k, v.length ? v.join("=") : "true"];
  }),
);
const specArg = process.argv.slice(2).find((a) => !a.startsWith("--"));
if (!specArg) {
  console.error(`Usage: pnpm agent-test -- <spec> [--agent=claude|codex] [--model=<id>] [--only=with|without] [--dry-run]\nSpecs: ${readdirSync(SPECS).map((f) => f.replace(/\.json$/, "")).join(", ")}`);
  process.exit(1);
}
const specPath = existsSync(specArg) ? resolve(specArg) : join(SPECS, `${specArg}.json`);
const spec = JSON.parse(readFileSync(specPath, "utf8")) as Spec;
const agent = (flags.agent ?? "claude") as "claude" | "codex";
const dryRun = flags["dry-run"] === "true";
const today = new Date().toLocaleDateString("en-CA");

const run = join(OUT, `${today}-${spec.name}-${agent}${dryRun ? "-dry-run" : ""}`);
const repoDir = join(run, "repo");
const fill = (s: string) =>
  s.replaceAll("{repo}", repoDir).replaceAll("{run}", run).replace(/\{env:(\w+)\}/g, (_, name: string) => {
    const value = process.env[name];
    if (!value) throw new Error(`${specArg} needs the ${name} environment variable`);
    return value;
  });
// Copies a skill folder into an agent's skills folder; "." is the repository root, without .git, named after the repository.
function copySkill(skill: string, skillsDir: string) {
  const name = skill === "." ? basename(spec.repo).replace(/\.git$/, "") : basename(skill);
  cpSync(join(repoDir, skill), join(skillsDir, name), { recursive: true, filter: (src) => basename(src) !== ".git" });
}
const sh = (cmd: string, cwd: string) => spawnSync("sh", ["-c", cmd], { cwd, encoding: "utf8", env: { ...process.env, ...spec.env } });

mkdirSync(run, { recursive: true });

// 1. The repository at the pinned commit.
if (!existsSync(join(repoDir, ".git"))) {
  execFileSync("git", ["clone", "--quiet", "--filter=blob:none", spec.repo, repoDir], { stdio: "inherit" });
}
execFileSync("git", ["-C", repoDir, "checkout", "--quiet", spec.commit], { stdio: "inherit" });
const commit = execFileSync("git", ["-C", repoDir, "rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
for (const cmd of spec.setup ?? []) {
  console.log(`setup: ${cmd}`);
  if (!dryRun && sh(fill(cmd), repoDir).status !== 0) throw new Error(`setup failed: ${cmd}`);
}

// 2. Fresh copies of the fixture, committed so the diff shows only the agent's work.
function workspace(variant: "with" | "without") {
  const ws = join(run, variant);
  if (existsSync(ws)) throw new Error(`${ws} exists; delete the run folder to repeat a test`);
  mkdirSync(ws, { recursive: true });
  if (spec.fixture?.startsWith("git:")) {
    const src = resolve(ROOT, spec.fixture.slice(4));
    execFileSync("sh", ["-c", `git -C "${src}" archive HEAD | tar -x -C "${ws}"`]);
  } else if (spec.fixture) {
    cpSync(join(FIXTURES, spec.fixture), ws, { recursive: true });
  }
  const git = (...args: string[]) => execFileSync("git", ["-C", ws, "-c", "user.name=ordalin-test", "-c", "user.email=test@ordalin.invalid", ...args]);
  git("init", "--quiet");
  git("add", "-A");
  git("commit", "--quiet", "--allow-empty", "-m", "fixture");
  const base = git("rev-parse", "HEAD").toString().trim();
  return { ws, git, base };
}

// Folders where tools leave caches and config; compared before and after the run.
// Also the temp folders, where agents often save screenshots. Entries already there but modified
// during the run are reported separately; the agent CLI's own state (~/.claude*) is left out.
const HOME_DIRS = ["", ".config", ".cache", ".local/share", ".npm/_npx", "Library/Caches", "Library/Application Support"].map((d) => join(homedir(), d)).concat("/tmp", tmpdir());
const snapshot = () =>
  new Map(
    HOME_DIRS.flatMap((d) => (existsSync(d) ? readdirSync(d).map((f) => join(d, f)) : []))
      .filter((p) => !/\/\.claude/.test(p))
      .map((p) => [p, statSafe(p)] as const),
  );
const statSafe = (p: string) => { try { return statSync(p).mtimeMs; } catch { return 0; } };

function claudeArgs(variant: "with" | "without", ws: string, task: string) {
  const args = ["-p", task, "--output-format", "stream-json", "--verbose", "--setting-sources", "project", "--permission-mode", "acceptEdits",
    "--allowedTools", "Bash Read Edit Write Glob Grep WebFetch WebSearch Agent Skill TodoWrite", "--strict-mcp-config"];
  if (flags.model) args.push("--model", flags.model);
  if (variant === "with") {
    const install = spec.install?.claude;
    if (install?.plugin) args.push("--plugin-dir", join(repoDir, install.plugin));
    for (const skill of [install?.skill ?? []].flat()) copySkill(skill, join(ws, ".claude", "skills"));
    if (spec.mcp) {
      const config = { mcpServers: { [spec.name]: { command: fill(spec.mcp.command), args: (spec.mcp.args ?? []).map(fill), env: Object.fromEntries(Object.entries(spec.mcp.env ?? {}).map(([k, v]) => [k, fill(v)])) } } };
      const file = join(run, "mcp.json");
      writeFileSync(file, JSON.stringify(config, null, 2));
      args.push("--mcp-config", file, "--allowedTools", `mcp__${spec.name}`);
    }
  }
  return args;
}

function codexArgs(variant: "with" | "without", ws: string, task: string) {
  const args = ["exec", "--json", "--skip-git-repo-check", "--sandbox", "workspace-write", "-C", ws];
  if (spec.network) args.push("-c", "sandbox_workspace_write.network_access=true");
  if (flags.model) args.push("-m", flags.model);
  if (variant === "with") {
    const skill = spec.install?.codex?.skill;
    if (skill) copySkill(skill, join(ws, ".agents", "skills"));
    if (spec.mcp) {
      args.push("-c", `mcp_servers.${spec.name}.command=${JSON.stringify(fill(spec.mcp.command))}`);
      args.push("-c", `mcp_servers.${spec.name}.args=${JSON.stringify((spec.mcp.args ?? []).map(fill))}`);
      for (const [k, v] of Object.entries(spec.mcp.env ?? {})) args.push("-c", `mcp_servers.${spec.name}.env.${k}=${JSON.stringify(fill(v))}`);
    }
  }
  args.push(task);
  return args;
}

/** What the page needs from Claude Code's event stream. */
function readClaude(jsonl: string) {
  const events = jsonl.split("\n").filter(Boolean).flatMap((line) => { try { return [JSON.parse(line)]; } catch { return []; } });
  const init = events.find((e) => e.type === "system" && e.subtype === "init") ?? {};
  const results = events.filter((e) => e.type === "result");
  const sum = (key: string) => results.reduce((n, r) => n + (Number(r[key]) || 0), 0);
  const toolCalls = events.filter((e) => e.type === "assistant").flatMap((e) => (e.message?.content ?? []).filter((c: { type: string }) => c.type === "tool_use").map((c: { name: string }) => c.name));
  return {
    agentVersion: init.claude_code_version, model: init.model, mcpServers: init.mcp_servers,
    tools: (init.tools ?? []).filter((t: string) => t.startsWith("mcp__")), skills: init.skills, plugins: init.plugins,
    // total_cost_usd is a running total for the session (resumed turns included), so take the last one.
    toolCalls, turns: sum("num_turns"), durationMs: sum("duration_ms"), costUsd: Number(results.at(-1)?.total_cost_usd) || 0, usage: results.map((r) => r.usage),
    error: results.some((r) => r.is_error), answer: results.map((r) => r.result).join("\n\n---\n\n"),
  };
}

const variants = (spec.baseline ? (["with", "without"] as const) : (["with"] as const)).filter((v) => !flags.only || flags.only === v);
const summary: Record<string, unknown> = { spec: spec.name, kind: spec.kind, date: today, agent, repo: spec.repo, commit, runs: {} };

for (const variant of variants) {
  const { ws, git, base } = workspace(variant);
  const task = variant === "with" ? spec.task : spec.baseline!;
  const args = agent === "claude" ? claudeArgs(variant, ws, task) : codexArgs(variant, ws, task);
  const bin = agent === "claude" ? "claude" : "codex";

  if (agent === "codex" && !process.env.CODEX) {
    console.log(`\nCodex runs are started by the maintainer. Run with CODEX=1 set, or by hand:\n  cd "${ws}" && codex ${args.map((a) => JSON.stringify(a)).join(" ")}\n`);
    continue;
  }
  if (dryRun) {
    console.log(`\n[dry run] ${variant}: cd "${ws}" && ${bin} ${args.map((a) => JSON.stringify(a)).join(" ")}`);
    continue;
  }

  console.log(`\n▶ ${spec.name} · ${variant} · ${bin}`);
  const before = snapshot();
  const started = Date.now();
  const proc = spawnSync(bin, args, {
    cwd: ws, encoding: "utf8", maxBuffer: 512 * 1024 * 1024, timeout: (spec.timeoutMinutes ?? 60) * 60_000,
    env: { ...process.env, ...spec.env }, stdio: ["ignore", "pipe", "inherit"],
  });
  let stdout = proc.stdout ?? "";
  // Follow-up messages resume the same Claude Code session.
  for (const message of agent === "claude" ? spec.followUps ?? [] : []) {
    const sessionId = stdout.split("\n").flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } }).findLast((e) => e.type === "result")?.session_id;
    if (!sessionId) break;
    console.log(`  follow-up: ${message.slice(0, 60)}…`);
    const next = spawnSync(bin, [args[0], message, ...args.slice(2), "--resume", sessionId], {
      cwd: ws, encoding: "utf8", maxBuffer: 512 * 1024 * 1024, timeout: (spec.timeoutMinutes ?? 60) * 60_000,
      env: { ...process.env, ...spec.env }, stdio: ["ignore", "pipe", "inherit"],
    });
    stdout += next.stdout ?? "";
  }
  if (agent === "codex" && spec.followUps?.length) console.log("  note: follow-ups are sent for Claude Code only");
  const wallMs = Date.now() - started;
  writeFileSync(join(run, `${variant}.jsonl`), stdout);

  git("add", "-A");
  const exclude = [":(exclude).claude", ":(exclude).agents"];
  // Against the fixture commit, so work the agent committed itself still counts.
  writeFileSync(join(run, `${variant}.diff`), execFileSync("git", ["-C", ws, "diff", "--cached", base, "--", ".", ...exclude], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 }));
  const stat = execFileSync("git", ["-C", ws, "diff", "--cached", base, "--shortstat", "--", ".", ...exclude], { encoding: "utf8" }).trim();

  const after = (spec.after ?? []).map((cmd) => {
    const r = sh(fill(cmd), ws);
    return `$ ${cmd}\n${r.stdout}${r.stderr}`;
  });
  if (after.length) writeFileSync(join(run, `${variant}.after.txt`), after.join("\n"));

  const now = snapshot();
  const leftInHome = [...now.keys()].filter((p) => !before.has(p));
  const changedInHome = [...now].filter(([p, m]) => before.has(p) && before.get(p) !== m).map(([p]) => p);
  (summary.runs as Record<string, unknown>)[variant] = {
    task, exitCode: proc.status, timedOut: proc.error?.message.includes("ETIMEDOUT") ?? false, wallMs, diff: stat, leftInHome, changedInHome,
    ...(agent === "claude" ? readClaude(stdout) : {}),
  };
  console.log(`  exit ${proc.status} · ${Math.round(wallMs / 1000)} s · ${stat || "no file changes"}${leftInHome.length ? ` · new in home: ${leftInHome.join(", ")}` : ""}`);
}

if (dryRun) {
  rmSync(run, { recursive: true, force: true });
} else {
  writeFileSync(join(run, "summary.json"), JSON.stringify(summary, null, 2));
  console.log(`\nSaved in ${run}`);
}
