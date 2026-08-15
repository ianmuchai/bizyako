const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const INSTAGRAM_URL = "https://www.instagram.com/bizyako/";
const X_URL = "https://x.com/bizYako";

test("Instagram is exposed consistently across BizYako public surfaces", () => {
  const homepage = read("index.html");
  const demo = read("product-demo.html");
  const siteData = read("data/siteData.js");
  const staticData = JSON.parse(read("data/site-static.json"));
  const validation = read("lib/security/validation.js");

  assert.ok(homepage.includes(INSTAGRAM_URL));
  assert.ok(demo.includes(INSTAGRAM_URL));
  assert.match(homepage, /aria-label="Instagram"/);
  assert.match(demo, /aria-label="Instagram"/);
  assert.ok(siteData.includes(`instagram: "${INSTAGRAM_URL}"`));
  assert.equal(staticData.contactDetails.social.instagram, INSTAGRAM_URL);
  assert.match(validation, /"instagram\.com"/);
  assert.match(validation, /"www\.instagram\.com"/);
});

test("homepage SEO positions BizYako as a technology business solutions company", () => {
  const homepage = read("index.html");
  const title = homepage.match(/<title>([^<]+)<\/title>/)?.[1] || "";
  const description = homepage.match(/<meta\s+name="description"\s+content="([^"]+)"/s)?.[1] || "";

  assert.match(title, /Technology Business Solutions/i);
  assert.match(description, /technology business solutions company/i);
  assert.match(homepage, /<link rel="canonical" href="https:\/\/bizyako\.com\/"\s*\/?>/);
  assert.match(homepage, /<meta property="og:type" content="website"\s*\/?>/);
  assert.match(homepage, /<meta property="og:url" content="https:\/\/bizyako\.com\/"\s*\/?>/);
  assert.match(homepage, /<meta property="og:image" content="https:\/\/bizyako\.com\/assets\/bizyako-carousel-impact\.png"\s*\/?>/);
  assert.match(homepage, /<meta name="twitter:card" content="summary_large_image"\s*\/?>/);
});

test("homepage publishes valid Organization structured data with trusted social profiles", () => {
  const homepage = read("index.html");
  const match = homepage.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);

  assert.ok(match, "Expected Organization JSON-LD on the homepage");
  const schema = JSON.parse(match[1]);
  assert.equal(schema["@context"], "https://schema.org");
  assert.equal(schema["@type"], "Organization");
  assert.equal(schema.name, "BizYako");
  assert.match(schema.description, /technology business solutions company/i);
  assert.equal(schema.url, "https://bizyako.com/");
  assert.equal(schema.email, "hello@bizyako.com");
  assert.deepEqual(schema.sameAs, [X_URL, INSTAGRAM_URL]);
  assert.equal(schema.address.postOfficeBoxNumber, "2086");
  assert.equal(schema.address.addressLocality, "Karen");
});

test("robots and sitemap expose public pages while keeping the admin private", () => {
  const robots = read("robots.txt");
  const sitemap = read("sitemap.xml");
  const build = read("scripts/build-vercel-static.js");

  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Disallow: \/by-admin/);
  assert.match(robots, /Sitemap: https:\/\/bizyako\.com\/sitemap\.xml/);
  assert.match(sitemap, /<loc>https:\/\/bizyako\.com\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/bizyako\.com\/product-demo<\/loc>/);
  assert.match(build, /"robots\.txt"/);
  assert.match(build, /"sitemap\.xml"/);
});
