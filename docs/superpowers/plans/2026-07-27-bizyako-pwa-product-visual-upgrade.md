# BizYako PWA, Product, and Visual Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Mobile Apps, Progressive Web Apps, and Websites as complete BizYako products; make the public site installable and offline-capable; and deliver the approved wide, vibrant, less-cluttered interface.

**Architecture:** Keep `data/siteData.js` as the backend source of truth and mirror it in `data/site-static.json` for static fallback hosting. Add a root-scoped manifest and service worker without introducing third-party runtime dependencies. Refine the existing HTML/CSS/JavaScript components in place so the Node, Vercel, and Namecheap deployments continue sharing one public source tree.

**Tech Stack:** Node.js 20+, built-in `node:test`, vanilla HTML/CSS/JavaScript, Service Worker API, Web App Manifest, Vercel static/serverless routing, Namecheap Node.js hosting.

## Global Constraints

- Keep all existing hero carousel image files unchanged.
- Use the supplied `assets/bizyako-logo.png`; do not redraw or regenerate the logo.
- Add `mobile`, `pwa`, and `websites` as separate products.
- Keep `/by-admin`, `/by-admin.html`, mutation requests, and admin APIs out of PWA caches.
- Preserve existing backend and carousel-admin behavior.
- Use a stable rem-based responsive type scale rather than viewport-width font sizing.
- Keep every product, install control, support control, and chat action keyboard accessible.
- Keep public section backgrounds full-width while constraining readable content with responsive gutters.
- Keep the WhatsApp link direct; do not add an intermediate WhatsApp dialogue.

---

### Task 1: Product Catalog Expansion

**Files:**
- Create: `tests/site-products.test.js`
- Modify: `package.json`
- Modify: `data/siteData.js`
- Modify: `data/site-static.json`
- Modify: `script.js`
- Modify: `product-demo.js`
- Modify: `index.html`
- Modify: `product-demo.html`

**Interfaces:**
- Consumes: Existing product shape `{ id, kicker, title, text, points, demoUrl }`
- Produces: Product IDs `mobile`, `pwa`, and `websites` through `/api/site`, static fallback data, homepage product selection, and `product-demo.html?product=<id>`

- [ ] **Step 1: Write the failing product coverage test**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { products, metrics } = require("../data/siteData");

const requiredIds = ["law", "erp", "pos", "analytics", "isp", "agents", "mobile", "pwa", "websites"];

test("backend and static payload expose all nine BizYako products", () => {
  const staticPayload = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/site-static.json"), "utf8"));
  assert.deepEqual(products.map((product) => product.id), requiredIds);
  assert.deepEqual(staticPayload.products.map((product) => product.id), requiredIds);
  assert.equal(metrics.services.includes("Mobile Apps"), true);
  assert.equal(metrics.services.includes("Progressive Web Apps"), true);
  assert.equal(metrics.services.includes("Websites"), true);
});

test("every product has a dedicated demo URL", () => {
  for (const product of products) {
    assert.equal(product.demoUrl, `product-demo.html?product=${product.id}`);
    assert.equal(product.points.length, 3);
  }
});

test("browser product controls and demo catalog include the new IDs", () => {
  const homepage = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
  const demoScript = fs.readFileSync(path.join(__dirname, "../product-demo.js"), "utf8");
  for (const id of ["mobile", "pwa", "websites"]) {
    assert.match(homepage, new RegExp(`data-product="${id}"`));
    assert.match(demoScript, new RegExp(`\\b${id}:\\s*\\{`));
  }
});
```

- [ ] **Step 2: Add the test command and verify RED**

Set:

```json
"scripts": {
  "start": "node server.js",
  "dev": "node server.js",
  "test": "node --test tests/*.test.js"
}
```

Run: `npm test`

Expected: FAIL because the three new products and controls do not exist.

- [ ] **Step 3: Add the three backend and static products**

Use these product definitions consistently:

```js
{
  id: "mobile",
  kicker: "Mobile product engineering",
  title: "Mobile apps that keep customers and teams connected anywhere.",
  text: "Build secure iOS and Android experiences for customer service, field operations, payments, approvals, and real-time business workflows.",
  points: ["Role-aware iOS and Android workflows", "Offline synchronization and push notifications", "Payments, device features, and system integrations"],
  demoUrl: "product-demo.html?product=mobile",
}
```

```js
{
  id: "pwa",
  kicker: "Installable web applications",
  title: "Progressive Web Apps with browser reach and an app-like experience.",
  text: "Give users a fast, responsive product they can install directly from the browser, use reliably, and receive updates without an app-store release.",
  points: ["Installable responsive application experiences", "Offline-ready workflows and resilient loading", "Automatic updates across supported devices"],
  demoUrl: "product-demo.html?product=pwa",
}
```

```js
{
  id: "websites",
  kicker: "Digital presence and commerce",
  title: "Websites designed to convert attention into measurable growth.",
  text: "Launch high-performance business websites, ecommerce experiences, and customer portals with strong discovery, analytics, and manageable content.",
  points: ["High-performance responsive interfaces", "SEO, analytics, and conversion journeys", "Content, ecommerce, and portal integrations"],
  demoUrl: "product-demo.html?product=websites",
}
```

- [ ] **Step 4: Wire every public product surface**

Add the three IDs to homepage tabs, hero quick links, the 3 by 3 console matrix, chat choices, lead-form choices, footer navigation, fallback products, product labels, product maps, demo catalog, demo order, page metadata, and `9 Core products`.

- [ ] **Step 5: Verify GREEN**

Run: `npm test`

Expected: PASS for all product tests.

- [ ] **Step 6: Commit**

```bash
git add package.json tests/site-products.test.js data/siteData.js data/site-static.json script.js product-demo.js index.html product-demo.html
git commit -m "feat: add mobile PWA and website products"
```

---

### Task 2: Installable PWA Foundation

**Files:**
- Create: `tests/pwa.test.js`
- Create: `manifest.webmanifest`
- Create: `service-worker.js`
- Create: `assets/icons/bizyako-192.png`
- Create: `assets/icons/bizyako-512.png`
- Modify: `server.js`
- Modify: `index.html`
- Modify: `product-demo.html`

**Interfaces:**
- Consumes: Root public files, existing supplied logo, browser Service Worker API
- Produces: `manifest.webmanifest`, root-scoped service worker, install metadata, offline public shell

- [ ] **Step 1: Write the failing PWA contract tests**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("manifest defines an installable standalone BizYako app", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "../manifest.webmanifest"), "utf8"));
  assert.equal(manifest.name, "BizYako");
  assert.equal(manifest.short_name, "BizYako");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.scope, "/");
  assert.equal(manifest.display, "standalone");
  assert.deepEqual(manifest.icons.map((icon) => icon.sizes), ["192x192", "512x512"]);
});

test("service worker protects private admin and mutation routes from caching", () => {
  const source = fs.readFileSync(path.join(__dirname, "../service-worker.js"), "utf8");
  assert.match(source, /by-admin/);
  assert.match(source, /request\.method !== "GET"/);
  assert.match(source, /caches\.delete/);
  assert.match(source, /index\.html/);
});

test("public pages link the manifest and register the service worker", () => {
  const homepage = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
  const demo = fs.readFileSync(path.join(__dirname, "../product-demo.html"), "utf8");
  assert.match(homepage, /rel="manifest"/);
  assert.match(homepage, /service-worker\.js/);
  assert.match(demo, /rel="manifest"/);
});
```

- [ ] **Step 2: Verify RED**

Run: `npm test`

Expected: FAIL because the manifest, service worker, icons, and page links do not exist.

- [ ] **Step 3: Add manifest and deterministic logo icons**

Create the icon files by resizing and padding the exact supplied logo without redrawing its contents. Declare them with `purpose: "any maskable"` where the logo has a safe surrounding area.

- [ ] **Step 4: Implement the root-scoped service worker**

Use a versioned cache name, pre-cache the public shell, cache static GET resources, use network-first navigation/API reads, delete old caches during activation, and bypass admin or non-GET requests.

- [ ] **Step 5: Add page metadata and server MIME support**

Add manifest, theme-color, Apple touch icon, and service-worker registration to public pages. Add:

```js
".webmanifest": "application/manifest+json; charset=utf-8",
```

to `server.js`.

- [ ] **Step 6: Verify GREEN**

Run: `npm test`

Expected: PASS for product and PWA contracts.

- [ ] **Step 7: Commit**

```bash
git add tests/pwa.test.js manifest.webmanifest service-worker.js assets/icons server.js index.html product-demo.html
git commit -m "feat: make BizYako installable as a PWA"
```

---

### Task 3: Styled Install Experience

**Files:**
- Create: `tests/install-ui.test.js`
- Modify: `index.html`
- Modify: `script.js`
- Modify: `styles.css`

**Interfaces:**
- Consumes: Browser `beforeinstallprompt` and `appinstalled` events
- Produces: Hidden-by-default `[data-install-app]` control and user-triggered browser installation prompt

- [ ] **Step 1: Write the failing install UI contract test**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("homepage has a hidden contextual install control", () => {
  const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "../script.js"), "utf8");
  assert.match(html, /data-install-app/);
  assert.match(html, /hidden/);
  assert.match(script, /beforeinstallprompt/);
  assert.match(script, /appinstalled/);
  assert.match(script, /\.prompt\(\)/);
});
```

- [ ] **Step 2: Verify RED**

Run: `npm test`

Expected: FAIL because no install control or event handling exists.

- [ ] **Step 3: Add install markup and event handling**

Store the deferred install event, reveal the control only when available, invoke `prompt()` only after a click, clear the event after a choice, and hide the control after `appinstalled`.

- [ ] **Step 4: Style desktop and mobile states**

Use a compact icon-and-label button with the actual logo, a 44 pixel minimum height, clear focus state, and placement between primary navigation and consultation CTA. Avoid reserving layout space while hidden.

- [ ] **Step 5: Verify GREEN**

Run: `npm test`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add tests/install-ui.test.js index.html script.js styles.css
git commit -m "feat: add contextual BizYako install control"
```

---

### Task 4: Wide, Vibrant, and Uncluttered Visual System

**Files:**
- Modify: `styles.css`
- Modify: `index.html`
- Modify: `product-demo.html`

**Interfaces:**
- Consumes: Existing HTML component classes and responsive breakpoints
- Produces: Full-width shell, wide content bands, stable type scale, clearer hero artwork, horizontal tabs, and 3 by 3 console matrix

- [ ] **Step 1: Capture baseline screenshots**

Run the local Node server and capture:

- Desktop: 1440 by 1000
- Mobile: 390 by 844

Record hero visibility, heading dimensions, first-viewport controls, horizontal overflow, and product-console geometry.

- [ ] **Step 2: Apply the stable typography scale**

Replace viewport-width heading clamps with rem values and breakpoint overrides:

```css
.hero h1 { font-size: 3.5rem; line-height: 1.08; font-weight: 800; }
.section-heading h2, .contact-section h2 { font-size: 3rem; line-height: 1.1; }
.product-copy h3 { font-size: 2.5rem; line-height: 1.12; }
.demo-page-copy h1 { font-size: 3.75rem; line-height: 1.08; }
```

At mobile breakpoints cap hero at `2.45rem`, section headings at `2.25rem`, and product/demo headings at `2.2rem`.

- [ ] **Step 3: Make the shell full-width with comfortable gutters**

Expand the fixed header to the viewport with a small gutter. Use a shared wide content width of approximately 1440 pixels for hero, sections, trust band, demo content, footer inner content, and admin-safe public shells. Keep paragraph measures narrow.

- [ ] **Step 4: Clarify the hero image**

Reduce dark overlay opacity, lighten the text scrim, reduce blur, keep image opacity near full, and use restrained brightness/saturation enhancement. Reduce transition fade and scale amplitude so imagery remains clear.

- [ ] **Step 5: Simplify navigation and dense controls**

Distribute nav tabs evenly without a crowded outer capsule. Keep product tabs and hero quick links in a single scrollable row. Use the fixed 3 by 3 product console matrix with stable cell dimensions.

- [ ] **Step 6: Check responsive geometry**

Verify no horizontal document overflow, no overlapping hero controls, buttons visible before the first scroll, and readable carousel text across desktop and mobile.

- [ ] **Step 7: Commit**

```bash
git add styles.css index.html product-demo.html
git commit -m "style: widen and refine the BizYako interface"
```

---

### Task 5: Borderless Support Controls and Floating Chat

**Files:**
- Create: `tests/support-ui.test.js`
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `script.js`

**Interfaces:**
- Consumes: Existing support hub and chatbot open/close state
- Produces: Direct WhatsApp action, animated three-dot chat trigger, compact bottom-floating chat panel

- [ ] **Step 1: Write the failing support UI contract test**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("chat trigger uses three animated dots and WhatsApp stays direct", () => {
  const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "../styles.css"), "utf8");
  assert.match(html, /class="chat-dot"/);
  assert.equal((html.match(/class="chat-dot"/g) || []).length, 3);
  assert.match(html, /data-whatsapp-link/);
  assert.match(css, /@keyframes chatDot/);
  assert.match(css, /\.support-action[^}]*border:\\s*0/s);
});
```

- [ ] **Step 2: Verify RED**

Run: `npm test`

Expected: FAIL because the current trigger uses line paths and support controls have borders.

- [ ] **Step 3: Replace the chat glyph and remove boundaries**

Use the existing chat outline plus three `<circle class="chat-dot">` elements. Remove visible borders, inset frames, and square radii from both controls while retaining circular hit targets, shadows, focus rings, and direct WhatsApp behavior.

- [ ] **Step 4: Refine the floating chat panel**

Anchor the panel near the bottom-right with support-control clearance, remove its heavy perimeter border, reduce body type to `0.86rem`, keep actions at least 44 pixels tall, and center it near the bottom on mobile.

- [ ] **Step 5: Coordinate animation and open state**

Stagger the three dot animations. Pause or settle them while the panel has `.open` or the chat trigger has `.active`. Respect `prefers-reduced-motion`.

- [ ] **Step 6: Verify GREEN**

Run: `npm test`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add tests/support-ui.test.js index.html styles.css script.js
git commit -m "style: refine BizYako floating support controls"
```

---

### Task 6: End-to-End Verification and Deployment

**Files:**
- Modify if required by verification: `vercel.json`
- Regenerate: `bizyako-namecheap-node-<timestamp>.zip`

**Interfaces:**
- Consumes: Completed public source, Node server, Vercel project, GitHub `main`
- Produces: Verified local site, production GitHub commit, Vercel deployment, updated Namecheap package

- [ ] **Step 1: Run the complete automated suite**

Run:

```bash
npm test
node --check server.js
node --check script.js
node --check product-demo.js
node --check admin.js
```

Expected: all commands exit 0 with no test failures.

- [ ] **Step 2: Verify public routes through the Node server**

Check:

- `/`
- `/api/health`
- `/api/site`
- `/manifest.webmanifest`
- `/service-worker.js`
- `/product-demo?product=mobile`
- `/product-demo?product=pwa`
- `/product-demo?product=websites`
- `/by-admin`

Expected: public and admin routes respond; manifest MIME is correct; all three product demos render.

- [ ] **Step 3: Run desktop and mobile browser verification**

Verify layout, console pixel output, no horizontal overflow, no overlapping controls, all nine product buttons, demo signup flow, chatbot open/close, direct WhatsApp link, install-control simulated state, and service-worker registration.

- [ ] **Step 4: Verify offline behavior**

After one online load, switch the browser context offline and reload `/`. Confirm the public homepage shell loads. Confirm `/by-admin` is not served from the service-worker cache.

- [ ] **Step 5: Build the Namecheap deployment archive**

Package the updated source with manifest, service worker, icons, public assets, data, HTML, CSS, JavaScript, Node entry point, and package files. Exclude `.git`, logs, old deployment archives, and local Vercel metadata.

- [ ] **Step 6: Commit and push**

```bash
git add vercel.json
git commit -m "chore: finalize BizYako deployment configuration"
git push origin main
```

Skip the final configuration commit when `vercel.json` requires no change. Push all prior implementation commits.

- [ ] **Step 7: Verify Vercel production**

Use `vercel ls`, inspect the deployment matching the pushed commit, verify production status is `READY`, and test the production homepage, manifest, service worker, API, new product demos, and responsive browser layout.

