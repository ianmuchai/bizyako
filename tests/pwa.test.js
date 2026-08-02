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

test("public pages link the manifest and register the service worker externally", () => {
  const homepage = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const demo = fs.readFileSync(path.join(root, "product-demo.html"), "utf8");
  const homepageScript = fs.readFileSync(path.join(root, "script.js"), "utf8");
  const demoScript = fs.readFileSync(path.join(root, "product-demo.js"), "utf8");
  assert.match(homepage, /rel="manifest"/);
  assert.match(demo, /rel="manifest"/);
  assert.match(homepageScript, /navigator\.serviceWorker\.register\("\/service-worker\.js"\)/);
  assert.match(demoScript, /navigator\.serviceWorker\.register\("\/service-worker\.js"\)/);
});
test("public assets and shell cache are versioned for reliable updates", () => {
  const homepage = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const demo = fs.readFileSync(path.join(root, "product-demo.html"), "utf8");
  const admin = fs.readFileSync(path.join(root, "by-admin.html"), "utf8");
  const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
  const publicFiles = [homepage, demo, admin, worker];

  assert.match(homepage, /styles\.css\?v=20260802-3/);
  assert.match(homepage, /script\.js\?v=20260802-3/);
  assert.match(demo, /styles\.css\?v=20260802-3/);
  assert.match(demo, /product-demo\.js\?v=20260802-3/);
  assert.match(admin, /styles\.css\?v=20260802-3/);
  assert.match(admin, /admin\.js\?v=20260802-3/);
  assert.match(worker, /bizyako-shell-v8/);
  assert.match(worker, /20260802-3/);
  publicFiles.forEach((source) => {
    assert.doesNotMatch(source, /bizyako-shell-v7|20260802-2|bizyako-shell-v6|20260802-1|bizyako-shell-v5|20260731-2/);
  });
});