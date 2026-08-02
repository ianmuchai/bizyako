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
test("support launchers use crisp filled marks and accessible targets", () => {
  const homepage = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const finalVisualSystem = styles.slice(styles.indexOf("/* 2026 wide visual system and support refinement */"));

  assert.equal((homepage.match(/class="launcher-bubble"/g) || []).length, 1);
  assert.match(homepage, /id="assistantLauncherGradient"/);
  assert.equal((homepage.match(/class="chat-dot"/g) || []).length, 3);
  assert.match(finalVisualSystem, /\.support-action svg\s*\{[^}]*width:\s*40px;[^}]*height:\s*40px;[^}]*overflow:\s*visible;[^}]*drop-shadow/s);
  assert.match(finalVisualSystem, /\.support-action:hover svg,\s*\.support-action\.active svg\s*\{[^}]*transform:\s*translateY\(-2px\) scale\(1\.06\);/s);
  assert.match(finalVisualSystem, /@media \(max-width:\s*620px\)[\s\S]*?\.support-action svg\s*\{[^}]*width:\s*38px;[^}]*height:\s*38px;/s);
  assert.match(finalVisualSystem, /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.support-action svg,[\s\S]*?\.chat-dot\s*\{[^}]*animation:\s*none;/s);

  const supportBlock = finalVisualSystem.match(/\.support-action\s*\{([^}]*)\}/s);
  assert.ok(supportBlock);
  assert.match(supportBlock[1], /background:\s*transparent;/);
  assert.match(supportBlock[1], /border:\s*0;/);
  assert.match(supportBlock[1], /border-radius:\s*0;/);
  assert.match(supportBlock[1], /box-shadow:\s*none;/);
});

test("WhatsApp launcher uses the WhatsApp-authored brand mark", () => {
  const homepage = fs.readFileSync(path.join(root, "index.html"), "utf8");

  assert.match(homepage, /<svg data-whatsapp-mark viewBox="0 0 360 362"/);
  assert.doesNotMatch(homepage, /id="whatsappLauncherGradient"/);
  assert.match(homepage, /class="whatsapp-mark"[^>]*d="M307\.546 52\.5655C273\.709 18\.685[^"]*"[^>]*fill="#25D366"/);
});

test("support rail floats near the viewport midpoint without moving the assistant panel", () => {
  const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const finalVisualSystem = styles.slice(styles.indexOf("/* 2026 wide visual system and support refinement */"));

  assert.match(finalVisualSystem, /\.support-hub\s*\{[^}]*top:\s*52%;[^}]*right:\s*18px;[^}]*bottom:\s*auto;[^}]*transform:\s*translateY\(-50%\)/s);
  assert.match(finalVisualSystem, /@media \(max-width:\s*620px\)[\s\S]*?\.support-hub\s*\{[^}]*top:\s*58%;[^}]*right:\s*10px;[^}]*bottom:\s*auto;/s);
  assert.match(finalVisualSystem, /\.chat-panel\s*\{[^}]*bottom:\s*18px/s);
});

test("mobile support rail has a dedicated no-overlap control lane", () => {
  const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const finalVisualSystem = styles.slice(styles.indexOf("/* 2026 wide visual system and support refinement */"));

  assert.match(finalVisualSystem, /@media \(max-width:\s*620px\)[\s\S]*?\.hero-carousel-controls,\s*\.enhanced-signals\s*\{[^}]*max-width:\s*calc\(100% - 58px\);/s);
});
