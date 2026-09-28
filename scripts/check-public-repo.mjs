// A small publication guard, not a replacement for a dedicated secret scanner.
// Report locations only: never print a matching credential or file contents.
import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync } from "node:fs";

const git = (...args) => execFileSync("git", args, { maxBuffer: 64 * 1024 * 1024 });
const forbidden = /(^|\/)(?:\.env(?:\..*)?|\.dev\.vars(?:\..*)?|wrangler\.production\.jsonc|\.wrangler|\.ordalin-imports|\.next|\.open-next|node_modules|backups|exports)(?:\/|$)|\.(?:pem|key|p12|pfx|db|sqlite3?)(?:-[\w]+)?$/;
const examples = new Set([".env.example", ".dev.vars.example"]);
const patterns = [
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g],
  ["provider credential", /(?:sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{24,}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{20,})/g],
  ["literal JWT", /eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}/g],
];
const findings = new Set();
let files = 0;
let versions = 0;
function check(name, data, revision = "working tree") {
  if (!examples.has(name) && forbidden.test(name)) findings.add(`${revision}: ${name}: private artifact`);
  if (data.includes(0)) return;
  const text = data.toString("utf8");
  for (const [label, pattern] of patterns) {
    for (const match of text.matchAll(pattern)) {
      const line = text.slice(0, match.index).split("\n").length;
      findings.add(`${revision}: ${name}:${line}: ${label}`);
    }
  }
}
for (const name of new Set(git("ls-files", "-z", "--cached", "--others", "--exclude-standard").toString().split("\0").filter(Boolean))) {
  if (!existsSync(name) || !lstatSync(name).isFile()) continue;
  check(name, readFileSync(name));
  files++;
}
if (process.argv.includes("--history")) {
  const objects = git("rev-list", "--objects", "--all").toString().trim().split("\n");
  const metadata = execFileSync("git", ["cat-file", "--batch-check=%(objectname) %(objecttype) %(rest)"], {
    input: objects.join("\n") + "\n", maxBuffer: 64 * 1024 * 1024,
  }).toString();
  for (const entry of metadata.trim().split("\n")) {
    const match = /^(\w+) blob (.+)$/.exec(entry);
    if (!match) continue;
    check(match[2], git("cat-file", "blob", match[1]), `blob ${match[1].slice(0, 10)}`);
    versions++;
  }
}
if (findings.size) {
  console.error([...findings].join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Publication guard passed: ${files} current files${versions ? ` and ${versions} historical file versions` : ""}.`);
  console.log("Checks known credential formats and private artifact paths; manual review is still required.");
}
