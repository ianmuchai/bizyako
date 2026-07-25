# BizYako Chat and Lead Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a responsive guided chatbot, WhatsApp entry point, and product-definition lead generator to BizYako.

**Architecture:** Reuse the existing static HTML/CSS/JS frontend and `/api/contact` backend. Add self-contained widget markup in `index.html`, behavior in `script.js`, and responsive styling in `styles.css`.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Node static server, Vercel serverless APIs.

## Global Constraints

- Work only in `C:\Users\Administrator\Desktop\BizYako`.
- Keep WhatsApp as a temporary number until the real number is provided.
- Use `/api/contact` for lead capture.
- Do not add a paid AI dependency in this phase.
- Preserve the existing carousel/admin behavior.

---

### Task 1: Frontend Markup

**Files:**
- Modify: `index.html`

**Interfaces:**
- Produces: DOM hooks `data-support-chat`, `data-whatsapp-link`, `data-chat-panel`, `data-lead-builder`, and lead form fields consumed by `script.js`.

- [ ] Add floating support hub markup before the existing demo modal.
- [ ] Add chatbot panel with quick actions.
- [ ] Add product-definition modal form.
- [ ] Confirm markup is not linked from the hidden admin page.

### Task 2: JavaScript Behavior

**Files:**
- Modify: `script.js`

**Interfaces:**
- Consumes: DOM hooks from Task 1.
- Produces: guided chat responses, product recommendations, WhatsApp temporary link, and structured `/api/contact` submissions.

- [ ] Add chat open/close/toggle behavior.
- [ ] Add guided quick replies for CRM, ERP, POS, Analytics, ISP, AI Agents, and Custom Product.
- [ ] Add lead-builder open/close behavior.
- [ ] Submit lead-builder form to `/api/contact` with a readable structured message.

### Task 3: Responsive Styling

**Files:**
- Modify: `styles.css`

**Interfaces:**
- Consumes: classes from Task 1.
- Produces: responsive floating widgets, chat panel, and lead-builder modal.

- [ ] Style support hub, WhatsApp button, chat panel, chat bubbles, and lead modal.
- [ ] Add mobile rules for panels, product tabs, hero spacing, and floating widgets.
- [ ] Add reduced-motion handling.

### Task 4: Verification and Release

**Files:**
- Verify: `index.html`, `script.js`, `styles.css`, `server.js`, `api/contact.js`, `api/site.js`

**Interfaces:**
- Produces: committed, pushed, deployed BizYako site.

- [ ] Run JavaScript syntax checks.
- [ ] Run Vercel build.
- [ ] Verify local homepage and API health.
- [ ] Commit, push to GitHub, deploy to Vercel production.

