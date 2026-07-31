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
test("contact section provides a responsive light-to-dark transition band", () => {
  const finalVisualSystem = styles.slice(styles.indexOf("/* 2026 wide visual system and support refinement */"));

  assert.match(finalVisualSystem, /\.contact-section::before\s*\{[^}]*inset:\s*-72px 0 auto;[^}]*height:\s*72px;[^}]*linear-gradient/s);
  assert.match(finalVisualSystem, /@media \(max-width:\s*620px\)[\s\S]*?\.contact-section::before\s*\{[^}]*inset:\s*-48px 0 auto;[^}]*height:\s*48px/s);
  assert.match(finalVisualSystem, /@media \(max-width:\s*620px\)[\s\S]*?\.support-action svg\s*\{[^}]*width:\s*30px;[^}]*height:\s*30px/s);
});
