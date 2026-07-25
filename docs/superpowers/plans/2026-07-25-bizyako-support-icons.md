# BizYako Support Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the text-only floating WhatsApp and chat buttons with polished icon buttons.

**Architecture:** Keep the existing support hub links and JavaScript hooks. Replace visible text with inline SVG icons and refine CSS for modern hover, focus, and mobile sizing.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Node static server, Vercel.

## Global Constraints

- Work only in `C:\Users\Administrator\Desktop\BizYako`.
- Preserve `data-whatsapp-link` and `data-support-chat` hooks.
- Keep accessible labels on both buttons.
- Do not add external icon dependencies.

---

### Task 1: Icon Markup

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: existing support hub markup.
- Produces: inline SVG icons in `.whatsapp-action` and `.chat-action`.

- [ ] Replace `WA` text with an inline WhatsApp-style SVG.
- [ ] Replace `Chat` text with an inline dialogue SVG.
- [ ] Keep `aria-label` attributes unchanged.

### Task 2: Icon Styling

**Files:**
- Modify: `styles.css`

**Interfaces:**
- Consumes: `.support-action svg` and existing action classes.
- Produces: premium icon sizing, glow, focus state, and responsive layout.

- [ ] Add SVG sizing rules.
- [ ] Add refined hover and focus-visible states.
- [ ] Confirm mobile dimensions stay compact.

### Task 3: Verify and Release

**Files:**
- Verify: `index.html`, `styles.css`, `script.js`

**Interfaces:**
- Produces: deployed BizYako site.

- [ ] Run syntax and production build checks.
- [ ] Verify live homepage contains the icon SVG markup.
- [ ] Commit, push, and deploy.
