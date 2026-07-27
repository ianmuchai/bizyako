const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

test("closed interactive panels are inert until opened", () => {
  const homepage = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(homepage, /class="chat-panel"[^>]*\sinert/);
  assert.match(homepage, /class="lead-builder"[^>]*\sinert/);
  assert.match(homepage, /class="demo-modal"[^>]*\sinert/);

  const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
  assert.match(script, /chatPanel\.removeAttribute\("inert"\)/);
  assert.match(script, /leadBuilder\.removeAttribute\("inert"\)/);
  assert.match(script, /demoModal\.removeAttribute\("inert"\)/);
});

test("labeled control clusters expose a valid group role", () => {
  const homepage = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const labeledGroups = homepage.match(/role="group"[^>]*aria-label=/g) || [];
  assert.equal(labeledGroups.length, 6);
});
