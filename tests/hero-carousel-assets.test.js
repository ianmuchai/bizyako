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
const rotation = [posters[0].file, posters[1].file, posters[2].file, posters[0].file, posters[1].file];

const read = (relativePath) => fs.readFileSync(path.join(root, relativePath));

const assertPng = ({ file, width, height }) => {
  const source = read(file);
  assert.deepEqual([...source.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.equal(source.readUInt32BE(16), width);
  assert.equal(source.readUInt32BE(20), height);
  assert.ok(source.length <= 2 * 1024 * 1024, `${file} must stay within the secure carousel upload limit`);
};

test("hero carousel uses the three supplied BizYako posters across all five slides", () => {
  posters.forEach(assertPng);

  const slides = JSON.parse(read("data/carouselSlides.json").toString("utf8"));
  const staticSite = JSON.parse(read("data/site-static.json").toString("utf8"));
  assert.equal(slides.length, 5);
  assert.deepEqual(slides.map((slide) => slide.image), rotation);
  assert.deepEqual(staticSite.carouselSlides.map((slide) => slide.image), rotation);
});

test("homepage fallback and offline shell contain only the supplied hero posters", () => {
  const homepage = read("index.html").toString("utf8");
  const script = read("script.js").toString("utf8");
  const worker = read("service-worker.js").toString("utf8");
  const publicCarouselSources = [homepage, script, worker, read("data/carouselSlides.json").toString("utf8"), read("data/site-static.json").toString("utf8")].join("\n");

  assert.match(homepage, /<img class="hero-art" src="assets\/bizyako-carousel-impact\.png"/);
  posters.forEach(({ file }) => {
    assert.match(script, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(worker, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });
  assert.doesNotMatch(publicCarouselSources, /assets\/bizyako-hero(?:-vibrant)?\.png/);

  const finalVisualSystem = read("styles.css").toString("utf8").split("/* 2026 wide visual system and support refinement */")[1];
  assert.match(finalVisualSystem, /\.hero-art\s*\{[^}]*object-position:\s*center;/s);
});
