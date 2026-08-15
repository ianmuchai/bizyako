const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("carousel exposes a compact pause control with an announced state", () => {
  const homepage = read("index.html");
  const script = read("script.js");

  assert.match(homepage, /data-hero-toggle/);
  assert.match(homepage, /aria-label="Pause carousel"/);
  assert.match(script, /heroCarouselPaused/);
  assert.match(script, /aria-label["'],\s*heroCarouselPaused \? "Play carousel" : "Pause carousel"/);
});

test("carousel pauses off-screen and for reduced motion, and supports arrow keys", () => {
  const script = read("script.js");

  assert.match(script, /visibilitychange/);
  assert.match(script, /document\.hidden/);
  assert.match(script, /prefersReducedMotion/);
  assert.match(script, /ArrowLeft/);
  assert.match(script, /ArrowRight/);
});

test("carousel preloads the next optimized poster without eager-loading every slide", () => {
  const script = read("script.js");

  assert.match(script, /const preloadHeroImage/);
  assert.match(script, /new Image\(\)/);
  assert.match(script, /preloadHeroImage\(heroSlides\[\(activeHeroIndex \+ 1\) % heroSlides\.length\]\.image\)/);
});


test("five fallback controls prevent hydration shift and preserve user selection", () => {
  const homepage = read("index.html");
  const script = read("script.js");

  assert.match(homepage, /data-hero-slide="4"[^>]*><span>05<\/span>Retail/);
  assert.match(script, /label: "Operations"/);
  assert.match(script, /label: "Retail"/);
  assert.match(script, /const preservedHeroIndex = Math.min\(activeHeroIndex, heroSlides.length - 1\);/);
  assert.match(script, /setHeroSlide\(preservedHeroIndex\)/);
});
