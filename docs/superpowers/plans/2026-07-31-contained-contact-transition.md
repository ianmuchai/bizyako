# Contained Contact Transition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the homepage light-to-dark transition polished without allowing it to cover content or controls.

**Architecture:** The decorative pseudo-element remains owned by `.contact-section`, but moves from a negative top inset to the section's internal top edge. Direct section children receive an explicit foreground stacking layer.

**Tech Stack:** HTML, CSS, Node.js built-in test runner, agent-browser visual verification

## Global Constraints

- Preserve the approved homepage layout and all existing copy.
- Use a 48px desktop transition and a 32px mobile transition at `max-width: 620px`.
- The transition may not extend outside `.contact-section`, blur content, or intercept pointer input.

---

### Task 1: Contain the contact transition

**Files:**
- Modify: `tests/responsive-ui.test.js`
- Modify: `styles.css`

**Interfaces:**
- Consumes: Existing `.contact-section::before` decorative band.
- Produces: A contained, non-interactive transition behind contact content.

- [ ] **Step 1: Write the failing regression test**

Assert that the final visual-system rules use `inset: 0 0 auto`, `height: 48px`, no `filter` or `backdrop-filter`, foreground stacking for `.contact-section > *`, and a mobile height of `32px`.

- [ ] **Step 2: Run the targeted test and verify RED**

Run: `node --test tests/responsive-ui.test.js`
Expected: FAIL because the current transition uses negative insets and 72px/48px heights.

- [ ] **Step 3: Implement the minimal CSS correction**

Move the pseudo-element to the internal top edge, set the desktop/mobile heights, keep `pointer-events: none`, and place contact children above it with `position: relative; z-index: 1`.

- [ ] **Step 4: Verify GREEN and visual behavior**

Run the targeted test, the full suite, syntax check, secret scan, dependency audit, and desktop/mobile browser checks. Confirm clear controls and no horizontal overflow.

- [ ] **Step 5: Commit and release**

Commit the correction, push `main`, deploy the exact commit to Vercel, and verify production headers, assets, admin privacy, and the contained transition.