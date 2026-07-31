# BizYako Security and Support Contrast Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the standalone support icons readable across every section, smooth the light-to-dark footer transition, and add layered production security to BizYako on Vercel and Namecheap.

**Architecture:** Keep authentication, signed sessions, CSRF/origin checks, throttling, headers, path containment, and payload validation in dependency-free modules under `lib/security/`. Adapt those primitives to both the raw Node server and Vercel API functions. Keep public browsing independent from admin configuration, while all administrator actions fail closed when secure environment variables are absent.

**Tech Stack:** Node.js built-in `crypto`, vanilla HTML/CSS/JavaScript, Vercel Functions, cPanel Node hosting, Node built-in test runner

## Global Constraints

- Do not commit a plaintext password, reusable token, session secret, or generated `.env` file.
- Keep the public homepage, product demos, chatbot, WhatsApp link, and lead forms available if admin security is unconfigured.
- Keep administrator writes read-only on Vercel and authenticated/persistent on the Namecheap Node host.
- Keep support launchers as standalone glyphs with no visible enclosing circles, boxes, borders, or filled surfaces.
- Remove uploaded SVG support; allow only PNG, JPEG, WebP, and AVIF raster images.
- Apply the approved security controls to both production hosts and document controls that require account-level action.

---

### Task 1: Support contrast and section transition

**Files:**
- Modify: `tests/support-ui.test.js`
- Modify: `tests/responsive-ui.test.js`
- Modify: `styles.css`

**Interfaces:**
- Consumes: Existing `.support-action`, `.support-action svg`, `.contact-section`, and `.process-section` selectors.
- Produces: Standalone 32px/30px glyphs with dual contrast shadows and a responsive transition band above the contact section.

- [ ] **Step 1: Add failing visual source assertions**

```js
assert.match(finalVisualSystem, /\.support-action svg\s*\{[^}]*width:\s*32px;[^}]*drop-shadow\(0 0 1px rgba\(255, 255, 255, \.95\)\)/s);
assert.match(finalVisualSystem, /\.support-action svg path\[stroke\]\s*\{[^}]*stroke-width:\s*2\.65/s);
assert.match(finalVisualSystem, /\.contact-section::before\s*\{[^}]*height:\s*72px;[^}]*linear-gradient/s);
```

- [ ] **Step 2: Run `node --test tests/support-ui.test.js tests/responsive-ui.test.js` and verify failure because the contrast edge and transition band are absent.**

- [ ] **Step 3: Add the final CSS overrides**

```css
.contact-section { position: relative; isolation: isolate; }
.contact-section::before {
  content: "";
  position: absolute;
  z-index: -1;
  inset: -72px 0 auto;
  height: 72px;
  background: linear-gradient(180deg, rgba(234,248,244,0), rgba(40,92,91,.54) 48%, #06131b 100%);
  pointer-events: none;
}
.support-action svg {
  width: 32px;
  height: 32px;
  filter: drop-shadow(0 0 1px rgba(255, 255, 255, .95)) drop-shadow(0 3px 8px rgba(1, 10, 15, .66));
}
.support-action svg path[stroke] { stroke-width: 2.65; }
```

Add a mobile override for a 48px transition band and 30px glyphs.

- [ ] **Step 4: Run the focused tests and confirm PASS.**

- [ ] **Step 5: Commit `styles.css` and the two tests with `git commit -m "fix: improve support contrast and footer transition"`.**

---

### Task 2: Security primitives and credential generation

**Files:**
- Create: `lib/security/auth.js`
- Create: `lib/security/http.js`
- Create: `lib/security/validation.js`
- Create: `lib/security/index.js`
- Create: `scripts/generate-admin-credentials.js`
- Create: `tests/security-auth.test.js`
- Create: `tests/security-http.test.js`
- Create: `tests/security-validation.test.js`
- Modify: `package.json`

**Interfaces:**
- `hashPassword(password, salt?) -> "scrypt$v1$<salt>$<digest>"`
- `verifyPassword(password, encodedHash) -> boolean`
- `createSession({ secret, now?, ttlMs? }) -> { token, csrfToken, expiresAt }`
- `verifySession(token, { secret, now? }) -> { ok, csrfToken?, expiresAt? }`
- `createSessionCookie(token, { secure, maxAgeSeconds }) -> string`
- `clearSessionCookie({ secure }) -> string`
- `parseCookies(header) -> Record<string,string>`
- `validateOrigin(origin, allowedOrigins) -> boolean`
- `createRateLimiter({ limit, windowMs, now? }) -> { check(key) }`
- `getSecurityHeaders({ admin, production }) -> Record<string,string>`
- `resolvePublicPath(root, pathname) -> string | null`
- `validateContactPayload(payload) -> { ok, value?, message }`
- `validateCarouselPayload(payload) -> { ok, slides?, message }`

- [ ] **Step 1: Write auth tests for valid/invalid scrypt hashes, timing-safe verification behavior, signed-session tampering, expiry, CSRF token presence, secure cookie attributes, and invalid configuration.**

- [ ] **Step 2: Run `node --test tests/security-auth.test.js` and verify module-not-found failure.**

- [ ] **Step 3: Implement auth with `crypto.scryptSync`, `crypto.timingSafeEqual`, `crypto.randomBytes`, and HMAC-SHA256. Reject session secrets shorter than 32 bytes.**

- [ ] **Step 4: Write and fail HTTP tests for exact-origin checks, sliding-window request limits, security headers, null-byte rejection, encoded traversal, and sibling-prefix path escapes.**

- [ ] **Step 5: Implement HTTP helpers using `path.resolve`, `path.relative`, fixed-window limiter buckets with periodic cleanup, and the approved CSP/header set.**

- [ ] **Step 6: Write and fail validation tests for field limits, unknown fields, honeypots, too-fast submissions, invalid product IDs, active SVG data, spoofed raster signatures, oversized decoded images, traversal paths, and more than five slides.**

- [ ] **Step 7: Implement contact and carousel allowlists. Validate PNG, JPEG, WebP, and AVIF magic bytes after base64 decoding; cap images at 2 MB and carousel JSON at 8 MB.**

- [ ] **Step 8: Add `npm run security:credentials` to generate a random 24-character one-time password, scrypt hash, and 32-byte session secret without writing tracked files.**

- [ ] **Step 9: Run all three security primitive test files and confirm PASS.**

- [ ] **Step 10: Commit with `git commit -m "feat: add BizYako security primitives"`.**

---

### Task 3: Secure Node and Namecheap runtime

**Files:**
- Create: `tests/server-security.test.js`
- Modify: `server.js`
- Modify: `data/siteData.js`
- Modify: `.htaccess`

**Interfaces:**
- Consumes: Security exports from `lib/security/index.js`.
- Produces: `/api/admin-auth` GET/POST/DELETE; authenticated `/api/carousel` POST; hardened `/api/contact`; protected file serving and matching response headers.

- [ ] **Step 1: Add failing integration tests that launch `server.js` with test secrets and assert security headers, locked admin writes, rejected origins/CSRF, valid login/session/save/logout, contact limits, traversal rejection, JSON content-type enforcement, and generic error responses.**

- [ ] **Step 2: Run `node --test tests/server-security.test.js` and verify the current unauthenticated carousel save and missing headers fail.**

- [ ] **Step 3: Refactor request-body collection to count bytes and accept per-route limits. Add JSON-only parsing and status `413` for oversized bodies.**

- [ ] **Step 4: Apply shared headers to every response, `no-store` to admin/auth responses, admin `X-Robots-Tag`, method allowlists, and safe resolved file paths.**

- [ ] **Step 5: Implement admin auth routes and require signed session, exact origin, and matching `X-CSRF-Token` for carousel writes. Add five-login/15-minute and six-contact/10-minute limiters with `Retry-After`.**

- [ ] **Step 6: Replace permissive carousel normalization with validated slides and preserve the last valid file when a save is rejected.**

- [ ] **Step 7: Set `requestTimeout=15000`, `headersTimeout=10000`, and `keepAliveTimeout=5000`. Emit redacted JSON security events.**

- [ ] **Step 8: Add matching `.htaccess` headers and admin no-cache/noindex rules without changing clean routes.**

- [ ] **Step 9: Run server integration and full tests; confirm PASS.**

- [ ] **Step 10: Commit with `git commit -m "feat: secure BizYako Node administration"`.**

---

### Task 4: Secure Vercel APIs

**Files:**
- Create: `api/admin-auth.js`
- Create: `tests/vercel-security.test.js`
- Modify: `api/contact.js`
- Modify: `api/carousel.js`
- Modify: `api/health.js`
- Modify: `vercel.json`

**Interfaces:**
- Consumes: Shared auth, origin, validation, limiter, cookie, and header helpers.
- Produces: Stateless Vercel admin sessions, protected read-only carousel writes, validated contact submissions, and wildcard production headers.

- [ ] **Step 1: Add failing handler tests for login/session/logout, missing secrets, origin rejection, contact validation/throttling, authenticated Vercel write returning read-only status, and security headers.**

- [ ] **Step 2: Run `node --test tests/vercel-security.test.js` and verify missing handlers/controls fail.**

- [ ] **Step 3: Implement `/api/admin-auth` with the shared stateless cookie/session primitives.**

- [ ] **Step 4: Harden contact and carousel handlers with the shared validators. Require auth and CSRF before returning the Vercel read-only carousel response.**

- [ ] **Step 5: Add the approved wildcard CSP and security headers to `vercel.json`, plus admin-specific `Cache-Control` and `X-Robots-Tag`.**

- [ ] **Step 6: Run handler tests and validate `vercel.json` parses as JSON; confirm PASS.**

- [ ] **Step 7: Commit with `git commit -m "feat: secure BizYako Vercel endpoints"`.**

---

### Task 5: Authenticated admin UI and strict CSP compatibility

**Files:**
- Modify: `by-admin.html`
- Modify: `admin.js`
- Modify: `index.html`
- Modify: `product-demo.html`
- Modify: `script.js`
- Modify: `product-demo.js`
- Modify: `styles.css`
- Modify: `data/siteData.js`
- Create: `tests/security-ui.test.js`

**Interfaces:**
- Consumes: `/api/admin-auth` and authenticated `/api/carousel` contract.
- Produces: Login gate, in-memory CSRF handling, logout, expired-session recovery, validated raster-only client uploads, honeypot/timing fields, and no inline scripts.

- [ ] **Step 1: Add failing UI source tests for login gate/inert editor, no inline scripts, no SVG file acceptance, CSRF header usage, logout, honeypot fields, and external service-worker registration.**

- [ ] **Step 2: Run `node --test tests/security-ui.test.js` and verify the current public editor and inline registration fail.**

- [ ] **Step 3: Add the login form and hidden/inert admin shell. On load, inspect the session before loading carousel data. Keep CSRF only in module memory and clear it on logout/401.**

- [ ] **Step 4: Add raster MIME/size checks before FileReader preview and send `X-CSRF-Token` for saves. Remove SVG from accepted formats and admin guidance.**

- [ ] **Step 5: Move service-worker registration into `script.js` and `product-demo.js`; remove both inline script blocks.**

- [ ] **Step 6: Add honeypot and start-time fields to contact, demo-signup, chat-lead, and product-definition submissions while preserving accessibility.**

- [ ] **Step 7: Run UI and full tests; confirm PASS.**

- [ ] **Step 8: Commit with `git commit -m "feat: protect the BizYako admin experience"`.**

---

### Task 6: Security operations, CI, deployment, and verification

**Files:**
- Create: `.well-known/security.txt`
- Create: `.github/workflows/security.yml`
- Create: `SECURITY.md`
- Modify: `.gitignore`
- Modify: `service-worker.js`
- Modify: `tests/pwa.test.js`

**Interfaces:**
- Produces: Public security contact, repeatable test workflow, credential/rotation runbook, updated PWA cache, and deployment checklist.

- [ ] **Step 1: Add `security.txt` with `Contact: mailto:hello@bizyako.com`, canonical HTTPS URL, English language, and an expiry one year from release.**

- [ ] **Step 2: Add a GitHub Actions workflow using Node 20 to run `npm test`, JavaScript syntax checks, `npm audit --omit=dev`, and a secret-pattern scan on pushes and pull requests.**

- [ ] **Step 3: Document credential generation, Vercel/cPanel environment setup, password and session-secret rotation, emergency admin lockout, HTTPS/DNSSEC/CAA checks, firewall rollout, and recovery.**

- [ ] **Step 4: Bump the PWA shell and asset versions so browsers cannot retain the low-contrast icons or old inline-script pages. Keep admin/auth routes excluded from caching.**

- [ ] **Step 5: Run `npm test`, all JavaScript syntax checks, JSON parsing checks, `npm audit --omit=dev`, and `git diff --check`.**

- [ ] **Step 6: Run local end-to-end HTTP tests and desktop/mobile browser checks for icon contrast, transition geometry, login lifecycle, rejected unauthorized save, accepted authorized Namecheap-style save, logout, and form behavior.**

- [ ] **Step 7: Generate a local credential set, store it only in ignored local configuration, set the matching Vercel production variables, and provide the cPanel values through a local owner-only setup artifact.**

- [ ] **Step 8: Merge and push to GitHub, verify Vercel production status and headers, verify the public admin is locked, and prepare a matching Namecheap Node package without local secrets.**

- [ ] **Step 9: Stage Vercel login/contact firewall rules in log-only mode, inspect the diff, and leave publishing to the owner after traffic review.**

- [ ] **Step 10: Commit operational files with `git commit -m "chore: add BizYako security operations"`.**

