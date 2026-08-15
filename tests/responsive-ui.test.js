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
test("mobile hero controls stay inside the viewport as a three-part selector", () => {
  const mobileSystem = styles.slice(styles.indexOf("/* Mobile experience refinement */"));

  assert.match(
    mobileSystem,
    /@media \(max-width:\s*620px\)[\s\S]*?\.hero-carousel-controls\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);[^}]*overflow:\s*visible;/s
  );
  assert.match(
    mobileSystem,
    /\.hero-carousel-controls button\s*\{[^}]*min-width:\s*0;[^}]*padding:\s*8px 5px;[^}]*font-size:\s*\.72rem;/s
  );
});

test("mobile typography and spacing use a compact readable scale", () => {
  const mobileSystem = styles.slice(styles.indexOf("/* Mobile experience refinement */"));

  assert.match(mobileSystem, /\.hero h1\s*\{[^}]*font-size:\s*1\.9rem;[^}]*line-height:\s*1\.1;/s);
  assert.match(
    mobileSystem,
    /\.section-heading h2,\s*\.contact-section h2\s*\{[^}]*font-size:\s*1\.65rem;/s
  );
  assert.match(mobileSystem, /\.product-copy h3\s*\{[^}]*font-size:\s*1\.7rem;/s);
  assert.match(
    mobileSystem,
    /\.section,\s*\.industries,\s*\.contact-section,\s*\.demo-page-body,\s*\.demo-page-cta\s*\{[^}]*padding:\s*52px 16px;/s
  );
});

test("mobile product chips scroll cleanly without narrowing the content lane", () => {
  const mobileSystem = styles.slice(styles.indexOf("/* Mobile experience refinement */"));

  assert.match(
    mobileSystem,
    /\.enhanced-signals\s*\{[^}]*max-width:\s*100%;[^}]*overflow-x:\s*auto;[^}]*scroll-snap-type:\s*x proximity;/s
  );
  assert.match(mobileSystem, /\.enhanced-signals button\s*\{[^}]*scroll-snap-align:\s*start;/s);
});
test("contact section uses a crisp divider without an overlapping transition layer", () => {
  const finalVisualSystem = styles.slice(styles.indexOf("/* 2026 wide visual system and support refinement */"));

  assert.match(finalVisualSystem, /\.contact-section\s*\{[^}]*border-top:\s*2px solid #08b893;/s);
  assert.doesNotMatch(finalVisualSystem, /\.contact-section::before\s*\{/);
});

test("hero posters remain visible behind localized glass surfaces", () => {
  const finalVisualSystem = styles.slice(styles.indexOf("/* 2026 wide visual system and support refinement */"));

  assert.match(finalVisualSystem, /\.hero-overlay\s*\{[^}]*rgba\(3, 12, 17, \.32\)[^}]*rgba\(3, 17, 22, \.04\)/s);
  assert.match(finalVisualSystem, /\.hero-mainline\s*\{[^}]*rgba\(3, 18, 23, \.7\)[^}]*rgba\(3, 18, 23, \.52\)/s);
  assert.match(finalVisualSystem, /\.hero-mainline\s*\{[^}]*backdrop-filter:\s*blur\(20px\) saturate\(1\.2\)/s);
  assert.match(finalVisualSystem, /\.hero-console\s*\{[^}]*rgba\(5, 25, 31, \.72\)[^}]*rgba\(6, 20, 28, \.58\)/s);
  assert.match(finalVisualSystem, /\.hero-transitioning \.hero-art\s*\{[^}]*opacity:\s*\.92/s);
});
