const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const {
  createRateLimiter,
  getSecurityHeaders,
  resolvePublicPath,
  validateOrigin,
} = require("../lib/security/http");

test("origin validation only permits exact configured origins", () => {
  const allowed = ["https://bizyako.com", "https://bizyako.vercel.app", "http://localhost:4000"];

  assert.equal(validateOrigin("https://bizyako.com", allowed), true);
  assert.equal(validateOrigin("https://bizyako.vercel.app", allowed), true);
  assert.equal(validateOrigin("https://bizyako.com.evil.example", allowed), false);
  assert.equal(validateOrigin("http://bizyako.com", allowed), false);
  assert.equal(validateOrigin("https://bizyako.com/path", allowed), false);
  assert.equal(validateOrigin(null, allowed), false);
});

test("rate limiter blocks a key until its fixed window resets", () => {
  let clock = 10_000;
  const limiter = createRateLimiter({ limit: 2, windowMs: 1_000, now: () => clock });

  assert.deepEqual(limiter.check("visitor"), { allowed: true, remaining: 1, retryAfterMs: 0, resetAt: 11_000 });
  assert.deepEqual(limiter.check("visitor"), { allowed: true, remaining: 0, retryAfterMs: 0, resetAt: 11_000 });
  assert.deepEqual(limiter.check("visitor"), { allowed: false, remaining: 0, retryAfterMs: 1_000, resetAt: 11_000 });
  assert.equal(limiter.check("another").allowed, true);

  clock = 11_001;
  assert.deepEqual(limiter.check("visitor"), { allowed: true, remaining: 1, retryAfterMs: 0, resetAt: 12_001 });
});

test("security headers enforce a strict browser policy and admin privacy", () => {
  const headers = getSecurityHeaders({ admin: true, production: true });

  assert.match(headers["Content-Security-Policy"], /default-src 'self'/);
  assert.match(headers["Content-Security-Policy"], /object-src 'none'/);
  assert.match(headers["Content-Security-Policy"], /frame-ancestors 'none'/);
  assert.doesNotMatch(headers["Content-Security-Policy"], /'unsafe-inline'|'unsafe-eval'/);
  assert.equal(headers["Strict-Transport-Security"], "max-age=31536000; includeSubDomains");
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.equal(headers["Cross-Origin-Opener-Policy"], "same-origin");
  assert.equal(headers["Cross-Origin-Resource-Policy"], "same-origin");
  assert.equal(headers["Cache-Control"], "no-store, max-age=0");
  assert.match(headers["X-Robots-Tag"], /noindex/);

  const development = getSecurityHeaders({ admin: false, production: false });
  assert.equal(development["Strict-Transport-Security"], undefined);
  assert.equal(development["X-Robots-Tag"], undefined);
});

test("public path resolution rejects null bytes, traversal, and sibling-prefix escapes", () => {
  const root = path.resolve("fixture-public");

  assert.equal(resolvePublicPath(root, "/index.html"), path.join(root, "index.html"));
  assert.equal(resolvePublicPath(root, "/assets/logo.png"), path.join(root, "assets", "logo.png"));
  assert.equal(resolvePublicPath(root, "/../fixture-public-other/secret.txt"), null);
  assert.equal(resolvePublicPath(root, "/%2e%2e/secret.txt"), null);
  assert.equal(resolvePublicPath(root, "/%252e%252e%252fsecret.txt"), null);
  assert.equal(resolvePublicPath(root, "/assets/%00logo.png"), null);
  assert.equal(resolvePublicPath(root, "/assets\\..\\secret.txt"), null);
});