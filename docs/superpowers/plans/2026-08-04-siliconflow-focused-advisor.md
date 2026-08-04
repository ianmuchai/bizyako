# SiliconFlow Focused Advisor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing fixed BizYako guide into a secure SiliconFlow-backed product advisor with bilingual answers, protected provider fallback, 30-day returning-visitor history, and honest consultation/WhatsApp lead handoff.

**Architecture:** A dependency-free shared Node module validates chat payloads, redacts likely contact details, builds a BizYako-only system prompt, and calls SiliconFlow's OpenAI-compatible endpoint with primary/fallback routing. The cPanel Node server and Vercel function expose the same `/api/chat` contract. The existing browser widget gains a safe text composer and lead controls, while a small standalone history module owns bounded localStorage persistence.

**Tech Stack:** Node.js 20 built-in `fetch`, CommonJS, Vercel Functions, vanilla HTML/CSS/JavaScript, Node test runner, localStorage, Namecheap Passenger.

## Global Constraints

- Never write the SiliconFlow API key into source, Git, browser assets, logs, tests, generated static output, service-worker caches, or deployment archives.
- Use `openai/gpt-oss-120b` as primary and `google/gemma-4-31B-it` as retryable fallback.
- Keep the advisor limited to BizYako products and consultation discovery in English or Swahili.
- Render model output as bounded plain text, never HTML.
- Keep lead name and phone outside model messages and persisted chat history.
- Retain chat history locally for 30 days with a visible clear action.
- Preserve deterministic product guidance when the provider is unavailable.
- Keep Node/cPanel and Vercel endpoint behavior equivalent.
- Add no runtime package dependency.

---

### Task 1: Shared Advisor Service

**Files:**
- Create: `lib/advisor.js`
- Create: `tests/advisor.test.js`

**Interfaces:**
- Produces: `validateChatPayload(payload)` returning `{ ok, messages?, message? }`.
- Produces: `redactSensitiveText(text)` returning a bounded string with likely email and phone values replaced.
- Produces: `getAdvisorConfig(env)` returning `{ configured, apiKey, baseUrl, primaryModel, fallbackModel }`.
- Produces: `requestAdvisorReply(messages, options)` returning `{ reply, model, fallback }` or throwing `AdvisorError` with a safe HTTP status.

- [ ] **Step 1: Write failing validation, redaction, configuration, and provider-routing tests**

```js
const validation = validateChatPayload({ messages: [{ role: "user", content: "I need an ERP" }] });
assert.equal(validation.ok, true);
assert.match(redactSensitiveText("Call 0754959895 or a@b.com"), /\[phone redacted\].*\[email redacted\]/);
assert.throws(() => getAdvisorConfig({ SILICONFLOW_BASE_URL: "http://evil.example" }), /configuration/i);
assert.deepEqual(await requestAdvisorReply(validation.messages, { env, fetchImpl }), {
  reply: "Let us map your finance and inventory workflow.",
  model: "openai/gpt-oss-120b",
  fallback: false,
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/advisor.test.js`

Expected: FAIL because `lib/advisor.js` does not exist.

- [ ] **Step 3: Implement the minimal shared service**

Implement exact field allowlists; ten-message, 1,000-character-per-message, and 6,000-character-total limits; HTTPS SiliconFlow host validation; a BizYako system prompt generated from `data/siteData.js`; primary request parsing from `choices[0].message.content`; retry only for `429`, `503`, `504`, timeout/network failure, or unusable response; bounded reply output; and safe `AdvisorError` statuses.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test tests/advisor.test.js`

Expected: PASS with no real provider calls.

- [ ] **Step 5: Commit the shared service**

```powershell
git add lib\advisor.js tests\advisor.test.js
git commit -m "feat: add secure SiliconFlow advisor service"
```

### Task 2: Node and Vercel Chat Routes

**Files:**
- Create: `api/chat.js`
- Modify: `server.js`
- Modify: `tests/server-security.test.js`
- Modify: `tests/vercel-security.test.js`

**Interfaces:**
- Consumes: `validateChatPayload()` and `requestAdvisorReply()` from `lib/advisor.js`.
- Produces: same-origin `POST /api/chat` with `{ ok: true, reply, model, fallback }`.

- [ ] **Step 1: Add failing end-to-end route tests**

Add assertions that both hosts reject non-POST, wrong content type, disallowed origins, malformed messages, oversized bodies, and excessive requests; return `Cache-Control: no-store`; and map unconfigured/provider failures to generic responses. Inject a fake provider fetch in direct handler tests and add a local fake upstream URL only through the shared service test seam.

- [ ] **Step 2: Run route tests and verify RED**

Run: `node --test tests/server-security.test.js tests/vercel-security.test.js`

Expected: FAIL because `/api/chat` and `api/chat.js` do not exist.

- [ ] **Step 3: Implement the Node route**

Add a 16 KB body limit, dedicated chat limiter, in-flight client set, exact-origin enforcement, safe event logging, and route dispatch in `server.js`. Clear the in-flight entry in `finally` and never log payload text.

- [ ] **Step 4: Implement the matching Vercel handler**

Use `readVercelJson`, `isVercelOriginAllowed`, `getVercelClientKey`, `applyVercelSecurityHeaders`, and the same shared advisor service. Return identical statuses and response shapes.

- [ ] **Step 5: Run route tests and verify GREEN**

Run: `node --test tests/server-security.test.js tests/vercel-security.test.js`

Expected: PASS, including no-store, origin, throttling, and provider-error cases.

- [ ] **Step 6: Commit both routes**

```powershell
git add server.js api\chat.js tests\server-security.test.js tests\vercel-security.test.js
git commit -m "feat: expose protected advisor chat routes"
```

### Task 3: Returning-Visitor History

**Files:**
- Create: `chat-history.js`
- Create: `tests/chat-history.test.js`
- Modify: `scripts/build-vercel-static.js`
- Modify: `server.js`

**Interfaces:**
- Produces: `BizYakoChatHistory.load(storage, now)`, `.save(storage, messages, now)`, and `.clear(storage)` in the browser.
- Produces: matching CommonJS exports for Node tests.

- [ ] **Step 1: Write failing history tests**

```js
history.save(storage, [{ role: "user", content: "ERP", at: now }], now);
assert.equal(history.load(storage, now + 29 * DAY).length, 1);
assert.deepEqual(history.load(storage, now + 31 * DAY), []);
assert.doesNotMatch(JSON.stringify(storage.values()), /phone|apiKey|system/i);
```

Cover versioning, 30-day rolling expiry, a maximum of 40 messages, a 64 KB storage ceiling, invalid JSON recovery, and explicit clear.

- [ ] **Step 2: Run history tests and verify RED**

Run: `node --test tests/chat-history.test.js`

Expected: FAIL because `chat-history.js` does not exist.

- [ ] **Step 3: Implement the UMD-style history module**

Expose the API on `window.BizYakoChatHistory` and `module.exports`. Normalize only `user`/`assistant`, bounded `content`, and numeric timestamps. Store no arbitrary fields.

- [ ] **Step 4: Publish the file through both hosting allowlists**

Add `/chat-history.js` to Node `PUBLIC_FILES` and `chat-history.js` to the Vercel static builder.

- [ ] **Step 5: Run tests and verify GREEN**

Run: `node --test tests/chat-history.test.js tests/security-operations.test.js`

Expected: PASS and `chat-history.js` appears in allowlisted Vercel output.

- [ ] **Step 6: Commit history support**

```powershell
git add chat-history.js tests\chat-history.test.js scripts\build-vercel-static.js server.js tests\security-operations.test.js
git commit -m "feat: retain bounded advisor history"
```

### Task 4: Live Advisor and Lead Interface

**Files:**
- Modify: `index.html`
- Modify: `script.js`
- Modify: `styles.css`
- Create: `tests/chat-advisor-ui.test.js`
- Modify: `tests/accessibility-ui.test.js`
- Modify: `tests/responsive-ui.test.js`
- Modify: `tests/support-ui.test.js`

**Interfaces:**
- Consumes: `/api/chat` and `window.BizYakoChatHistory`.
- Produces: safe chat composer, product prompts, typing/retry state, clear history, name/phone lead card, consultation prefill, and WhatsApp handoff.

- [ ] **Step 1: Write failing UI contract tests**

Assert the presence of a labeled composer, send icon button, live status region, clear-history control, name/phone lead fields, consultation and WhatsApp actions, `chat-history.js` before `script.js`, plain-text message rendering, `/api/chat` fetch, 30-day history use, and the `254754959895` WhatsApp destination. Assert 44px controls and mobile panel containment.

- [ ] **Step 2: Run UI tests and verify RED**

Run: `node --test tests/chat-advisor-ui.test.js tests/accessibility-ui.test.js tests/responsive-ui.test.js tests/support-ui.test.js`

Expected: FAIL because the interactive advisor controls do not exist.

- [ ] **Step 3: Add semantic HTML controls**

Add the header clear button, chat form, autosizing textarea, typing/live status, retry surface, and inert lead card. Keep quick product actions and existing footer actions.

- [ ] **Step 4: Implement browser behavior**

Restore valid history on load; submit the latest bounded conversation to `/api/chat`; append user and assistant content with `textContent`; disable duplicate sends; support Enter and Shift+Enter; save only conversation messages; clear history; use deterministic guides on failure; and preserve current product activation.

- [ ] **Step 5: Implement both lead paths**

Validate name and phone locally. Prefill the existing product-definition form without adding contact fields to AI history. Build the WhatsApp URL with an encoded summary and require the visitor to click the explicit handoff action. Do not claim delivery before the external channel opens.

- [ ] **Step 6: Style responsive states**

Keep the panel bottom anchored and visually consistent with the approved glass treatment. Add stable composer dimensions, compact lead fields, loading dots, error/retry state, mobile safe-area spacing, visible focus, 44px controls, and reduced-motion handling.

- [ ] **Step 7: Run UI tests and verify GREEN**

Run: `node --test tests/chat-advisor-ui.test.js tests/accessibility-ui.test.js tests/responsive-ui.test.js tests/support-ui.test.js`

Expected: PASS with no unsafe `innerHTML` use for model output.

- [ ] **Step 8: Commit the interface**

```powershell
git add index.html script.js styles.css tests\chat-advisor-ui.test.js tests\accessibility-ui.test.js tests\responsive-ui.test.js tests\support-ui.test.js
git commit -m "feat: connect focused advisor experience"
```

### Task 5: PWA, Configuration, and Release Verification

**Files:**
- Modify: `service-worker.js`
- Modify: `tests/pwa.test.js`
- Modify: `.gitignore`
- Create: `.env.example`
- Modify: `SECURITY.md`
- Modify: `tests/security-operations.test.js`

**Interfaces:**
- Consumes: all completed advisor files and routes.
- Produces: versioned offline shell, safe configuration template, updated runbook, verified Vercel build, and verified cPanel package inputs.

- [ ] **Step 1: Write failing release-surface tests**

Assert a new service-worker cache and asset token, `chat-history.js` in the shell, no API response caching, environment-variable names in `.env.example` and `SECURITY.md`, no credential-shaped values, and no environment files in deploy output.

- [ ] **Step 2: Run release tests and verify RED**

Run: `node --test tests/pwa.test.js tests/security-operations.test.js`

Expected: FAIL on stale cache/version/configuration documentation.

- [ ] **Step 3: Update PWA and configuration surfaces**

Bump the cache and asset token, include `chat-history.js`, keep API network-only with no cache write, allow `.env.example` in Git while `.vercelignore` still excludes `.env*`, and document all four SiliconFlow variables for cPanel and Vercel without values.

- [ ] **Step 4: Run complete verification**

Run:

```powershell
npm.cmd test
npm.cmd run syntax:check
npm.cmd run build
npm.cmd run security:scan
npm.cmd audit --omit=dev --audit-level=high
git diff --check
```

Expected: all tests pass, syntax check passes, Vercel output builds, no secrets are detected, no production vulnerabilities are reported, and no whitespace errors remain.

- [ ] **Step 5: Inspect public outputs for credential leakage**

Search tracked files and `dist/` for `SILICONFLOW_API_KEY`, `Authorization: Bearer`, and credential-shaped `sk-` values. Only server-side environment-variable references may remain in private Node files; public files and `dist/` must contain none.

- [ ] **Step 6: Commit release configuration**

```powershell
git add service-worker.js tests\pwa.test.js .gitignore .env.example SECURITY.md tests\security-operations.test.js
git commit -m "docs: configure advisor deployment"
```

- [ ] **Step 7: Push and package**

Push `main`, create a new allowlisted Namecheap ZIP containing the runtime chat modules but no `.env`, tests, docs, or credentials, extract it into a fresh smoke directory, start `app.js`, and verify `/api/health`, `/api/chat` failure-closed behavior without configuration, and private-path `404` responses.
