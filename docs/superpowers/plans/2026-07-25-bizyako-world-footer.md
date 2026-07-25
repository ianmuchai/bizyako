# BizYako World Footer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the simple BizYako footer with a structured, icon-led, internationally polished SaaS footer.

**Architecture:** Update the static footer markup in `index.html` and `product-demo.html`, preserving brand links and contact details. Add inline SVG icons and CSS-only responsive layout without external dependencies.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Node static server, Vercel.

## Global Constraints

- Work only in `C:\Users\Administrator\Desktop\BizYako`.
- Do not touch or stage the unrelated dirty `admin.js`.
- Use inline SVG icons, no external dependency.
- Apply the same footer design to homepage and product demo page.
- Keep email `hello@bizyako.com`, address `PO Box 2086 Karen`, X link `https://x.com/bizYako`, and temporary WhatsApp link.

---

### Task 1: Footer Markup

**Files:**
- Modify: `index.html`
- Modify: `product-demo.html`

**Interfaces:**
- Consumes: existing `.footer` blocks.
- Produces: `.site-footer`, `.footer-grid`, `.footer-icon-card`, `.footer-bottom`, and accessible SVG icons.

- [ ] Replace the old one-line footer on the homepage.
- [ ] Replace the old one-line footer on the product demo page.
- [ ] Keep all links reachable and labelled.

### Task 2: Footer Styling

**Files:**
- Modify: `styles.css`

**Interfaces:**
- Consumes: classes from Task 1.
- Produces: 4-column desktop footer, tablet/mobile responsive layouts, hover/focus states, icon cards, and bottom bar.

- [ ] Add premium footer structure.
- [ ] Add icon card styling and focus-visible states.
- [ ] Add responsive rules for tablet and mobile.

### Task 3: Verify and Release

**Files:**
- Verify: `index.html`, `product-demo.html`, `styles.css`, `script.js`, `product-demo.js`

**Interfaces:**
- Produces: deployed BizYako site.

- [ ] Run JavaScript syntax checks.
- [ ] Run Vercel build.
- [ ] Verify homepage and product demo page serve the new footer.
- [ ] Commit only relevant files, push, deploy.
