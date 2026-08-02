# Hero Glass and Support Rail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reveal the supplied hero posters through a restrained glass treatment and provide authentic, midpoint-positioned WhatsApp and assistant controls.

**Architecture:** Keep the existing static HTML/CSS/JavaScript architecture and alter only the visual surface. Regression tests inspect the final CSS cascade and launcher markup, while the existing PWA versioning mechanism forces production clients to receive the update.

**Tech Stack:** HTML5, CSS, inline SVG, Node.js built-in test runner, existing static Vercel build.

## Global Constraints

- Keep the maximum desktop global overlay opacity at approximately 32%.
- Preserve bright, centered poster rendering and keep transition image opacity above 90%.
- Use localized backdrop blur and saturation for glass readability.
- Use WhatsApp brand green `#25D366` with the standard speech-bubble and handset silhouette.
- Keep launchers unframed with touch targets of at least 44px.
- Center the desktop rail around `52%` viewport height and the mobile rail around `58%`.
- Keep the assistant panel bottom-anchored and respect `prefers-reduced-motion`.

---

### Task 1: Hero Poster Visibility and Glass Surfaces

**Files:**
- Modify: `tests/responsive-layout.test.js`
- Modify: `styles.css`

**Interfaces:**
- Consumes: Existing `.hero-art`, `.hero-overlay`, `.hero-mainline`, `.hero-console`, and `.hero-transitioning` selectors.
- Produces: A final CSS cascade with a light global gradient and localized glass surfaces.

- [ ] **Step 1: Add failing hero visual regression assertions**

Add a test that slices the final visual-system block and checks the exact visibility contract:

```js
test("hero posters remain visible behind localized glass surfaces", () => {
  const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const finalVisualSystem = styles.slice(styles.indexOf("/* 2026 wide visual system and support refinement */"));

  assert.match(finalVisualSystem, /\.hero-overlay\s*\{[^}]*rgba\(3, 12, 17, \.32\)[^}]*rgba\(3, 17, 22, \.04\)/s);
  assert.match(finalVisualSystem, /\.hero-mainline\s*\{[^}]*backdrop-filter:\s*blur\(20px\) saturate\(1\.2\)/s);
  assert.match(finalVisualSystem, /\.hero-transitioning \.hero-art\s*\{[^}]*opacity:\s*\.92/s);
});
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `node --test tests/responsive-layout.test.js`

Expected: FAIL because the current final overlay starts at `.84` and the transition image opacity is `.82`.

- [ ] **Step 3: Implement the restrained overlay and glass treatment**

Update the final visual-system rules with these values:

```css
.hero-transitioning .hero-art { opacity: .92; }
.hero-overlay {
  background:
    linear-gradient(90deg, rgba(3, 12, 17, .32) 0%, rgba(3, 17, 22, .2) 38%, rgba(3, 17, 22, .08) 68%, rgba(3, 17, 22, .04) 100%),
    linear-gradient(0deg, rgba(3, 12, 17, .16), transparent 44%);
}
.hero-mainline {
  background: linear-gradient(145deg, rgba(3, 18, 23, .46), rgba(3, 18, 23, .24));
  border-color: rgba(255, 255, 255, .2);
  box-shadow: 0 24px 70px rgba(1, 10, 15, .2), inset 0 1px rgba(255, 255, 255, .1);
  backdrop-filter: blur(20px) saturate(1.2);
}
.hero-console {
  background: linear-gradient(145deg, rgba(5, 25, 31, .58), rgba(6, 20, 28, .42));
  backdrop-filter: blur(18px) saturate(1.18);
}
```

Add a narrow-viewport `.hero-mainline` tint of approximately `.54` without increasing `.hero-overlay`.

- [ ] **Step 4: Run the focused test and confirm pass**

Run: `node --test tests/responsive-layout.test.js`

Expected: PASS.

### Task 2: Authentic WhatsApp Mark and Midpoint Support Rail

**Files:**
- Modify: `tests/support-ui.test.js`
- Modify: `index.html`
- Modify: `styles.css`

**Interfaces:**
- Consumes: Existing `.support-hub`, `.support-action`, `.whatsapp-action`, `.chat-action`, and `.chat-panel` behavior.
- Produces: `data-whatsapp-mark` SVG metadata and a viewport-centered launcher rail that does not alter chat-panel anchoring.

- [ ] **Step 1: Replace the old support assertions with failing geometry and placement checks**

```js
test("support rail uses an authentic WhatsApp mark near the viewport midpoint", () => {
  const homepage = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const finalVisualSystem = styles.slice(styles.indexOf("/* 2026 wide visual system and support refinement */"));

  assert.match(homepage, /data-whatsapp-mark/);
  assert.doesNotMatch(homepage, /id="whatsappLauncherGradient"/);
  assert.match(finalVisualSystem, /\.support-hub\s*\{[^}]*top:\s*52%;[^}]*bottom:\s*auto;[^}]*transform:\s*translateY\(-50%\)/s);
  assert.match(finalVisualSystem, /@media \(max-width:\s*620px\)[\s\S]*?\.support-hub\s*\{[^}]*top:\s*58%;/s);
  assert.match(finalVisualSystem, /\.chat-panel\s*\{[^}]*bottom:\s*18px/s);
});
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `node --test tests/support-ui.test.js`

Expected: FAIL because the old hand-drawn gradient mark remains and the rail is bottom-positioned.

- [ ] **Step 3: Implement the standard mark and responsive rail**

Replace only the WhatsApp SVG markup with a `viewBox="0 0 32 32"` standard bubble/handset mark, label it with `data-whatsapp-mark`, fill the bubble with `#25D366`, and keep the detail white.

Update the final CSS:

```css
.support-hub {
  top: 52%;
  right: 18px;
  bottom: auto;
  transform: translateY(-50%);
}
@media (max-width: 620px) {
  .support-hub { top: 58%; right: 10px; bottom: auto; }
}
```

Do not change `.chat-panel` bottom anchoring or the reduced-motion behavior.

- [ ] **Step 4: Run the focused test and confirm pass**

Run: `node --test tests/support-ui.test.js`

Expected: PASS.

### Task 3: Cache Rotation, Full Verification, and Deployment

**Files:**
- Modify: `index.html`
- Modify: `product-demo.html`
- Modify: `by-admin.html`
- Modify: `service-worker.js`
- Modify: `tests/pwa.test.js`

**Interfaces:**
- Consumes: Existing public asset token and `bizyako-shell-v8` cache identifier.
- Produces: Public asset token `20260802-4` and shell cache `bizyako-shell-v9`.

- [ ] **Step 1: Add failing PWA version expectations**

Update `tests/pwa.test.js` to require `20260802-4`, `bizyako-shell-v9`, and reject the immediately previous values.

- [ ] **Step 2: Run the PWA test and confirm failure**

Run: `node --test tests/pwa.test.js`

Expected: FAIL while source files still use `20260802-3` and `bizyako-shell-v8`.

- [ ] **Step 3: Rotate all public asset and shell-cache versions**

Change all current `20260802-3` references to `20260802-4`, and change `bizyako-shell-v8` to `bizyako-shell-v9`.

- [ ] **Step 4: Run complete automated verification**

Run:

```powershell
npm.cmd test
npm.cmd run syntax:check
npm.cmd run build
npm.cmd run security:scan
npm.cmd audit --omit=dev --audit-level=high
```

Expected: Every command exits `0`, all tests pass, and the audit reports zero high-severity vulnerabilities.

- [ ] **Step 5: Verify desktop and mobile rendering**

Start the local server, inspect `1440x900` and `390x844`, and confirm:

- Poster details remain clearly visible.
- Text and controls remain readable.
- Support controls are near the middle-right and do not overlap hero actions.
- The WhatsApp mark is immediately recognizable.
- The assistant panel still opens at the bottom and remains on-screen.

- [ ] **Step 6: Commit and push**

```powershell
git add index.html product-demo.html by-admin.html service-worker.js styles.css tests/responsive-layout.test.js tests/support-ui.test.js tests/pwa.test.js
git commit -m "fix: refine hero glass and support controls"
git push origin main
```

Confirm GitHub `main` points to the new commit and `https://bizyako.vercel.app/` returns HTTP `200` with token `20260802-4`.
