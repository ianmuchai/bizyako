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

test("floating support controls have no visible boundary", () => {
  const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  assert.match(styles, /\.support-action\s*\{[^}]*border:\s*0;/s);
  assert.match(styles, /\.whatsapp-action::before,[\s\S]*display:\s*none;/);
});

test("assistant panel is bottom anchored with compact type", () => {
  const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  assert.match(styles, /\.chat-panel\s*\{[^}]*bottom:/s);
  assert.match(styles, /\.chat-panel\s*\{[^}]*font-size:\s*0\.86rem/s);
});
