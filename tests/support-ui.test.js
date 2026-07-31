const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

test("chat launcher uses three animated conversation dots", () => {
  const homepage = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const dots = homepage.match(/class="chat-dot"/g) || [];
  assert.equal(dots.length, 3);

  const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  assert.match(styles, /@keyframes chatDot/);
});

test("floating support controls expose standalone glyphs without launcher surfaces", () => {
  const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const finalVisualSystem = styles.slice(styles.indexOf("/* 2026 wide visual system and support refinement */"));

  assert.match(finalVisualSystem, /\.support-action\s*\{[^}]*width:\s*54px;[^}]*height:\s*54px;[^}]*border:\s*0;[^}]*border-radius:\s*0;[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;/s);
  assert.match(finalVisualSystem, /\.whatsapp-action\s*\{[^}]*background:\s*transparent;/s);
  assert.match(finalVisualSystem, /\.chat-action\s*\{[^}]*background:\s*transparent;/s);
  assert.match(styles, /\.whatsapp-action::before,[\s\S]*display:\s*none;/);
});

test("assistant panel is bottom anchored with compact type", () => {
  const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  assert.match(styles, /\.chat-panel\s*\{[^}]*bottom:/s);
  assert.match(styles, /\.chat-panel\s*\{[^}]*font-size:\s*0\.86rem/s);
});
test("standalone support glyphs retain contrast across light and dark sections", () => {
  const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const finalVisualSystem = styles.slice(styles.indexOf("/* 2026 wide visual system and support refinement */"));

  assert.match(finalVisualSystem, /\.support-action svg\s*\{[^}]*width:\s*32px;[^}]*height:\s*32px;[^}]*drop-shadow\(0 0 1px rgba\(255, 255, 255, \.95\)\)[^}]*drop-shadow\(0 3px 8px rgba\(1, 10, 15, \.66\)\)/s);
  assert.match(finalVisualSystem, /\.support-action svg path\[stroke\]\s*\{[^}]*stroke-width:\s*2\.65/s);
  const supportBlock = finalVisualSystem.match(/\.support-action\s*\{([^}]*)\}/s);
  assert.ok(supportBlock);
  assert.match(supportBlock[1], /background:\s*transparent;/);
  assert.doesNotMatch(supportBlock[1], /background:\s*(?:#|rgb|hsl|linear|radial|url)/i);
});
