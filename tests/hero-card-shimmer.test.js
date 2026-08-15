const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

test("the two first-viewport hero cards receive a restrained accessible shimmer", () => {
  const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const shimmerStart = styles.indexOf("/* Hero glass shimmer */");
  const shimmerEnd = styles.indexOf("/* Mobile experience refinement */", shimmerStart);

  assert.notEqual(shimmerStart, -1);
  assert.notEqual(shimmerEnd, -1);
  const shimmer = styles.slice(shimmerStart, shimmerEnd);

  assert.match(shimmer, /\.hero-mainline,\s*\.hero-console\s*\{[^}]*position:\s*relative;[^}]*overflow:\s*hidden;[^}]*isolation:\s*isolate;/s);
  assert.match(shimmer, /\.hero-mainline::before,\s*\.hero-console::before\s*\{[^}]*pointer-events:\s*none;[^}]*linear-gradient\([^}]*animation:\s*heroCardShimmer\s+7\.6s\s+cubic-bezier\([^)]*\)\s+infinite;/s);
  assert.match(shimmer, /\.hero-console::before\s*\{[^}]*animation-delay:\s*3\.8s;/s);
  assert.match(shimmer, /\.hero-mainline\s*>\s*\*,\s*\.hero-console\s*>\s*\*\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*1;/s);
  assert.match(shimmer, /@keyframes\s+heroCardShimmer\s*\{/);
  assert.match(shimmer, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.hero-mainline::before,\s*\.hero-console::before\s*\{[^}]*animation:\s*none;/s);
  assert.doesNotMatch(shimmer, /\.feature-card|\.industry-card|\.timeline|\.product-showcase|\.trust-band/);
});
