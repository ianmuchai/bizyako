# Standalone Support Icons and Hero Type Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the visible circles around the WhatsApp and assistant launchers and reduce all rotating hero title and description typography to a more polished scale.

**Architecture:** Preserve the existing semantic link/button markup, JavaScript behavior, floating dock, and 44px interaction areas. Implement the visual change through the final CSS override layer so it reliably supersedes older declarations, with source-level regression tests protecting both the standalone glyph treatment and shared rotating-copy scale.

**Tech Stack:** HTML, CSS, Node.js built-in test runner, existing vanilla JavaScript frontend

## Global Constraints

- Do not change the approved hero imagery, carousel content, support behavior, or responsive layout.
- Keep minimum 44px interaction areas for both support launchers.
- Preserve the animated three-dot conversation indicator and bottom-anchored chat panel.
- Apply typography changes through the shared `data-hero-title` and `data-hero-copy` elements.

---

### Task 1: Standalone support glyphs and balanced rotating copy

**Files:**
- Modify: `tests/support-ui.test.js`
- Modify: `tests/responsive-ui.test.js`
- Modify: `styles.css`

**Interfaces:**
- Consumes: Existing `.support-action`, `.whatsapp-action`, `.chat-action`, `.hero h1`, and `.hero-copy` selectors.
- Produces: Transparent 54px support hitboxes with standalone glyphs, plus 3rem desktop titles and 0.96rem descriptions shared by every carousel slide.

- [ ] **Step 1: Write failing regression tests**

Add assertions that the final support override uses `background: transparent`, `border-radius: 0`, `box-shadow: none`, and at least 44px width/height. Add assertions that the final hero rules use `font-size: 3rem` for `.hero h1` and `font-size: .96rem` for `.hero-copy`.

```js
assert.match(styles, /\.support-action\s*\{[^}]*width:\s*54px;[^}]*height:\s*54px;[^}]*background:\s*transparent;[^}]*border-radius:\s*0;[^}]*box-shadow:\s*none;/s);
assert.match(styles, /\.hero h1\s*\{[^}]*font-size:\s*3rem;/s);
assert.match(styles, /\.hero-copy\s*\{[^}]*font-size:\s*\.96rem;/s);
```

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test tests/support-ui.test.js tests/responsive-ui.test.js`

Expected: FAIL because the current final override still uses circular colored backgrounds and the title is 3.5rem.

- [ ] **Step 3: Implement the minimal final CSS overrides**

Update the late visual-system rules so `.support-action`, `.whatsapp-action`, and `.chat-action` have transparent backgrounds, no radius, no container shadow, and retain their current dimensions. Move color and a restrained drop shadow to the SVG glyph, keep hover motion, and use `outline` plus `outline-offset` for keyboard focus. Set `.hero h1` to `3rem` with a 620px maximum width and `.hero-copy` to `.96rem` with a 570px maximum width and `1.52` line height.

```css
.hero h1 { max-width: 620px; font-size: 3rem; }
.hero-copy { max-width: 570px; font-size: .96rem; line-height: 1.52; }
.support-action { background: transparent; border-radius: 0; box-shadow: none; }
.support-action:hover,
.support-action.active { box-shadow: none; }
.whatsapp-action,
.chat-action { background: transparent; }
.support-action svg { filter: drop-shadow(0 7px 12px rgba(3, 16, 22, .2)); }
.support-action:focus-visible { outline: 2px solid rgba(8, 184, 147, .8); outline-offset: 2px; box-shadow: none; }
```

- [ ] **Step 4: Run focused and full verification**

Run: `node --test tests/support-ui.test.js tests/responsive-ui.test.js`

Expected: PASS.

Run: `npm.cmd test`

Expected: 0 failures.

Run: `node --check script.js`

Expected: exit code 0.

- [ ] **Step 5: Verify responsive presentation**

At `1440x900` and `390x844`, confirm that only the glyphs are visible, both launchers keep at least 44px hitboxes, the three chat dots animate, the chat panel stays within the viewport, hero actions remain available before scrolling, and rotating titles/descriptions do not cause layout shifts or overflow.

- [ ] **Step 6: Commit**

```bash
git add styles.css tests/support-ui.test.js tests/responsive-ui.test.js
git commit -m "refactor: simplify support launchers and hero type"
```

