const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const posters = [
  { file: "assets/bizyako-carousel-impact.png", width: 1672, height: 941 },
  { file: "assets/bizyako-carousel-growth.png", width: 1672, height: 941 },
  { file: "assets/bizyako-carousel-wave.png", width: 1717, height: 916 },
];
const optimizedPosters = [
  "assets/bizyako-carousel-impact.webp",
  "assets/bizyako-carousel-growth.webp",
  "assets/bizyako-carousel-wave.webp",
];
const rotation = [optimizedPosters[0], optimizedPosters[1], optimizedPosters[2], optimizedPosters[0], optimizedPosters[1]];

const read = (relativePath) => fs.readFileSync(path.join(root, relativePath));

const assertPng = ({ file, width, height }) => {
  const source = read(file);
  assert.deepEqual([...source.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.equal(source.readUInt32BE(16), width);
  assert.equal(source.readUInt32BE(20), height);
  assert.ok(source.length <= 2 * 1024 * 1024, `${file} must stay within the secure carousel upload limit`);
};

const assertWebp = (file) => {
  const source = read(file);
  assert.equal(source.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(source.subarray(8, 12).toString("ascii"), "WEBP");
  assert.ok(source.length <= 450 * 1024, `${file} must stay within the hero delivery budget`);
};

test("hero carousel preserves the three supplied posters and serves optimized copies across five slides", () => {
  posters.forEach(assertPng);
  optimizedPosters.forEach(assertWebp);

  const slides = JSON.parse(read("data/carouselSlides.json").toString("utf8"));
  const staticSite = JSON.parse(read("data/site-static.json").toString("utf8"));
  assert.equal(slides.length, 5);
  assert.deepEqual(slides.map((slide) => slide.image), rotation);
  assert.deepEqual(staticSite.carouselSlides.map((slide) => slide.image), rotation);
});

test("homepage prioritizes one optimized poster and defers the rest of the carousel", () => {
  const homepage = read("index.html").toString("utf8");
  const script = read("script.js").toString("utf8");
  const worker = read("service-worker.js").toString("utf8");
  const publicCarouselSources = [homepage, script, worker, read("data/carouselSlides.json").toString("utf8"), read("data/site-static.json").toString("utf8")].join("\n");

  assert.match(homepage, /<img class="hero-art" src="assets\/bizyako-carousel-impact\.webp"/);
  assert.match(homepage, /width="1672" height="941" fetchpriority="high" decoding="async"/);
  optimizedPosters.forEach((file) => {
    assert.match(script, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });
  assert.match(worker, /assets\/bizyako-carousel-impact\.webp/);
  assert.doesNotMatch(worker, /assets\/bizyako-carousel-(?:growth|wave)\.webp/);
  assert.doesNotMatch(publicCarouselSources, /assets\/bizyako-hero(?:-vibrant)?\.png/);

  const finalVisualSystem = read("styles.css").toString("utf8").split("/* 2026 wide visual system and support refinement */")[1];
  assert.match(finalVisualSystem, /\.hero-art\s*\{[^}]*object-position:\s*center;/s);
});