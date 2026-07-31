"use strict";

const crypto = require("node:crypto");

const SESSION_COOKIE_NAME = "bizyako_admin";
const MIN_SECRET_BYTES = 32;
const DEFAULT_SESSION_TTL_MS = 30 * 60 * 1000;
const PASSWORD_KEY_BYTES = 32;
const DUMMY_SALT = Buffer.alloc(16, 0x42);

const encode = (value) => Buffer.from(value).toString("base64url");

function decode(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    return Buffer.from(value, "base64url");
  } catch {
    return null;
  }
}

function normalizeSecret(secret) {
  const value = Buffer.isBuffer(secret)
    ? Buffer.from(secret)
    : secret instanceof Uint8Array
      ? Buffer.from(secret)
      : typeof secret === "string"
        ? Buffer.from(secret, "utf8")
        : Buffer.alloc(0);

  if (value.length < MIN_SECRET_BYTES) {
    throw new TypeError("Session secret must contain at least 32 bytes.");
  }
  return value;
}

function normalizePassword(password) {
  if (typeof password !== "string" || password.length < 1 || password.length > 1024) {
    throw new TypeError("Password must be a non-empty string no longer than 1024 characters.");
  }
  return password;
}

function normalizeSalt(salt) {
  if (salt === undefined) return crypto.randomBytes(16);
  const value = Buffer.isBuffer(salt)
    ? Buffer.from(salt)
    : salt instanceof Uint8Array
      ? Buffer.from(salt)
      : typeof salt === "string"
        ? decode(salt)
        : null;
  if (!value || value.length < 16 || value.length > 64) {
    throw new TypeError("Password salt must contain between 16 and 64 bytes.");
  }
  return value;
}

function hashPassword(password, salt) {
  const normalizedPassword = normalizePassword(password);
  const normalizedSalt = normalizeSalt(salt);
  const digest = crypto.scryptSync(normalizedPassword, normalizedSalt, PASSWORD_KEY_BYTES);
  return `scrypt$v1$${encode(normalizedSalt)}$${encode(digest)}`;
}

function verifyPassword(password, encodedHash) {
  const normalizedPassword = typeof password === "string" && password.length <= 1024 ? password : "";
  let salt = DUMMY_SALT;
  let expected = Buffer.alloc(PASSWORD_KEY_BYTES);
  let validFormat = false;

  if (typeof encodedHash === "string") {
    const parts = encodedHash.split("$");
    if (parts.length === 4 && parts[0] === "scrypt" && parts[1] === "v1") {
      const decodedSalt = decode(parts[2]);
      const decodedDigest = decode(parts[3]);
      if (decodedSalt && decodedSalt.length >= 16 && decodedSalt.length <= 64 && decodedDigest?.length === PASSWORD_KEY_BYTES) {
        salt = decodedSalt;
        expected = decodedDigest;
        validFormat = true;
      }
    }
  }

  try {
    const actual = crypto.scryptSync(normalizedPassword, salt, expected.length);
    const matches = crypto.timingSafeEqual(actual, expected);
    return validFormat && typeof password === "string" && password.length > 0 && matches;
  } catch {
    return false;
  }
}

function signPayload(payload, secret) {
  return crypto.createHmac("sha256", secret).update(payload).digest();
}

function createSession({ secret, now = Date.now(), ttlMs = DEFAULT_SESSION_TTL_MS } = {}) {
  const normalizedSecret = normalizeSecret(secret);
  if (!Number.isFinite(now)) throw new TypeError("Session time must be finite.");
  if (!Number.isFinite(ttlMs) || ttlMs <= 0 || ttlMs > 24 * 60 * 60 * 1000) {
    throw new TypeError("Session ttl must be between one millisecond and 24 hours.");
  }

  const csrfToken = encode(crypto.randomBytes(24));
  const expiresAt = Math.floor(now + ttlMs);
  const payload = encode(JSON.stringify({
    issuedAt: Math.floor(now),
    expiresAt,
    csrfToken,
    nonce: encode(crypto.randomBytes(16)),
  }));
  const signature = encode(signPayload(payload, normalizedSecret));

  return { token: `${payload}.${signature}`, csrfToken, expiresAt };
}

function verifySession(token, { secret, now = Date.now() } = {}) {
  const normalizedSecret = normalizeSecret(secret);
  if (!Number.isFinite(now) || typeof token !== "string") return { ok: false };

  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false };
  const [payload, encodedSignature] = parts;
  const suppliedSignature = decode(encodedSignature);
  const expectedSignature = signPayload(payload, normalizedSecret);
  if (!suppliedSignature || suppliedSignature.length !== expectedSignature.length) return { ok: false };
  if (!crypto.timingSafeEqual(suppliedSignature, expectedSignature)) return { ok: false };

  try {
    const decodedPayload = decode(payload);
    if (!decodedPayload) return { ok: false };
    const value = JSON.parse(decodedPayload.toString("utf8"));
    if (!Number.isFinite(value.issuedAt) || !Number.isFinite(value.expiresAt)) return { ok: false };
    if (value.issuedAt > now + 60_000 || value.expiresAt <= now || value.expiresAt <= value.issuedAt) return { ok: false };
    if (typeof value.csrfToken !== "string" || !/^[A-Za-z0-9_-]{20,}$/.test(value.csrfToken)) return { ok: false };
    return { ok: true, csrfToken: value.csrfToken, expiresAt: value.expiresAt };
  } catch {
    return { ok: false };
  }
}

function cookieName(secure) {
  return secure ? `__Host-${SESSION_COOKIE_NAME}` : SESSION_COOKIE_NAME;
}

function createSessionCookie(token, { secure = true, maxAgeSeconds = 1800 } = {}) {
  if (typeof token !== "string" || !token) throw new TypeError("A session token is required.");
  if (!Number.isFinite(maxAgeSeconds) || maxAgeSeconds <= 0) throw new TypeError("Cookie max age must be positive.");
  const attributes = [
    `${cookieName(secure)}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${Math.floor(maxAgeSeconds)}`,
  ];
  if (secure) attributes.splice(3, 0, "Secure");
  return attributes.join("; ");
}

function clearSessionCookie({ secure = true } = {}) {
  const attributes = [
    `${cookieName(secure)}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
  ];
  if (secure) attributes.splice(3, 0, "Secure");
  return attributes.join("; ");
}

function parseCookies(header) {
  if (typeof header !== "string" || !header.trim()) return {};
  return header.split(";").reduce((cookies, segment) => {
    const separator = segment.indexOf("=");
    if (separator < 1) return cookies;
    const name = segment.slice(0, separator).trim();
    if (!name) return cookies;
    const rawValue = segment.slice(separator + 1).trim();
    try {
      cookies[name] = decodeURIComponent(rawValue);
    } catch {
      cookies[name] = rawValue;
    }
    return cookies;
  }, {});
}

module.exports = {
  DEFAULT_SESSION_TTL_MS,
  SESSION_COOKIE_NAME,
  clearSessionCookie,
  createSession,
  createSessionCookie,
  hashPassword,
  parseCookies,
  verifyPassword,
  verifySession,
};