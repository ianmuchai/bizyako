const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("security.txt publishes the canonical BizYako disclosure contact", () => {
  const securityText = read(path.join(".well-known", "security.txt"));
  assert.match(securityText, /^Contact: mailto:hello@bizyako\.com$/m);
  assert.match(securityText, /^Canonical: https:\/\/bizyako\.com\/\.well-known\/security\.txt$/m);
  assert.match(securityText, /^Preferred-Languages: en$/m);
  assert.match(securityText, /^Expires: 2027-07-31T23:59:59Z$/m);
  assert.match(read("server.js"), /"\/\.well-known\/security\.txt"/);
});

test("security CI runs tests, syntax checks, audit, and secret scanning on Node 20", () => {
  const workflow = read(path.join(".github", "workflows", "security.yml"));
  assert.match(workflow, /node-version:\s*20/);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm run syntax:check/);
  assert.match(workflow, /npm audit --omit=dev/);
  assert.match(workflow, /npm run security:scan/);

  const packageJson = JSON.parse(read("package.json"));
  assert.ok(packageJson.scripts["syntax:check"]);
  assert.ok(packageJson.scripts["security:scan"]);
  assert.match(read(path.join("scripts", "scan-secrets.js")), /PRIVATE KEY|BIZYAKO_SESSION_SECRET/);
});

test("the owner runbook covers setup, rotation, lockout, hosting, firewall, and recovery", () => {
  const policy = read("SECURITY.md");
  for (const requirement of [
    "security:credentials",
    "BIZYAKO_ADMIN_PASSWORD_HASH",
    "BIZYAKO_SESSION_SECRET",
    "BIZYAKO_ALLOWED_ORIGINS",
    "rotation",
    "Emergency lockout",
    "DNSSEC",
    "CAA",
    "log-only",
    "recovery",
    "cPanel",
    "Vercel",
  ]) {
    assert.match(policy, new RegExp(requirement, "i"));
  }
  assert.match(read(".gitignore"), /BIZYAKO_SECURITY_SETUP\.txt/);
});