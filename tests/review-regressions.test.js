const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const homepageScript = fs.readFileSync(path.join(root, "script.js"), "utf8");
const demoScript = fs.readFileSync(path.join(root, "product-demo.js"), "utf8");
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");

test("product demo header and panels remain on-screen at narrow widths", () => {
  assert.match(styles, /\.demo-header\s*\{[^}]*position:\s*fixed/s);
  assert.match(styles, /\.demo-page-copy,\s*\.demo-product-console\s*\{[^}]*min-width:\s*0/s);
  assert.match(styles, /\.demo-product-switcher\s*\{[^}]*flex-wrap:\s*nowrap[^}]*overflow-x:\s*auto/s);
  assert.match(styles, /@media \(max-width:\s*900px\)[\s\S]*?\.demo-page-hero\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
});

test("conditional mobile header state keeps the menu edge aligned", () => {
  assert.match(styles, /@media \(max-width:\s*620px\)[\s\S]*?\.menu-button\s*\{[^}]*grid-column:\s*3[^}]*justify-self:\s*end/s);
});

test("product controls expose active state and honor reduced motion", () => {
  assert.match(homepageScript, /setAttribute\("aria-pressed"/);
  assert.match(homepageScript, /prefers-reduced-motion:\s*reduce/);
  assert.match(demoScript, /aria-current="page"/);
});

test("refined interactive controls retain 44px touch targets", () => {
  assert.match(styles, /\.chat-quick-actions button,[\s\S]*?min-height:\s*44px/);
  assert.match(styles, /\.chat-footer-actions \.button\s*\{[^}]*min-height:\s*44px/s);
  assert.match(styles, /@media \(max-width:\s*620px\)[\s\S]*?\.install-app\s*\{[^}]*min-height:\s*44px/s);
});

test("service worker scopes cache cleanup and preserves API response types offline", () => {
  assert.match(worker, /CACHE_PREFIX/);
  assert.match(worker, /key\.startsWith\(CACHE_PREFIX\)/);
  assert.doesNotMatch(worker, /pathname\.startsWith\("\/api\/carousel"\)/);
  assert.match(worker, /new Response\(JSON\.stringify/);
  assert.match(worker, /"Content-Type": "application\/json/);
});
