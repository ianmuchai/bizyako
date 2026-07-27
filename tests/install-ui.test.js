const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

test("homepage provides a conditional PWA install control", () => {
  const homepage = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(homepage, /data-install-app/);
  assert.match(homepage, /aria-label="Install BizYako app"/);
});

test("install control handles the browser install lifecycle", () => {
  const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
  assert.match(script, /beforeinstallprompt/);
  assert.match(script, /installPrompt\.prompt\(\)/);
  assert.match(script, /appinstalled/);
});

test("install control is hidden until it is available", () => {
  const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  assert.match(styles, /\.install-app\s*\{[^}]*display:\s*none/s);
  assert.match(styles, /\.install-app\.available\s*\{[^}]*display:\s*inline-flex/s);
});
