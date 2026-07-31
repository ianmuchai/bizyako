"use strict";

const crypto = require("node:crypto");
const {
  SESSION_COOKIE_NAME,
  fingerprintClient,
  getClientAddress,
  getSecurityHeaders,
  parseCookies,
  validateOrigin,
  verifySession,
} = require("./index");

class VercelRequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function getVercelSecurityConfig() {
  const passwordHash = process.env.BIZYAKO_ADMIN_PASSWORD_HASH || "";
  const sessionSecret = process.env.BIZYAKO_SESSION_SECRET || "";
  const allowedOrigins = String(process.env.BIZYAKO_ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return {
    passwordHash,
    sessionSecret,
    allowedOrigins,
    configured: /^scrypt\$v1\$[A-Za-z0-9_-]+\$[A-Za-z0-9_-]+$/.test(passwordHash)
      && Buffer.byteLength(sessionSecret, "utf8") >= 32
      && allowedOrigins.length > 0,
  };
}

function applyVercelSecurityHeaders(res, { admin = false } = {}) {
  const headers = getSecurityHeaders({ admin, production: true });
  for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
  res.setHeader("Cache-Control", "no-store, max-age=0");
}

function isJsonRequest(req) {
  return String(req.headers?.["content-type"] || "").split(";", 1)[0].trim().toLowerCase() === "application/json";
}

function collectBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    if (!req || typeof req.on !== "function") {
      reject(new VercelRequestError(400, "A JSON request body is required."));
      return;
    }
    const chunks = [];
    let bytes = 0;
    let tooLarge = false;
    req.on("data", (chunk) => {
      bytes += chunk.length;
      if (bytes > maxBytes) {
        tooLarge = true;
        chunks.length = 0;
      } else if (!tooLarge) {
        chunks.push(chunk);
      }
    });
    req.on("end", () => {
      if (tooLarge) reject(new VercelRequestError(413, "Request body is too large."));
      else resolve(Buffer.concat(chunks).toString("utf8"));
    });
    req.on("error", () => reject(new VercelRequestError(400, "Unable to read request.")));
  });
}

async function readVercelJson(req, maxBytes) {
  if (!isJsonRequest(req)) throw new VercelRequestError(415, "Content-Type must be application/json.");
  let value = req.body;
  if (value === undefined || value === null || value === "") value = await collectBody(req, maxBytes);

  let byteLength;
  if (typeof value === "string" || Buffer.isBuffer(value)) {
    byteLength = Buffer.byteLength(value);
    if (byteLength > maxBytes) throw new VercelRequestError(413, "Request body is too large.");
    try {
      value = JSON.parse(String(value));
    } catch {
      throw new VercelRequestError(400, "Invalid JSON request body.");
    }
  } else {
    try {
      byteLength = Buffer.byteLength(JSON.stringify(value), "utf8");
    } catch {
      throw new VercelRequestError(400, "Invalid JSON request body.");
    }
    if (byteLength > maxBytes) throw new VercelRequestError(413, "Request body is too large.");
  }
  return value;
}

function getVercelSession(req, config = getVercelSecurityConfig()) {
  if (!config.configured) return { ok: false };
  const cookies = parseCookies(req.headers?.cookie);
  const token = cookies[`__Host-${SESSION_COOKIE_NAME}`] || cookies[SESSION_COOKIE_NAME];
  if (!token) return { ok: false };
  try {
    return verifySession(token, { secret: config.sessionSecret });
  } catch {
    return { ok: false };
  }
}

function isVercelOriginAllowed(req, config = getVercelSecurityConfig()) {
  return validateOrigin(req.headers?.origin, config.allowedOrigins);
}

function verifyCsrf(req, session) {
  const supplied = req.headers?.["x-csrf-token"];
  if (typeof supplied !== "string" || typeof session?.csrfToken !== "string") return false;
  const suppliedBytes = Buffer.from(supplied);
  const expectedBytes = Buffer.from(session.csrfToken);
  return suppliedBytes.length === expectedBytes.length && crypto.timingSafeEqual(suppliedBytes, expectedBytes);
}

function getVercelClientKey(req, config = getVercelSecurityConfig()) {
  return fingerprintClient(getClientAddress(req), config.sessionSecret || "bizyako-vercel-rate-key");
}

function sendVercelError(res, error, { admin = false } = {}) {
  applyVercelSecurityHeaders(res, { admin });
  const status = error instanceof VercelRequestError ? error.status : 500;
  const message = status === 413
    ? "Request body is too large."
    : status === 415
      ? "Content-Type must be application/json."
      : status >= 500
        ? "The request could not be completed."
        : "Invalid request payload.";
  res.status(status).json({ ok: false, message });
}

module.exports = {
  VercelRequestError,
  applyVercelSecurityHeaders,
  getVercelClientKey,
  getVercelSecurityConfig,
  getVercelSession,
  isVercelOriginAllowed,
  readVercelJson,
  sendVercelError,
  verifyCsrf,
};