const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const { hashPassword } = require("../lib/security/auth");

const root = path.join(__dirname, "..");
const adminPassword = "Testing-Only-Admin-Password";
const sessionSecret = "integration-session-secret-value-32-bytes";

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const socket = net.createServer();
    socket.once("error", reject);
    socket.listen(0, "127.0.0.1", () => {
      const { port } = socket.address();
      socket.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

async function waitForServer(baseUrl, child) {
  const deadline = Date.now() + 8_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Server exited before becoming ready (${child.exitCode}).`);
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Timed out waiting for the test server.");
}

async function jsonRequest(baseUrl, pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, options);
  const payload = await response.json();
  return { response, payload };
}

const contactPayload = (overrides = {}) => ({
  name: "Amina Kamau",
  need: "ERP workflow",
  message: "We need approvals, inventory, finance, and reporting in one secure workspace.",
  website: "",
  formStartedAt: Date.now() - 5_000,
  ...overrides,
});

test("Node runtime enforces the BizYako security boundary end to end", async (t) => {
  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "bizyako-security-"));
  const carouselPath = path.join(temporaryDirectory, "carouselSlides.json");
  fs.copyFileSync(path.join(root, "data", "carouselSlides.json"), carouselPath);

  const child = spawn(process.execPath, ["server.js"], {
    cwd: root,
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: "production",
      BIZYAKO_ADMIN_PASSWORD_HASH: hashPassword(adminPassword, Buffer.alloc(16, 9)),
      BIZYAKO_SESSION_SECRET: sessionSecret,
      BIZYAKO_ALLOWED_ORIGINS: baseUrl,
      BIZYAKO_CAROUSEL_PATH: carouselPath,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let serverErrors = "";
  child.stderr.on("data", (chunk) => { serverErrors += chunk.toString(); });

  t.after(async () => {
    if (child.exitCode === null) {
      child.kill();
      await new Promise((resolve) => child.once("exit", resolve));
    }
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  });

  await waitForServer(baseUrl, child);

  await t.test("every response receives strict headers and admin pages remain private to crawlers", async () => {
    const homepage = await fetch(`${baseUrl}/`);
    assert.equal(homepage.status, 200);
    assert.match(homepage.headers.get("content-security-policy"), /default-src 'self'/);
    assert.equal(homepage.headers.get("x-frame-options"), "DENY");
    assert.equal(homepage.headers.get("strict-transport-security"), "max-age=31536000; includeSubDomains");

    const admin = await fetch(`${baseUrl}/by-admin`);
    assert.equal(admin.status, 200);
    assert.match(admin.headers.get("cache-control"), /no-store/);
    assert.match(admin.headers.get("x-robots-tag"), /noindex/);

    assert.equal((await fetch(`${baseUrl}/server.js`)).status, 404);
    assert.equal((await fetch(`${baseUrl}/%252e%252e%252fserver.js`)).status, 404);
  });

  await t.test("carousel writes require a valid session, exact origin, and CSRF token", async () => {
    const slides = JSON.parse(fs.readFileSync(carouselPath, "utf8"));
    let result = await jsonRequest(baseUrl, "/api/carousel", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: baseUrl },
      body: JSON.stringify({ slides }),
    });
    assert.equal(result.response.status, 401);
    assert.equal(result.payload.ok, false);

    result = await jsonRequest(baseUrl, "/api/admin-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://bizyako.com.evil.example" },
      body: JSON.stringify({ password: adminPassword }),
    });
    assert.equal(result.response.status, 403);

    result = await jsonRequest(baseUrl, "/api/admin-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: baseUrl },
      body: JSON.stringify({ password: adminPassword }),
    });
    assert.equal(result.response.status, 200);
    assert.equal(result.payload.authenticated, true);
    assert.match(result.payload.csrfToken, /^[A-Za-z0-9_-]{20,}$/);
    const cookie = result.response.headers.get("set-cookie").split(";")[0];
    assert.match(result.response.headers.get("set-cookie"), /HttpOnly/);
    assert.match(result.response.headers.get("set-cookie"), /SameSite=Strict/);
    assert.match(result.response.headers.get("set-cookie"), /Secure/);

    const session = await jsonRequest(baseUrl, "/api/admin-auth", { headers: { Cookie: cookie } });
    assert.equal(session.payload.authenticated, true);
    assert.equal(session.payload.csrfToken, result.payload.csrfToken);

    const noCsrf = await jsonRequest(baseUrl, "/api/carousel", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: baseUrl, Cookie: cookie },
      body: JSON.stringify({ slides }),
    });
    assert.equal(noCsrf.response.status, 403);

    const changedSlides = slides.map((slide, index) => index === 0 ? { ...slide, label: "Secure Suite" } : slide);
    const saved = await jsonRequest(baseUrl, "/api/carousel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: baseUrl,
        Cookie: cookie,
        "X-CSRF-Token": result.payload.csrfToken,
      },
      body: JSON.stringify({ slides: changedSlides }),
    });
    assert.equal(saved.response.status, 200);
    assert.equal(saved.payload.slides[0].label, "Secure Suite");
    assert.equal(JSON.parse(fs.readFileSync(carouselPath, "utf8"))[0].label, "Secure Suite");

    const logout = await jsonRequest(baseUrl, "/api/admin-auth", {
      method: "DELETE",
      headers: { Origin: baseUrl, Cookie: cookie, "X-CSRF-Token": result.payload.csrfToken },
    });
    assert.equal(logout.response.status, 200);
    assert.match(logout.response.headers.get("set-cookie"), /Max-Age=0/);
  });

  await t.test("contact requests require JSON, pass validation, enforce byte limits, and throttle abuse", async () => {
    const wrongType = await jsonRequest(baseUrl, "/api/contact", {
      method: "POST",
      headers: { "Content-Type": "text/plain", Origin: baseUrl },
      body: JSON.stringify(contactPayload()),
    });
    assert.equal(wrongType.response.status, 415);

    const valid = await jsonRequest(baseUrl, "/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: baseUrl, "X-Forwarded-For": "203.0.113.10" },
      body: JSON.stringify(contactPayload()),
    });
    assert.equal(valid.response.status, 201);
    assert.equal(valid.payload.ok, true);
    assert.doesNotMatch(JSON.stringify(valid.payload), /formStartedAt|website/);

    const tooLarge = await jsonRequest(baseUrl, "/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: baseUrl, "X-Forwarded-For": "203.0.113.11" },
      body: JSON.stringify(contactPayload({ message: "x".repeat(33 * 1024) })),
    });
    assert.equal(tooLarge.response.status, 413);

    for (let index = 0; index < 6; index += 1) {
      const allowed = await jsonRequest(baseUrl, "/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: baseUrl, "X-Forwarded-For": "203.0.113.12" },
        body: JSON.stringify(contactPayload()),
      });
      assert.equal(allowed.response.status, 201);
    }
    const limited = await jsonRequest(baseUrl, "/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: baseUrl, "X-Forwarded-For": "203.0.113.12" },
      body: JSON.stringify(contactPayload()),
    });
    assert.equal(limited.response.status, 429);
    assert.ok(Number(limited.response.headers.get("retry-after")) >= 1);
  });

  await t.test("login attempts are throttled and failures stay generic", async () => {
    for (let index = 0; index < 5; index += 1) {
      const denied = await jsonRequest(baseUrl, "/api/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: baseUrl, "X-Forwarded-For": "203.0.113.20" },
        body: JSON.stringify({ password: `wrong-${index}` }),
      });
      assert.equal(denied.response.status, 401);
      assert.deepEqual(denied.payload, { ok: false, message: "Unable to sign in." });
    }
    const limited = await jsonRequest(baseUrl, "/api/admin-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: baseUrl, "X-Forwarded-For": "203.0.113.20" },
      body: JSON.stringify({ password: "wrong-again" }),
    });
    assert.equal(limited.response.status, 429);
    assert.doesNotMatch(serverErrors, new RegExp(adminPassword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.doesNotMatch(serverErrors, /BIZYAKO_SESSION_SECRET|scrypt\$v1\$/);
  });
});