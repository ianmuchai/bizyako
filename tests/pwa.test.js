const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

test("manifest defines an installable standalone BizYako app", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8"));
  assert.equal(manifest.name, "BizYako");
  assert.equal(manifest.short_name, "BizYako");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.scope, "/");
  assert.equal(manifest.display, "standalone");
  assert.deepEqual(manifest.icons.map((icon) => icon.sizes), ["192x192", "512x512"]);
});

test("service worker protects private admin and mutation routes from caching", () => {
  const source = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
  assert.match(source, /by-admin/);
  assert.match(source, /request\.method !== "GET"/);
  assert.match(source, /caches\.delete/);
  assert.match(source, /index\.html/);
});

test("public pages link the manifest and register the service worker", () => {
  const homepage = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const demo = fs.readFileSync(path.join(root, "product-demo.html"), "utf8");
  assert.match(homepage, /rel="manifest"/);
  assert.match(homepage, /service-worker\.js/);
  assert.match(demo, /rel="manifest"/);
});
test("public assets and shell cache are versioned for reliable updates", () => {
  const homepage = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const demo = fs.readFileSync(path.join(root, "product-demo.html"), "utf8");
  const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
  assert.match(homepage, /styles\.css\?v=20260727/);
  assert.match(homepage, /script\.js\?v=20260727/);
  assert.match(demo, /styles\.css\?v=20260727/);
  assert.match(worker, /bizyako-shell-v3/);
});
