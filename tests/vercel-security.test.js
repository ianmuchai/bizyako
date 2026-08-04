const test = require("node:test");
const assert = require("node:assert/strict");

const { hashPassword } = require("../lib/security/auth");
const slides = require("../data/carouselSlides.json");

class MockResponse {
  constructor() {
    this.headers = new Map();
    this.statusCode = 200;
    this.payload = undefined;
  }
  setHeader(name, value) {
    this.headers.set(String(name).toLowerCase(), value);
  }
  getHeader(name) {
    return this.headers.get(String(name).toLowerCase());
  }
  status(code) {
    this.statusCode = code;
    return this;
  }
  json(payload) {
    this.payload = payload;
    return this;
  }
  end(payload) {
    this.payload = payload;
    return this;
  }
}

function request(method, { body, origin = "https://bizyako.com", cookie, csrf, ip = "203.0.113.50", contentType = "application/json" } = {}) {
  const headers = {
    origin,
    "content-type": contentType,
    "x-forwarded-for": ip,
  };
  if (cookie) headers.cookie = cookie;
  if (csrf) headers["x-csrf-token"] = csrf;
  return { method, headers, body };
}

async function invoke(handler, req) {
  const res = new MockResponse();
  await handler(req, res);
  return res;
}

const validContact = (overrides = {}) => ({
  name: "Amina Kamau",
  need: "Business analytics",
  message: "We need a secure reporting workspace for our management team.",
  website: "",
  formStartedAt: Date.now() - 5_000,
  ...overrides,
});

test("Vercel handlers enforce auth, validation, throttling, and headers", async (t) => {
  const originalEnvironment = {
    passwordHash: process.env.BIZYAKO_ADMIN_PASSWORD_HASH,
    sessionSecret: process.env.BIZYAKO_SESSION_SECRET,
    origins: process.env.BIZYAKO_ALLOWED_ORIGINS,
    siliconFlowKey: process.env.SILICONFLOW_API_KEY,
    siliconFlowBaseUrl: process.env.SILICONFLOW_BASE_URL,
    siliconFlowModel: process.env.SILICONFLOW_MODEL,
    siliconFlowModel2: process.env.SILICONFLOW_MODEL_2,
  };
  const originalFetch = global.fetch;
  const password = "Vercel-Integration-Password";
  process.env.BIZYAKO_ADMIN_PASSWORD_HASH = hashPassword(password, Buffer.alloc(16, 4));
  process.env.BIZYAKO_SESSION_SECRET = "vercel-integration-session-secret-32-bytes";
  process.env.BIZYAKO_ALLOWED_ORIGINS = "https://bizyako.com,https://bizyako.vercel.app";
  process.env.SILICONFLOW_API_KEY = "test-provider-credential";
  process.env.SILICONFLOW_BASE_URL = "https://api.siliconflow.com/v1";
  process.env.SILICONFLOW_MODEL = "openai/gpt-oss-120b";
  process.env.SILICONFLOW_MODEL_2 = "google/gemma-4-31B-it";
  t.after(() => {
    if (originalEnvironment.passwordHash === undefined) delete process.env.BIZYAKO_ADMIN_PASSWORD_HASH;
    else process.env.BIZYAKO_ADMIN_PASSWORD_HASH = originalEnvironment.passwordHash;
    if (originalEnvironment.sessionSecret === undefined) delete process.env.BIZYAKO_SESSION_SECRET;
    else process.env.BIZYAKO_SESSION_SECRET = originalEnvironment.sessionSecret;
    if (originalEnvironment.origins === undefined) delete process.env.BIZYAKO_ALLOWED_ORIGINS;
    else process.env.BIZYAKO_ALLOWED_ORIGINS = originalEnvironment.origins;
    if (originalEnvironment.siliconFlowKey === undefined) delete process.env.SILICONFLOW_API_KEY;
    else process.env.SILICONFLOW_API_KEY = originalEnvironment.siliconFlowKey;
    if (originalEnvironment.siliconFlowBaseUrl === undefined) delete process.env.SILICONFLOW_BASE_URL;
    else process.env.SILICONFLOW_BASE_URL = originalEnvironment.siliconFlowBaseUrl;
    if (originalEnvironment.siliconFlowModel === undefined) delete process.env.SILICONFLOW_MODEL;
    else process.env.SILICONFLOW_MODEL = originalEnvironment.siliconFlowModel;
    if (originalEnvironment.siliconFlowModel2 === undefined) delete process.env.SILICONFLOW_MODEL_2;
    else process.env.SILICONFLOW_MODEL_2 = originalEnvironment.siliconFlowModel2;
    global.fetch = originalFetch;
  });

  const adminAuth = require("../api/admin-auth");
  const carousel = require("../api/carousel");
  const chat = require("../api/chat");
  const contact = require("../api/contact");
  const health = require("../api/health");

  await t.test("missing security configuration fails closed", async () => {
    const hash = process.env.BIZYAKO_ADMIN_PASSWORD_HASH;
    delete process.env.BIZYAKO_ADMIN_PASSWORD_HASH;
    const result = await invoke(adminAuth, request("POST", { body: { password } }));
    process.env.BIZYAKO_ADMIN_PASSWORD_HASH = hash;

    assert.equal(result.statusCode, 503);
    assert.equal(result.payload.ok, false);
    assert.doesNotMatch(JSON.stringify(result.payload), /secret|hash|environment/i);
  });

  await t.test("login, session inspection, and logout use a secure stateless cookie and CSRF", async () => {
    const rejected = await invoke(adminAuth, request("POST", {
      origin: "https://bizyako.com.evil.example",
      body: { password },
    }));
    assert.equal(rejected.statusCode, 403);

    const login = await invoke(adminAuth, request("POST", { body: { password } }));
    assert.equal(login.statusCode, 200);
    assert.equal(login.payload.authenticated, true);
    assert.match(login.payload.csrfToken, /^[A-Za-z0-9_-]{20,}$/);
    assert.match(login.getHeader("set-cookie"), /^__Host-bizyako_admin=/);
    assert.match(login.getHeader("set-cookie"), /HttpOnly/);
    assert.match(login.getHeader("set-cookie"), /SameSite=Strict/);
    const cookie = login.getHeader("set-cookie").split(";")[0];

    const session = await invoke(adminAuth, request("GET", { cookie }));
    assert.equal(session.statusCode, 200);
    assert.equal(session.payload.authenticated, true);
    assert.equal(session.payload.csrfToken, login.payload.csrfToken);

    const badLogout = await invoke(adminAuth, request("DELETE", { cookie, csrf: "incorrect" }));
    assert.equal(badLogout.statusCode, 403);

    const logout = await invoke(adminAuth, request("DELETE", { cookie, csrf: login.payload.csrfToken }));
    assert.equal(logout.statusCode, 200);
    assert.match(logout.getHeader("set-cookie"), /Max-Age=0/);
  });

  await t.test("carousel writes require auth and CSRF before returning the read-only platform response", async () => {
    const unauthenticated = await invoke(carousel, request("POST", { body: { slides } }));
    assert.equal(unauthenticated.statusCode, 401);

    const login = await invoke(adminAuth, request("POST", { body: { password }, ip: "203.0.113.51" }));
    const cookie = login.getHeader("set-cookie").split(";")[0];
    const noCsrf = await invoke(carousel, request("POST", { body: { slides }, cookie }));
    assert.equal(noCsrf.statusCode, 403);

    const readOnly = await invoke(carousel, request("POST", {
      body: { slides },
      cookie,
      csrf: login.payload.csrfToken,
    }));
    assert.equal(readOnly.statusCode, 403);
    assert.match(readOnly.payload.message, /local BizYako admin/i);
  });

  await t.test("contact handler validates, bounds, and rate-limits requests", async () => {
    const wrongType = await invoke(contact, request("POST", { body: validContact(), contentType: "text/plain" }));
    assert.equal(wrongType.statusCode, 415);

    const invalid = await invoke(contact, request("POST", { body: validContact({ website: "spam" }), ip: "203.0.113.60" }));
    assert.equal(invalid.statusCode, 400);

    const valid = await invoke(contact, request("POST", { body: validContact(), ip: "203.0.113.61" }));
    assert.equal(valid.statusCode, 201);
    assert.equal(valid.payload.ok, true);

    for (let index = 0; index < 6; index += 1) {
      const allowed = await invoke(contact, request("POST", { body: validContact(), ip: "203.0.113.62" }));
      assert.equal(allowed.statusCode, 201);
    }
    const limited = await invoke(contact, request("POST", { body: validContact(), ip: "203.0.113.62" }));
    assert.equal(limited.statusCode, 429);
    assert.ok(Number(limited.getHeader("retry-after")) >= 1);
  });

  await t.test("chat handler proxies safe advisor requests without exposing provider details", async () => {
    const providerCalls = [];
    global.fetch = async (url, options) => {
      providerCalls.push({ url, options });
      return new Response(JSON.stringify({
        choices: [{ message: { content: "A phased ERP rollout can connect inventory, finance, and approvals." } }],
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    const wrongMethod = await invoke(chat, request("GET"));
    assert.equal(wrongMethod.statusCode, 405);

    const wrongOrigin = await invoke(chat, request("POST", {
      origin: "https://bizyako.com.evil.example",
      body: { messages: [{ role: "user", content: "Help with ERP." }] },
    }));
    assert.equal(wrongOrigin.statusCode, 403);

    const wrongType = await invoke(chat, request("POST", {
      body: { messages: [{ role: "user", content: "Help with ERP." }] },
      contentType: "text/plain",
    }));
    assert.equal(wrongType.statusCode, 415);

    const valid = await invoke(chat, request("POST", {
      body: { messages: [{ role: "user", content: "Help with ERP." }] },
      ip: "203.0.113.70",
    }));
    assert.equal(valid.statusCode, 200);
    assert.deepEqual(valid.payload, {
      ok: true,
      reply: "A phased ERP rollout can connect inventory, finance, and approvals.",
      model: "openai/gpt-oss-120b",
      fallback: false,
    });
    assert.match(valid.getHeader("cache-control"), /no-store/);
    assert.equal(providerCalls.length, 1);

    const key = process.env.SILICONFLOW_API_KEY;
    delete process.env.SILICONFLOW_API_KEY;
    const unavailable = await invoke(chat, request("POST", {
      body: { messages: [{ role: "user", content: "Help with CRM." }] },
      ip: "203.0.113.71",
    }));
    process.env.SILICONFLOW_API_KEY = key;
    assert.equal(unavailable.statusCode, 503);
    assert.deepEqual(unavailable.payload, {
      ok: false,
      message: "The BizYako advisor is temporarily unavailable. Please try again shortly.",
    });

    for (let index = 0; index < 12; index += 1) {
      const allowed = await invoke(chat, request("POST", {
        body: { messages: [{ role: "user", content: `Advisor question ${index}` }] },
        ip: "203.0.113.72",
      }));
      assert.equal(allowed.statusCode, 200);
    }
    const limited = await invoke(chat, request("POST", {
      body: { messages: [{ role: "user", content: "One more question" }] },
      ip: "203.0.113.72",
    }));
    assert.equal(limited.statusCode, 429);
    assert.ok(Number(limited.getHeader("retry-after")) >= 1);
  });

  await t.test("function responses and vercel.json carry the strict shared policy", async () => {
    const result = await invoke(health, request("GET"));
    assert.equal(result.statusCode, 200);
    assert.match(result.getHeader("content-security-policy"), /default-src 'self'/);
    assert.equal(result.getHeader("x-content-type-options"), "nosniff");
    assert.equal(result.getHeader("x-frame-options"), "DENY");

    const config = require("../vercel.json");
    const wildcard = config.headers.find((entry) => entry.source === "/(.*)");
    assert.ok(wildcard);
    const headerMap = Object.fromEntries(wildcard.headers.map(({ key, value }) => [key, value]));
    assert.match(headerMap["Content-Security-Policy"], /frame-ancestors 'none'/);
    assert.equal(headerMap["Strict-Transport-Security"], "max-age=31536000; includeSubDomains");
    assert.equal(headerMap["X-Frame-Options"], "DENY");
    assert.ok(config.headers.some((entry) => entry.source === "/by-admin" && entry.headers.some(({ key }) => key === "X-Robots-Tag")));
  });
});