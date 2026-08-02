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
test("contact section uses a crisp divider without an overlapping transition layer", () => {
  const finalVisualSystem = styles.slice(styles.indexOf("/* 2026 wide visual system and support refinement */"));

  assert.match(finalVisualSystem, /\.contact-section\s*\{[^}]*border-top:\s*2px solid #08b893;/s);
  assert.doesNotMatch(finalVisualSystem, /\.contact-section::before\s*\{/);
});

test("hero posters remain visible behind localized glass surfaces", () => {
  const finalVisualSystem = styles.slice(styles.indexOf("/* 2026 wide visual system and support refinement */"));

  assert.match(finalVisualSystem, /\.hero-overlay\s*\{[^}]*rgba\(3, 12, 17, \.32\)[^}]*rgba\(3, 17, 22, \.04\)/s);
  assert.match(finalVisualSystem, /\.hero-mainline\s*\{[^}]*backdrop-filter:\s*blur\(20px\) saturate\(1\.2\)/s);
  assert.match(finalVisualSystem, /\.hero-transitioning \.hero-art\s*\{[^}]*opacity:\s*\.92/s);
});
