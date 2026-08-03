const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
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
  assert.match(policy, /use .*app\.js.*startup file/i);
  assert.match(read(".gitignore"), /BIZYAKO_SECURITY_SETUP\.txt/);
});

test("Vercel publishes only the approved static surface", () => {
  const ignorePath = path.join(root, ".vercelignore");
  const buildPath = path.join(root, "scripts", "build-vercel-static.js");
  assert.equal(fs.existsSync(ignorePath), true, "expected a repository-level .vercelignore");
  assert.equal(fs.existsSync(buildPath), true, "expected a Vercel static-output builder");

  const ignore = fs.readFileSync(ignorePath, "utf8");
  for (const requirement of [".env*", ".security/", "BIZYAKO_SECURITY_SETUP.txt", ".worktrees/", "node_modules/", "tests/", "docs/", "*.zip", "namecheap-*/"]) {
    assert.ok(ignore.split(/\r?\n/).includes(requirement), `expected ${requirement} in .vercelignore`);
  }

  const config = JSON.parse(read("vercel.json"));
  assert.equal(config.buildCommand, "node scripts/build-vercel-static.js");
  assert.equal(config.outputDirectory, "dist");

  const { buildStaticOutput } = require(buildPath);
  const output = fs.mkdtempSync(path.join(os.tmpdir(), "bizyako-vercel-output-"));
  try {
    buildStaticOutput({ root, output });
    for (const publicFile of [
      "index.html",
      "by-admin.html",
      "product-demo.html",
      "styles.css",
      "script.js",
      "admin.js",
      "product-demo.js",
      "service-worker.js",
      "manifest.webmanifest",
      path.join("assets", "bizyako-logo.png"),
      path.join("data", "site-static.json"),
      path.join(".well-known", "security.txt"),
    ]) {
      assert.equal(fs.existsSync(path.join(output, publicFile)), true, `expected public output ${publicFile}`);
    }
    for (const privatePath of ["app.js", "server.js", "SECURITY.md", "lib", "scripts", "tests", path.join("data", "siteData.js"), path.join("data", "carouselSlides.json")]) {
      assert.equal(fs.existsSync(path.join(output, privatePath)), false, `did not expect private output ${privatePath}`);
    }
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});
test("cPanel rejects private source paths before the Node runtime", () => {
  const apache = read(".htaccess");
  assert.match(apache, /RewriteRule \^\(\?:lib\|scripts\|tests\|docs\|\\\.github\|\\\.security\|\\\.worktrees\|dist\)/);
  assert.match(apache, /RewriteRule \^data\/\(\?!site-static\\\.json\$\)/);
  assert.match(apache, /RewriteRule \^api\/\.\*\\\.js\$/);
  assert.match(apache, /SECURITY\\\.md/);
  assert.match(apache, /app\\\.js/);
});