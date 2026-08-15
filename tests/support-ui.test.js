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

test("support rail floats near the viewport midpoint with a raised assistant panel", () => {
  const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const finalVisualSystem = styles.slice(styles.indexOf("/* 2026 wide visual system and support refinement */"));

  assert.match(finalVisualSystem, /\.support-hub\s*\{[^}]*top:\s*52%;[^}]*right:\s*18px;[^}]*bottom:\s*auto;[^}]*transform:\s*translateY\(-50%\)/s);
  assert.match(finalVisualSystem, /@media \(max-width:\s*620px\)[\s\S]*?\.support-hub\s*\{[^}]*top:\s*58%;[^}]*right:\s*10px;[^}]*bottom:\s*auto;/s);
  assert.match(finalVisualSystem, /\.chat-panel\s*\{[^}]*bottom:\s*72px/s);
});

test("mobile support launchers stack vertically above the viewport edge", () => {
  const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const mobileSystem = styles.slice(styles.indexOf("/* Mobile experience refinement */"));

  assert.match(
    mobileSystem,
    /@media \(max-width:\s*620px\)[\s\S]*?\.support-hub\s*\{[^}]*top:\s*auto;[^}]*bottom:\s*max\(96px,\s*env\(safe-area-inset-bottom\)\);[^}]*grid-template-columns:\s*50px;/s
  );
});

test("footer contact items form a horizontal grid at every responsive size", () => {
  const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const mobileSystem = styles.slice(styles.indexOf("/* Mobile experience refinement */"));

  assert.match(
    mobileSystem,
    /\.footer-contact-panel\s*\{[^}]*grid-column:\s*1 \/ -1;[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\);/s
  );
  assert.match(
    mobileSystem,
    /@media \(max-width:\s*620px\)[\s\S]*?\.footer-contact-panel\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/s
  );
  assert.match(
    mobileSystem,
    /@media \(max-width:\s*620px\)[\s\S]*?\.footer-grid\s*\{[^}]*grid-template-columns:\s*1fr;/s
  );
});
test("advisor panel omits conversion prompts and floats above the viewport edge", () => {
  const homepage = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
  const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const focusedAdvisor = styles.slice(styles.indexOf("/* Focused advisor */"));

  assert.doesNotMatch(homepage, /Focused on BizYako products|Define a product|Talk to a specialist/);
  assert.doesNotMatch(homepage + script, /data-chat-lead-toggle|chatLeadForm|appendChatActions/);
  assert.match(focusedAdvisor, /\.chat-panel\s*\{[^}]*bottom:\s*72px;/s);
  assert.match(focusedAdvisor, /@media \(max-width:\s*760px\)[\s\S]*?\.chat-panel\s*\{[^}]*bottom:\s*max\(24px,\s*env\(safe-area-inset-bottom\)\);/s);
});
