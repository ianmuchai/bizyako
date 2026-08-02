# BizYako Support Launcher Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the weak floating support outlines with vibrant, filled, boundary-free WhatsApp and assistant glyphs while preserving their behavior and accessibility.

**Architecture:** Keep the existing support hub and interaction handlers. Replace only the inline SVG artwork and final visual-system launcher rules, then rotate the PWA shell and asset versions so browsers cannot retain the old artwork or CSS.

**Tech Stack:** Semantic HTML, inline SVG, CSS, Node.js test runner, BizYako service worker.

## Global Constraints

- Keep a transparent 54 by 54 pixel desktop hit area and at least 50 by 50 pixels on mobile.
- Do not add an outer circle, border, tile, glass panel, or button background.
- Use a filled green WhatsApp speech-mark with a white handset.
- Use a filled teal assistant speech bubble with three animated white dots.
- Preserve the current WhatsApp destination, assistant panel behavior, accessible names, and expanded state.
- Disable launcher and dot motion for `prefers-reduced-motion: reduce`.
- Do not change footer icons, chat content, hero content, or lead workflows.

---

### Task 1: Filled Standalone Support Glyphs

**Files:**
- Modify: `tests/support-ui.test.js`
- Modify: `index.html:376-396`
- Modify: `styles.css:1654-1700`

**Interfaces:**
- Consumes: Existing `.support-action`, `.whatsapp-action`, `.chat-action`, `.chat-dot`, and `data-support-chat` hooks.
- Produces: `.launcher-bubble` and `.launcher-detail` SVG parts styled as filled standalone marks.

- [ ] **Step 1: Write the failing visual-contract tests**

Update `tests/support-ui.test.js` to require two filled launcher bubbles, white internal details, three dots, 40 pixel desktop artwork, 38 pixel mobile artwork, restrained shadows, SVG-level hover movement, and reduced-motion cancellation. Retain assertions that the button surface has no border, radius, background, or shadow.

```js
test("support launchers use bold filled marks with white details", () => {
  const homepage = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const finalVisualSystem = styles.slice(styles.indexOf("/* 2026 wide visual system and support refinement */"));

  assert.equal((homepage.match(/class="launcher-bubble"/g) || []).length, 2);
  assert.match(homepage, /id="whatsappLauncherGradient"/);
  assert.match(homepage, /id="assistantLauncherGradient"/);
  assert.match(homepage, /class="launcher-detail"[^>]*fill="#fff"/);
  assert.equal((homepage.match(/class="chat-dot"/g) || []).length, 3);
  assert.match(finalVisualSystem, /\.support-action svg\s*\{[^}]*width:\s*40px;[^}]*height:\s*40px;/s);
  assert.match(finalVisualSystem, /\.support-action:hover svg,[\s\S]*transform:\s*translateY\(-2px\) scale\(1\.06\)/);
  assert.match(finalVisualSystem, /@media \(max-width:\s*620px\)[\s\S]*?\.support-action svg\s*\{[^}]*width:\s*38px;[^}]*height:\s*38px;/s);
  assert.match(styles, /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.chat-dot[\s\S]*animation:\s*none/);
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --test tests/support-ui.test.js`

Expected: FAIL because the current launchers are outlined, use 32 pixel artwork, and do not expose the new filled-part classes.

- [ ] **Step 3: Replace the launcher SVG artwork**

In `index.html`, give each SVG an internal two-stop gradient, one filled `.launcher-bubble` path, and white internal artwork. Keep the current URL, labels, button, and data attributes exactly as they are. The assistant dots remain three `<circle class="chat-dot" ... fill="#fff">` elements.

- [ ] **Step 4: Refine only the final launcher CSS**

Set the transparent hit areas to 54 pixels, SVG artwork to 40 pixels, and mobile artwork to 38 pixels. Move hover animation from the hit area to the SVG, use one restrained drop shadow, set `.launcher-detail` and `.chat-dot` to white, and preserve the keyboard-only outline. Add reduced-motion rules that remove SVG transitions and dot animation.

- [ ] **Step 5: Run the focused test and confirm GREEN**

Run: `node --test tests/support-ui.test.js`

Expected: all support UI tests pass.

### Task 2: Immediate Browser Refresh And Release Verification

**Files:**
- Modify: `tests/pwa.test.js`
- Modify: `service-worker.js`
- Modify: `index.html`
- Modify: `product-demo.html`
- Modify: `by-admin.html`

**Interfaces:**
- Consumes: Existing versioned public CSS and JavaScript URLs and BizYako-prefixed cache cleanup.
- Produces: `bizyako-shell-v7` and public asset version `20260802-2`.

- [ ] **Step 1: Update the PWA test first**

Change the expected asset token in `tests/pwa.test.js` from `20260802-1` to `20260802-2`, expect `bizyako-shell-v7`, and reject `bizyako-shell-v6` plus `20260802-1` in public deployable files.

- [ ] **Step 2: Run the PWA test and confirm RED**

Run: `node --test tests/pwa.test.js`

Expected: FAIL because source files still use cache v6 and asset token `20260802-1`.

- [ ] **Step 3: Rotate the cache and public asset versions**

Update `service-worker.js` to `bizyako-shell-v7`. Change CSS and JavaScript query tokens in `service-worker.js`, `index.html`, `product-demo.html`, and `by-admin.html` to `20260802-2`.

- [ ] **Step 4: Run focused and full verification**

Run:

```powershell
node --test tests\support-ui.test.js tests\pwa.test.js
npm.cmd test
npm.cmd run build
npm.cmd run syntax:check
npm.cmd run security:scan
npm.cmd audit --omit=dev --audit-level=high
git diff --check
```

Expected: all commands exit 0, 60 tests pass, and npm reports zero vulnerabilities.

- [ ] **Step 5: Verify in Chrome and publish**

At 1440 by 900 and 390 by 844, verify both icons remain visually balanced on light and dark sections, have transparent button surfaces, do not overflow, retain accessible controls, and preserve WhatsApp/chat behavior. Verify only `bizyako-shell-v7` remains in Cache Storage. Commit the implementation, push `main`, and verify the Vercel alias serves `20260802-2`, the filled SVG classes, CSP/HSTS, and blocked private source routes.
