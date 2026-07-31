const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const styles = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");

test("hero grid children can shrink within a mobile viewport", () => {
  assert.match(styles, /\.hero-mainline,\s*\.hero-console\s*\{[^}]*min-width:\s*0/s);
  assert.match(styles, /@media \(max-width:\s*620px\)[\s\S]*?\.upgraded-hero\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
});

test("dense hero controls scroll instead of widening the page", () => {
  assert.match(
    styles,
    /\.hero-carousel-controls\s*\{[^}]*display:\s*flex[^}]*flex-wrap:\s*nowrap[^}]*max-width:\s*100%[^}]*overflow-x:\s*auto/s
  );
});
test("rotating hero messages use a balanced professional type scale", () => {
  const finalVisualSystem = styles.slice(styles.indexOf("/* 2026 wide visual system and support refinement */"));

  assert.match(finalVisualSystem, /\.hero h1\s*\{[^}]*max-width:\s*620px;[^}]*font-size:\s*3rem;/s);
  assert.match(finalVisualSystem, /\.hero-copy\s*\{[^}]*max-width:\s*570px;[^}]*font-size:\s*\.96rem;[^}]*line-height:\s*1\.52;/s);
});
test("contact transition stays inside the dark section and behind its content", () => {
  const finalVisualSystem = styles.slice(styles.indexOf("/* 2026 wide visual system and support refinement */"));
  const transitionRule = finalVisualSystem.match(/\.contact-section::before\s*\{[^}]*\}/s);

  assert.ok(transitionRule, "expected a contact transition rule");
  assert.match(transitionRule[0], /inset:\s*0 0 auto;/);
  assert.match(transitionRule[0], /height:\s*48px;/);
  assert.match(transitionRule[0], /pointer-events:\s*none;/);
  assert.match(transitionRule[0], /z-index:\s*0;/);
  assert.match(transitionRule[0], /linear-gradient/);
  assert.doesNotMatch(transitionRule[0], /(?:backdrop-)?filter\s*:/);
  assert.match(finalVisualSystem, /\.contact-section\s*>\s*\*\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*1;/s);
  assert.match(finalVisualSystem, /@media \(max-width:\s*620px\)[\s\S]*?\.contact-section::before\s*\{[^}]*inset:\s*0 0 auto;[^}]*height:\s*32px/s);
});
