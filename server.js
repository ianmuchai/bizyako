"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const {
  DEFAULT_SESSION_TTL_MS,
  SESSION_COOKIE_NAME,
  clearSessionCookie,
  createRateLimiter,
  createSession,
  createSessionCookie,
  fingerprintClient,
  getClientAddress,
  getSecurityHeaders,
  logSecurityEvent,
  parseCookies,
  resolvePublicPath,
  validateCarouselPayload,
  validateContactPayload,
  validateOrigin,
  verifyPassword,
  verifySession,
} = require("./lib/security");
const { getSitePayload, normalizeLead, getCarouselSlides, posterSpecs, saveCarouselSlides } = require("./data/siteData");
const { AdvisorError, requestAdvisorReply, validateChatPayload } = require("./lib/advisor");

const PORT = Number(process.env.PORT) || 5173;
const PUBLIC_ROOT = __dirname;
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const CONTACT_BODY_LIMIT = 32 * 1024;
const CHAT_BODY_LIMIT = 16 * 1024;
const CAROUSEL_BODY_LIMIT = 8 * 1024 * 1024;
const AUTH_BODY_LIMIT = 4 * 1024;
const PUBLIC_FILES = new Set([
  "/index.html",
  "/product-demo.html",
  "/by-admin.html",
  "/styles.css",
  "/script.js",
  "/chat-history.js",
  "/product-demo.js",
  "/admin.js",
  "/manifest.webmanifest",
  "/service-worker.js",
  "/data/site-static.json",
  "/.well-known/security.txt",
]);
const ROUTE_FILES = new Map([
  ["/", "/index.html"],
  ["/product-demo", "/product-demo.html"],
  ["/product-demo/", "/product-demo.html"],
  ["/by-admin", "/by-admin.html"],
  ["/by-admin/", "/by-admin.html"],
]);
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

const configuredOrigins = String(process.env.BIZYAKO_ALLOWED_ORIGINS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const developmentOrigins = [`http://localhost:${PORT}`, `http://127.0.0.1:${PORT}`];
const allowedOrigins = configuredOrigins.length ? configuredOrigins : IS_PRODUCTION ? [] : developmentOrigins;
const adminPasswordHash = process.env.BIZYAKO_ADMIN_PASSWORD_HASH || "";
const sessionSecret = process.env.BIZYAKO_SESSION_SECRET || "";
const secureCookies = IS_PRODUCTION && process.env.BIZYAKO_FORCE_SECURE_COOKIE !== "false";
const authConfigured = /^scrypt\$v1\$[A-Za-z0-9_-]+\$[A-Za-z0-9_-]+$/.test(adminPasswordHash)
  && Buffer.byteLength(sessionSecret, "utf8") >= 32
  && allowedOrigins.length > 0;
const loginLimiter = createRateLimiter({ limit: 5, windowMs: 15 * 60 * 1000 });
const contactLimiter = createRateLimiter({ limit: 6, windowMs: 10 * 60 * 1000 });
const chatLimiter = createRateLimiter({ limit: 12, windowMs: 10 * 60 * 1000 });
const chatInFlight = new Set();

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function mergeHeaders(res, headers) {
  for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
}

function applySecurityHeaders(res, { admin = false } = {}) {
  mergeHeaders(res, getSecurityHeaders({ admin, production: IS_PRODUCTION }));
}

function sendJson(res, status, payload, { admin = false, headers = {} } = {}) {
  if (res.writableEnded) return;
  applySecurityHeaders(res, { admin });
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  mergeHeaders(res, headers);
  res.writeHead(status);
  res.end(JSON.stringify(payload));
}

function sendText(res, status, message, { admin = false, headers = {} } = {}) {
  if (res.writableEnded) return;
  applySecurityHeaders(res, { admin });
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  mergeHeaders(res, headers);
  res.writeHead(status);
  res.end(message);
}

function isJsonRequest(req) {
  const contentType = String(req.headers["content-type"] || "").split(";", 1)[0].trim().toLowerCase();
  return contentType === "application/json";
}

function collectBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let bytes = 0;
    let tooLarge = false;

    req.on("data", (chunk) => {
      bytes += chunk.length;
      if (bytes > maxBytes) {
        tooLarge = true;
        chunks.length = 0;
        return;
      }
      if (!tooLarge) chunks.push(chunk);
    });
    req.on("end", () => {
      if (tooLarge) reject(new HttpError(413, "Request body too large."));
      else resolve(Buffer.concat(chunks).toString("utf8"));
    });
    req.on("aborted", () => reject(new HttpError(400, "Request was interrupted.")));
    req.on("error", () => reject(new HttpError(400, "Unable to read request.")));
  });
}

async function parseJsonBody(req, maxBytes) {
  if (!isJsonRequest(req)) throw new HttpError(415, "Content-Type must be application/json.");
  const body = await collectBody(req, maxBytes);
  if (!body) throw new HttpError(400, "A JSON request body is required.");
  try {
    return JSON.parse(body);
  } catch {
    throw new HttpError(400, "Invalid JSON request body.");
  }
}

function requestFingerprint(req) {
  return fingerprintClient(getClientAddress(req), sessionSecret || "bizyako-unconfigured-rate-key");
}

function originAllowed(req) {
  return validateOrigin(req.headers.origin, allowedOrigins);
}

function safeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return leftBytes.length === rightBytes.length && crypto.timingSafeEqual(leftBytes, rightBytes);
}

function readSession(req) {
  if (!authConfigured) return { ok: false };
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[secureCookies ? `__Host-${SESSION_COOKIE_NAME}` : SESSION_COOKIE_NAME]
    || cookies[`__Host-${SESSION_COOKIE_NAME}`]
    || cookies[SESSION_COOKIE_NAME];
  if (!token) return { ok: false };
  try {
    return verifySession(token, { secret: sessionSecret });
  } catch {
    return { ok: false };
  }
}

function requireOrigin(req, res, { admin = false } = {}) {
  if (originAllowed(req)) return true;
  logSecurityEvent("origin_rejected", { route: req.url, client: requestFingerprint(req) });
  sendJson(res, 403, { ok: false, message: "Request not allowed." }, { admin });
  return false;
}

function requireAdmin(req, res, { csrf = false } = {}) {
  const session = readSession(req);
  if (!session.ok) {
    sendJson(res, 401, { ok: false, message: "Authentication required." }, { admin: true });
    return null;
  }
  if (csrf && !safeEqual(req.headers["x-csrf-token"], session.csrfToken)) {
    logSecurityEvent("csrf_rejected", { route: req.url, client: requestFingerprint(req) });
    sendJson(res, 403, { ok: false, message: "Request not allowed." }, { admin: true });
    return null;
  }
  return session;
}

function rateLimitResponse(res, result, { admin = false } = {}) {
  const seconds = Math.max(1, Math.ceil(result.retryAfterMs / 1000));
  sendJson(res, 429, { ok: false, message: "Too many requests. Please try again later." }, {
    admin,
    headers: { "Retry-After": String(seconds) },
  });
}

async function handleAdminAuth(req, res) {
  if (req.method === "GET") {
    const session = readSession(req);
    sendJson(res, 200, session.ok
      ? { ok: true, authenticated: true, csrfToken: session.csrfToken, expiresAt: session.expiresAt }
      : { ok: true, authenticated: false }, { admin: true });
    return;
  }

  if (req.method === "POST") {
    if (!authConfigured) {
      logSecurityEvent("admin_auth_unconfigured", { client: requestFingerprint(req) });
      sendJson(res, 503, { ok: false, message: "Administration is temporarily unavailable." }, { admin: true });
      return;
    }
    if (!requireOrigin(req, res, { admin: true })) return;
    const rate = loginLimiter.check(requestFingerprint(req));
    if (!rate.allowed) {
      logSecurityEvent("login_rate_limited", { client: requestFingerprint(req) });
      rateLimitResponse(res, rate, { admin: true });
      return;
    }

    const payload = await parseJsonBody(req, AUTH_BODY_LIMIT);
    const fields = payload && typeof payload === "object" && !Array.isArray(payload) ? Object.keys(payload) : [];
    if (fields.length !== 1 || fields[0] !== "password" || !verifyPassword(payload.password, adminPasswordHash)) {
      logSecurityEvent("login_failed", { client: requestFingerprint(req) });
      sendJson(res, 401, { ok: false, message: "Unable to sign in." }, { admin: true });
      return;
    }

    const session = createSession({ secret: sessionSecret });
    logSecurityEvent("login_succeeded", { client: requestFingerprint(req) });
    sendJson(res, 200, {
      ok: true,
      authenticated: true,
      csrfToken: session.csrfToken,
      expiresAt: session.expiresAt,
    }, {
      admin: true,
      headers: {
        "Set-Cookie": createSessionCookie(session.token, {
          secure: secureCookies,
          maxAgeSeconds: Math.floor(DEFAULT_SESSION_TTL_MS / 1000),
        }),
      },
    });
    return;
  }

  if (req.method === "DELETE") {
    if (!requireOrigin(req, res, { admin: true })) return;
    if (!requireAdmin(req, res, { csrf: true })) return;
    logSecurityEvent("logout", { client: requestFingerprint(req) });
    sendJson(res, 200, { ok: true, authenticated: false }, {
      admin: true,
      headers: { "Set-Cookie": clearSessionCookie({ secure: secureCookies }) },
    });
    return;
  }

  sendJson(res, 405, { ok: false, message: "Method not allowed." }, { admin: true, headers: { Allow: "GET, POST, DELETE" } });
}

async function handleCarousel(req, res) {
  if (req.method === "GET") {
    sendJson(res, 200, { slides: getCarouselSlides(), posterSpecs });
    return;
  }
  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, message: "Method not allowed." }, { headers: { Allow: "GET, POST" } });
    return;
  }

  if (!requireAdmin(req, res)) return;
  if (!requireOrigin(req, res, { admin: true })) return;
  if (!requireAdmin(req, res, { csrf: true })) return;
  const payload = await parseJsonBody(req, CAROUSEL_BODY_LIMIT);
  const validation = validateCarouselPayload(payload);
  if (!validation.ok) {
    sendJson(res, 400, { ok: false, message: validation.message }, { admin: true });
    return;
  }

  const slides = saveCarouselSlides(validation.slides);
  logSecurityEvent("carousel_saved", { client: requestFingerprint(req), slides: slides.length });
  sendJson(res, 200, {
    ok: true,
    message: "Carousel posters saved securely. Push the data update to publish it on other hosts.",
    slides,
    posterSpecs,
  }, { admin: true });
}

async function handleContact(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, message: "Method not allowed." }, { headers: { Allow: "POST" } });
    return;
  }
  if (!requireOrigin(req, res)) return;

  const client = requestFingerprint(req);
  const rate = contactLimiter.check(client);
  if (!rate.allowed) {
    logSecurityEvent("contact_rate_limited", { client });
    rateLimitResponse(res, rate);
    return;
  }

  const payload = await parseJsonBody(req, CONTACT_BODY_LIMIT);
  const validation = validateContactPayload(payload);
  if (!validation.ok) {
    sendJson(res, 400, { ok: false, message: validation.message });
    return;
  }
  const result = normalizeLead(validation.value);
  logSecurityEvent("contact_accepted", { client, lead: result.lead?.id });
  sendJson(res, 201, result);
}

function advisorDurationBucket(startedAt) {
  const elapsed = Date.now() - startedAt;
  if (elapsed < 1_000) return "under_1s";
  if (elapsed < 5_000) return "1_to_5s";
  if (elapsed < 10_000) return "5_to_10s";
  return "over_10s";
}

async function handleChat(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, message: "Method not allowed." }, { headers: { Allow: "POST" } });
    return;
  }
  if (!requireOrigin(req, res)) return;

  const client = requestFingerprint(req);
  const rate = chatLimiter.check(client);
  if (!rate.allowed) {
    logSecurityEvent("advisor_rate_limited", { client });
    rateLimitResponse(res, rate);
    return;
  }
  if (chatInFlight.has(client)) {
    logSecurityEvent("advisor_concurrent_request_rejected", { client });
    sendJson(res, 429, { ok: false, message: "Please wait for the current reply." }, {
      headers: { "Retry-After": "1" },
    });
    return;
  }

  const payload = await parseJsonBody(req, CHAT_BODY_LIMIT);
  const validation = validateChatPayload(payload);
  if (!validation.ok) {
    sendJson(res, 400, { ok: false, message: validation.message });
    return;
  }

  const startedAt = Date.now();
  chatInFlight.add(client);
  try {
    const result = await requestAdvisorReply(validation.messages);
    logSecurityEvent("advisor_reply_completed", {
      client,
      model: result.model,
      fallback: result.fallback,
      duration: advisorDurationBucket(startedAt),
    });
    sendJson(res, 200, { ok: true, ...result });
  } catch (error) {
    const providerLimited = error instanceof AdvisorError && error.status === 429;
    logSecurityEvent(providerLimited ? "advisor_provider_rate_limited" : "advisor_reply_failed", {
      client,
      duration: advisorDurationBucket(startedAt),
    });
    if (providerLimited) {
      sendJson(res, 429, { ok: false, message: "The advisor is busy. Please try again shortly." }, {
        headers: { "Retry-After": "30" },
      });
      return;
    }
    sendJson(res, 503, {
      ok: false,
      message: "The BizYako advisor is temporarily unavailable. Please try again shortly.",
    });
  } finally {
    chatInFlight.delete(client);
  }
}

function isPublicFile(pathname) {
  return PUBLIC_FILES.has(pathname) || pathname.startsWith("/assets/");
}

function serveFile(req, res, pathname) {
  if (!["GET", "HEAD"].includes(req.method)) {
    sendText(res, 405, "Method not allowed.", { headers: { Allow: "GET, HEAD" } });
    return;
  }
  const cleanPath = ROUTE_FILES.get(pathname) || pathname;
  if (!isPublicFile(cleanPath)) {
    sendText(res, 404, "Not found.", { admin: pathname.startsWith("/by-admin") });
    return;
  }
  const filePath = resolvePublicPath(PUBLIC_ROOT, cleanPath);
  if (!filePath) {
    sendText(res, 404, "Not found.");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendText(res, 404, "Not found.", { admin: cleanPath === "/by-admin.html" });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const admin = cleanPath === "/by-admin.html" || cleanPath === "/admin.js";
    applySecurityHeaders(res, { admin });
    res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
    res.setHeader("Cache-Control", admin || ext === ".html" || ext === ".json"
      ? "no-store, max-age=0"
      : "public, max-age=3600");
    res.writeHead(200);
    res.end(req.method === "HEAD" ? undefined : content);
  });
}

async function handleRequest(req, res) {
  let url;
  try {
    url = new URL(req.url, "http://localhost");
  } catch {
    sendJson(res, 400, { ok: false, message: "Invalid request." });
    return;
  }

  if (url.pathname === "/api/health") {
    if (!["GET", "HEAD"].includes(req.method)) {
      sendJson(res, 405, { ok: false, message: "Method not allowed." }, { headers: { Allow: "GET, HEAD" } });
      return;
    }
    sendJson(res, 200, { ok: true, service: "BizYako backend", timestamp: new Date().toISOString() });
    return;
  }
  if (url.pathname === "/api/site") {
    if (req.method !== "GET") {
      sendJson(res, 405, { ok: false, message: "Method not allowed." }, { headers: { Allow: "GET" } });
      return;
    }
    sendJson(res, 200, { brand: "bizYako", tagline: "Your Business, Powered by AI.", ...getSitePayload() });
    return;
  }
  if (url.pathname === "/api/admin-auth") return handleAdminAuth(req, res);
  if (url.pathname === "/api/carousel") return handleCarousel(req, res);
  if (url.pathname === "/api/contact") return handleContact(req, res);
  if (url.pathname === "/api/chat") return handleChat(req, res);
  if (url.pathname.startsWith("/api/")) {
    sendJson(res, 404, { ok: false, message: "API route not found." });
    return;
  }
  serveFile(req, res, url.pathname);
}

function createBizYakoServer() {
  const server = http.createServer((req, res) => {
    Promise.resolve(handleRequest(req, res)).catch((error) => {
      const status = error instanceof HttpError ? error.status : 500;
      if (status >= 500) logSecurityEvent("server_error", { route: req.url, client: requestFingerprint(req) });
      sendJson(res, status, {
        ok: false,
        message: status === 413
          ? "Request body is too large."
          : status === 415
            ? "Content-Type must be application/json."
            : status >= 500
              ? "The request could not be completed."
              : "Invalid request payload.",
      }, { admin: req.url?.startsWith("/api/admin-auth") || req.url?.startsWith("/api/carousel") });
    });
  });
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 5_000;
  return server;
}

if (require.main === module) {
  const server = createBizYakoServer();
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`BizYako frontend and backend running at http://localhost:${PORT}`);
  });
}

module.exports = { createBizYakoServer };