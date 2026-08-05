const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("admin editor starts behind an authenticated inert login gate", () => {
  const html = read("by-admin.html");
  const script = read("admin.js");

  assert.match(html, /data-admin-login-form/);
  assert.match(html, /type="password"[^>]*autocomplete="current-password"/);
  assert.match(html, /data-admin-shell[^>]*hidden[^>]*inert|data-admin-shell[^>]*inert[^>]*hidden/);
  assert.match(html, /data-admin-logout/);
  assert.match(script, /fetch\("\/api\/admin-auth"/);
  assert.match(script, /authenticated/);
  assert.match(script, /csrfToken/);
  assert.match(script, /"X-CSRF-Token": csrfToken/);
  assert.match(script, /method: "DELETE"/);
  assert.match(script, /showLogin/);
});

test("admin uploads are bounded raster files and never advertise SVG or remote image URLs", () => {
  const html = read("by-admin.html");
  const script = read("admin.js");
  const siteData = read("data/siteData.js");

  assert.match(script, /MAX_IMAGE_BYTES\s*=\s*2 \* 1024 \* 1024/);
  assert.match(script, /image\/png/);
  assert.match(script, /image\/jpeg/);
  assert.match(script, /image\/webp/);
  assert.match(script, /image\/avif/);
  assert.match(script, /arrayBuffer\(\)/);
  assert.doesNotMatch(html + script + siteData, /image\/svg\+xml|AVIF, or SVG|full https:\/\/ URL/);
  assert.match(script, /accept="image\/png,image\/jpeg,image\/webp,image\/avif"/);
});

test("strict CSP compatibility leaves service-worker registration in external scripts only", () => {
  const homepage = read("index.html");
  const demo = read("product-demo.html");
  const homepageScript = read("script.js");
  const demoScript = read("product-demo.js");
  const inlineScriptPattern = /<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/gi;

  assert.equal((homepage.match(inlineScriptPattern) || []).length, 0);
  assert.equal((demo.match(inlineScriptPattern) || []).length, 0);
  assert.match(homepageScript, /navigator\.serviceWorker\.register\("\/service-worker\.js"\)/);
  assert.match(demoScript, /navigator\.serviceWorker\.register\("\/service-worker\.js"\)/);
});

test("every homepage lead flow submits honeypot and elapsed-time fields", () => {
  const html = read("index.html");
  const script = read("script.js");

  assert.equal((html.match(/name="website"/g) || []).length, 4);
  assert.equal((html.match(/name="formStartedAt"/g) || []).length, 4);
  assert.match(script, /prepareSecureForm/);
  assert.match(script, /website:\s*data\.website/);
  assert.match(script, /formStartedAt:\s*Number\(data\.formStartedAt\)/);
  assert.match(read("styles.css"), /\.form-honeypot\s*\{/);
});