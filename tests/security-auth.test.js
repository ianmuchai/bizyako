const test = require("node:test");
const assert = require("node:assert/strict");

const {
  SESSION_COOKIE_NAME,
  createSession,
  createSessionCookie,
  clearSessionCookie,
  hashPassword,
  parseCookies,
  verifyPassword,
  verifySession,
} = require("../lib/security/auth");

const secret = "s".repeat(32);

test("scrypt password hashes verify valid credentials and reject malformed input", () => {
  const encoded = hashPassword("Correct Horse Battery Staple", Buffer.alloc(16, 7));

  assert.match(encoded, /^scrypt\$v1\$[A-Za-z0-9_-]+\$[A-Za-z0-9_-]+$/);
  assert.equal(verifyPassword("Correct Horse Battery Staple", encoded), true);
  assert.equal(verifyPassword("incorrect", encoded), false);
  assert.equal(verifyPassword("anything", "not-a-valid-hash"), false);
  assert.equal(verifyPassword("anything", "scrypt$v1$bad$bad"), false);
});

test("signed sessions carry an unpredictable CSRF token and reject tampering", () => {
  const session = createSession({ secret, now: 1_000, ttlMs: 60_000 });

  assert.match(session.csrfToken, /^[A-Za-z0-9_-]{20,}$/);
  assert.equal(session.expiresAt, 61_000);
  assert.deepEqual(verifySession(session.token, { secret, now: 60_000 }), {
    ok: true,
    csrfToken: session.csrfToken,
    expiresAt: 61_000,
  });

  const [payload, signature] = session.token.split(".");
  const tamperedPayload = `${payload.slice(0, -1)}${payload.endsWith("A") ? "B" : "A"}`;
  assert.deepEqual(verifySession(`${tamperedPayload}.${signature}`, { secret, now: 2_000 }), { ok: false });
  assert.deepEqual(verifySession(session.token, { secret, now: 61_001 }), { ok: false });
});

test("session configuration rejects weak secrets and invalid lifetimes", () => {
  assert.throws(() => createSession({ secret: "short" }), /32 bytes/);
  assert.throws(() => createSession({ secret, ttlMs: 0 }), /ttl/i);
  assert.throws(() => verifySession("invalid", { secret: "short" }), /32 bytes/);
});

test("session cookies are host-only, HttpOnly, strict, and secure in production", () => {
  const secureCookie = createSessionCookie("signed-token", { secure: true, maxAgeSeconds: 1_800 });
  assert.match(secureCookie, new RegExp(`^__Host-${SESSION_COOKIE_NAME}=signed-token;`));
  assert.match(secureCookie, /Path=\//);
  assert.match(secureCookie, /HttpOnly/);
  assert.match(secureCookie, /Secure/);
  assert.match(secureCookie, /SameSite=Strict/);
  assert.match(secureCookie, /Max-Age=1800/);
  assert.doesNotMatch(secureCookie, /Domain=/);

  const localCookie = createSessionCookie("local-token", { secure: false, maxAgeSeconds: 60 });
  assert.match(localCookie, new RegExp(`^${SESSION_COOKIE_NAME}=local-token;`));
  assert.doesNotMatch(localCookie, /; Secure/);

  const cleared = clearSessionCookie({ secure: true });
  assert.match(cleared, /Max-Age=0/);
  assert.match(cleared, /Expires=Thu, 01 Jan 1970 00:00:00 GMT/);
});

test("cookie parsing decodes values without accepting malformed segments", () => {
  assert.deepEqual(parseCookies("theme=dark; bizyako_admin=abc%2Edef; malformed; empty="), {
    theme: "dark",
    bizyako_admin: "abc.def",
    empty: "",
  });
  assert.deepEqual(parseCookies(undefined), {});
});