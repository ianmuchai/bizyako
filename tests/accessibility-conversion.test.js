const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { validateContactPayload } = require("../lib/security/validation");

const root = path.join(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("public pages provide a visible-on-focus skip path to main content", () => {
  for (const file of ["index.html", "product-demo.html"]) {
    const html = read(file);
    assert.match(html, /<a class="skip-link" href="#main-content">Skip to main content<\/a>/);
    assert.match(html, /<main id="main-content"/);
  }
  assert.match(read("styles.css"), /\.skip-link:focus-visible\s*\{[^}]*transform:\s*translateY\(0\)/s);
});

test("mobile navigation publishes and synchronizes its expanded state", () => {
  const homepage = read("index.html");
  const script = read("script.js");

  assert.match(homepage, /<nav class="nav-links" id="primary-navigation"/);
  assert.match(homepage, /aria-controls="primary-navigation" aria-expanded="false"/);
  assert.match(script, /menuButton\.setAttribute\("aria-expanded"/);
  assert.match(script, /if \(event\.key !== "Escape"\) return;[\s\S]*?closeMenu/s);
});

test("consultation form captures a validated reply number and announces its result", () => {
  const homepage = read("index.html");
  const script = read("script.js");
  const result = validateContactPayload({
    name: "Amina Kamau",
    contact: "+254 754 959 895",
    need: "ERP workflow",
    message: "We need approvals and inventory reporting in one workspace.",
    website: "",
    formStartedAt: Date.now() - 5_000,
  });

  assert.match(homepage, /type="tel" name="contact"[^>]*autocomplete="tel"[^>]*required/);
  assert.match(homepage, /data-contact-status role="status" aria-live="polite"/);
  assert.equal(result.ok, true);
  assert.equal(result.value.contact, "+254 754 959 895");
  assert.match(script, /contactStatus\.textContent/);
});

test("interactive controls share a strong keyboard focus treatment", () => {
  const styles = read("styles.css");
  assert.match(styles, /:where\(a, button, input, select, textarea\):focus-visible\s*\{[^}]*outline:\s*3px solid #ffbf47/s);
});

test("closing dialogs and chat returns focus to the initiating control", () => {
  const script = read("script.js");
  assert.match(script, /lastFocusedElement/);
  assert.match(script, /lastFocusedElement\?\.focus\(\)/);
  assert.match(script, /if \(event\.key !== "Escape"\) return;/);
  assert.match(script, /closeLeadBuilder\(\)/);
  assert.match(script, /closeChatPanel\(\)/);
});
