const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { products, metrics } = require("../data/siteData");

const requiredIds = ["law", "erp", "pos", "analytics", "isp", "agents", "mobile", "pwa", "websites"];

test("backend and static payload expose all nine BizYako products", () => {
  const staticPayload = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../data/site-static.json"), "utf8"),
  );

  assert.deepEqual(products.map((product) => product.id), requiredIds);
  assert.deepEqual(staticPayload.products.map((product) => product.id), requiredIds);
  assert.equal(metrics.services.includes("Mobile Apps"), true);
  assert.equal(metrics.services.includes("Progressive Web Apps"), true);
  assert.equal(metrics.services.includes("Websites"), true);
});

test("every product has a dedicated demo URL", () => {
  for (const product of products) {
    assert.equal(product.demoUrl, `product-demo.html?product=${product.id}`);
    assert.equal(product.points.length, 3);
  }
});

test("browser product controls and demo catalog include the new IDs", () => {
  const homepage = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
  const demoScript = fs.readFileSync(path.join(__dirname, "../product-demo.js"), "utf8");

  for (const id of ["mobile", "pwa", "websites"]) {
    assert.match(homepage, new RegExp(`data-product="${id}"`));
    assert.match(demoScript, new RegExp(`\\b${id}:\\s*\\{`));
  }
});