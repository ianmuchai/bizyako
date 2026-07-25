# BizYako Premium Demo Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the new BizYako demo/contact sections so they feel premium, useful, and clearly connected to the gated demo workflow.

**Architecture:** Keep the existing static `product-demo.html` and data-driven `product-demo.js` pattern. Add richer demo sections, product selector links, product-specific content, stronger UI preview styling, and redirect users to the relevant demo page after demo signup.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Node static server, Vercel.

## Global Constraints

- Work only in `C:\Users\Administrator\Desktop\BizYako`.
- Do not touch or stage the unrelated dirty `admin.js`.
- Keep demo pages public preview pages.
- Keep “Watch demo” gated by signup, then redirect to the relevant product demo page.
- Preserve existing BizYako branding, colors, chatbot, carousel, and admin behavior.

---

### Task 1: Product Demo Page Structure

**Files:**
- Modify: `product-demo.html`

**Interfaces:**
- Consumes: `data-demo-*` hooks used by `product-demo.js`.
- Produces: product selector, demo stats, workflow lanes, proof/CTA sections.

- [ ] Add product selector pills for CRM, ERP, POS, Analytics, ISP, and AI Agents.
- [ ] Add demo stats and workflow canvas areas.
- [ ] Add premium CTA/contact block.

### Task 2: Product Demo Renderer

**Files:**
- Modify: `product-demo.js`

**Interfaces:**
- Consumes: URL param `product`.
- Produces: product-specific selector state, stats, highlights, workflow lanes, and CTA copy.

- [ ] Expand fallback product content.
- [ ] Render selector links and active state.
- [ ] Render product-specific stats and workflow lanes.

### Task 3: Homepage Demo Flow

**Files:**
- Modify: `script.js`

**Interfaces:**
- Consumes: active product `demoUrl`.
- Produces: demo signup redirect to product preview page after successful submission.

- [ ] Store the active product demo URL when opening the modal.
- [ ] Redirect to the product demo page after successful signup.
- [ ] Update modal copy to make the gate clear.

### Task 4: Premium Styling

**Files:**
- Modify: `styles.css`
- Modify: `index.html`

**Interfaces:**
- Consumes: classes from Tasks 1 and 3.
- Produces: premium responsive layouts for demo pages, contact pills, and footer details.

- [ ] Add product selector, stat, workflow, and CTA styles.
- [ ] Refine contact/footer link styling.
- [ ] Confirm mobile layouts remain single-column and readable.

### Task 5: Verify and Release

**Files:**
- Verify: `product-demo.html`, `product-demo.js`, `script.js`, `styles.css`, `data/siteData.js`

**Interfaces:**
- Produces: deployed BizYako site.

- [ ] Run JavaScript syntax checks.
- [ ] Run Vercel build.
- [ ] Verify local and live product demo routes.
- [ ] Commit only relevant files, push, deploy.
