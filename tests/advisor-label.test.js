const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const homepage = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

test("the support panel is presented as BizYako Chat", () => {
  assert.match(homepage, />BizYako Chat</);
  assert.doesNotMatch(homepage, />BizYako Advisor</);
});
