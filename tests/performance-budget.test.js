const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  PERFORMANCE_BUDGETS,
  enforcePerformanceBudgets,
} = require("../scripts/build-vercel-static");

const root = path.join(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("production build enforces explicit critical-file and first-view budgets", () => {
  assert.deepEqual(PERFORMANCE_BUDGETS.files, {
    "index.html": 45 * 1024,
    "styles.css": 110 * 1024,
    "script.js": 70 * 1024,
    "assets/bizyako-carousel-impact.webp": 150 * 1024,
  });
  assert.equal(PERFORMANCE_BUDGETS.firstView, 400 * 1024);
  assert.doesNotThrow(() => enforcePerformanceBudgets(root));
});

test("cPanel enables compression and immutable caching for versioned public assets", () => {
  const apache = read(".htaccess");
  assert.match(apache, /AddOutputFilterByType DEFLATE text\/html text\/plain text\/css application\/javascript application\/json image\/svg\+xml/);
  assert.match(apache, /public, max-age=31536000, immutable/);
  assert.match(apache, /<FilesMatch "\\\.\(html\|json\|webmanifest\|xml\|txt\)\$">[\s\S]*?no-store, max-age=0/s);
});

test("Vercel gives static assets immutable cache headers while keeping the worker fresh", () => {
  const config = JSON.parse(read("vercel.json"));
  const staticPolicies = config.headers.filter((entry) => entry.headers.some((header) => header.value === "public, max-age=31536000, immutable"));
  assert.ok(staticPolicies.some((entry) => entry.source === "/assets/(.*)"));
  assert.ok(staticPolicies.some((entry) => entry.source.includes("css|js")));

  const workerPolicy = config.headers.find((entry) => entry.source === "/service-worker.js");
  assert.equal(workerPolicy.headers.find((header) => header.key === "Cache-Control").value, "no-store, max-age=0");
});
