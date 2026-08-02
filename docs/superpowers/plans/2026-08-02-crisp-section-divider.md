# Crisp Section Divider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the blurred section transition and force every PWA client to receive the corrected interface.

**Architecture:** Replace the decorative contact pseudo-element with a static border on the section itself. Refresh the service-worker cache name and every linked public asset token in one coordinated release.

**Tech Stack:** HTML, CSS, JavaScript service worker, Node.js built-in test runner, agent-browser

## Global Constraints

- Do not change homepage copy, section layout, hero imagery, buttons, or contact workflows.
- Use a crisp 2px teal divider with no gradient, filter, pseudo-element, or overlapping layer.
- Use `bizyako-shell-v6` and asset token `20260802-1` consistently.

---

### Task 1: Replace the transition and refresh cached assets

**Files:**
- Modify: `tests/responsive-ui.test.js`
- Modify: `tests/pwa.test.js`
- Modify: `styles.css`
- Modify: `service-worker.js`
- Modify: `index.html`
- Modify: `product-demo.html`
- Modify: `by-admin.html`

**Interfaces:**
- Consumes: Existing contact-section CSS and service-worker cache lifecycle.
- Produces: A non-overlapping divider and a coordinated PWA asset refresh.

- [ ] **Step 1: Write failing regression tests**

Require the absence of `.contact-section::before`, a `2px` teal border, cache `bizyako-shell-v6`, and asset token `20260802-1` in the service worker and public pages.

- [ ] **Step 2: Verify RED**

Run `npm.cmd test` and confirm failures reference the existing gradient, `v5`, and `20260731-2` tokens.

- [ ] **Step 3: Implement the minimal correction**

Remove the pseudo-element and mobile override, add the section border, change the cache name, and update all linked asset tokens.

- [ ] **Step 4: Verify GREEN**

Run the full test suite, build, syntax check, secret scan, dependency audit, and desktop/mobile browser checks. Confirm old cache names are absent from deployable files.

- [ ] **Step 5: Release**

Commit and push `main`, verify Vercel production, and generate a new secure Namecheap archive from the same commit.