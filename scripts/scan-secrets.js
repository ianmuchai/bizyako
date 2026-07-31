"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const root = path.join(__dirname, "..");
const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: root })
  .toString("utf8")
  .split("\0")
  .filter(Boolean);
const rules = [
  { name: "private key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: "GitHub token", pattern: /gh[pousr]_[A-Za-z0-9]{20,}/ },
  { name: "OpenAI-style token", pattern: /sk-(?:proj-)?[A-Za-z0-9_-]{20,}/ },
  { name: "Slack token", pattern: /xox[baprs]-[A-Za-z0-9-]{20,}/ },
  { name: "BIZYAKO_SESSION_SECRET value", pattern: /BIZYAKO_SESSION_SECRET\s*[:=]\s*["']?[A-Za-z0-9_-]{40,}/, ignoreTests: true },
  { name: "BIZYAKO admin hash value", pattern: /BIZYAKO_ADMIN_PASSWORD_HASH\s*[:=]\s*["']?scrypt\$v1\$[A-Za-z0-9_-]{10,}\$[A-Za-z0-9_-]{20,}/, ignoreTests: true },
  { name: "one-time admin password", pattern: /ONE_TIME_ADMIN_PASSWORD\s*=\s*[^<\s].{19,}/, ignoreTests: true },
  { name: "deployment password", pattern: /DEPLOY_SSH_PASSWORD\s*[:=]\s*["']?[^<\s]{12,}/, ignoreTests: true },
];
const findings = [];

for (const relativePath of tracked) {
  const fullPath = path.join(root, relativePath);
  let content;
  try {
    const bytes = fs.readFileSync(fullPath);
    if (bytes.includes(0)) continue;
    content = bytes.toString("utf8");
  } catch {
    continue;
  }
  for (const rule of rules) {
    if (rule.ignoreTests && (relativePath.startsWith("tests/") || relativePath.startsWith("tests\\"))) continue;
    if (rule.pattern.test(content)) findings.push(`${relativePath}: ${rule.name}`);
  }
}

if (findings.length) {
  process.stderr.write(`Potential tracked secrets found:\n${findings.join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`Secret pattern scan passed across ${tracked.length} tracked files.\n`);