"use strict";

const crypto = require("node:crypto");
const path = require("node:path");

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self'",
  "style-src 'self' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: https:",
  "connect-src 'self' https://wa.me https://api.whatsapp.com",
  "manifest-src 'self'",
  "worker-src 'self'",
  "frame-src 'none'",
];

function normalizeAllowedOrigins(allowedOrigins) {
  const entries = Array.isArray(allowedOrigins)
    ? allowedOrigins
    : typeof allowedOrigins === "string"
      ? allowedOrigins.split(",")
      : [];
  return entries.map((entry) => String(entry).trim()).filter(Boolean);
}

function validateOrigin(origin, allowedOrigins) {
  if (typeof origin !== "string" || !origin) return false;
  let parsed;
  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }
  if (parsed.origin !== origin || !["http:", "https:"].includes(parsed.protocol)) return false;
  return normalizeAllowedOrigins(allowedOrigins).some((allowed) => {
    try {
      const parsedAllowed = new URL(allowed);
      return parsedAllowed.origin === allowed && parsedAllowed.origin === parsed.origin;
    } catch {
      return false;
    }
  });
}

function createRateLimiter({ limit, windowMs, now = Date.now, maxKeys = 10_000 } = {}) {
  if (!Number.isInteger(limit) || limit < 1) throw new TypeError("Rate limit must be a positive integer.");
  if (!Number.isFinite(windowMs) || windowMs < 1) throw new TypeError("Rate-limit window must be positive.");
  if (typeof now !== "function") throw new TypeError("Rate-limit clock must be a function.");
  const buckets = new Map();
  let checks = 0;

  const cleanup = (currentTime) => {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= currentTime) buckets.delete(key);
    }
    if (buckets.size <= maxKeys) return;
    const overflow = buckets.size - maxKeys;
    let removed = 0;
    for (const key of buckets.keys()) {
      buckets.delete(key);
      removed += 1;
      if (removed >= overflow) break;
    }
  };

  return {
    check(key) {
      const currentTime = Number(now());
      if (!Number.isFinite(currentTime)) throw new TypeError("Rate-limit clock returned an invalid time.");
      const normalizedKey = typeof key === "string" && key ? key : "anonymous";
      checks += 1;
      if (checks % 100 === 0 || buckets.size > maxKeys) cleanup(currentTime);

      let bucket = buckets.get(normalizedKey);
      if (!bucket || bucket.resetAt <= currentTime) {
        bucket = { count: 0, resetAt: currentTime + windowMs };
        buckets.set(normalizedKey, bucket);
      }

      if (bucket.count >= limit) {
        return {
          allowed: false,
          remaining: 0,
          retryAfterMs: Math.max(1, bucket.resetAt - currentTime),
          resetAt: bucket.resetAt,
        };
      }

      bucket.count += 1;
      return {
        allowed: true,
        remaining: Math.max(0, limit - bucket.count),
        retryAfterMs: 0,
        resetAt: bucket.resetAt,
      };
    },
    clear() {
      buckets.clear();
    },
  };
}

function getSecurityHeaders({ admin = false, production = true } = {}) {
  const directives = production ? [...CSP_DIRECTIVES, "upgrade-insecure-requests"] : CSP_DIRECTIVES;
  const headers = {
    "Content-Security-Policy": directives.join("; "),
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Origin-Agent-Cluster": "?1",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-Permitted-Cross-Domain-Policies": "none",
  };

  if (production) headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
  if (admin) {
    headers["Cache-Control"] = "no-store, max-age=0";
    headers.Pragma = "no-cache";
    headers["X-Robots-Tag"] = "noindex, nofollow, noarchive";
  }
  return headers;
}

function decodePathname(pathname) {
  if (typeof pathname !== "string" || !pathname || pathname.includes("\\")) return null;
  let decoded = pathname;
  try {
    for (let index = 0; index < 3; index += 1) {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    }
  } catch {
    return null;
  }
  if (decoded.includes("\0") || decoded.includes("\\")) return null;
  if (/%(?:00|2e|2f|5c)/i.test(decoded)) return null;
  if (decoded.includes("?") || decoded.includes("#")) return null;
  return decoded;
}

function resolvePublicPath(root, pathname) {
  const decoded = decodePathname(pathname);
  if (decoded === null) return null;
  const resolvedRoot = path.resolve(root);
  const relativeInput = decoded.replace(/^\/+/, "");
  const candidate = path.resolve(resolvedRoot, relativeInput || ".");
  const relative = path.relative(resolvedRoot, candidate);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return null;
  return candidate;
}

function fingerprintClient(value, secret = "bizyako-rate-limit") {
  const normalized = typeof value === "string" && value.trim() ? value.trim().slice(0, 256) : "unknown";
  return crypto.createHmac("sha256", String(secret)).update(normalized).digest("hex").slice(0, 24);
}

function getClientAddress(request) {
  const forwarded = request?.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded) return forwarded.split(",")[0].trim();
  return request?.socket?.remoteAddress || "unknown";
}

function logSecurityEvent(event, details = {}) {
  const safeDetails = Object.fromEntries(Object.entries(details).filter(([key]) => !/password|secret|token|cookie|csrf/i.test(key)));
  process.stderr.write(`${JSON.stringify({ level: "security", event, at: new Date().toISOString(), ...safeDetails })}\n`);
}

module.exports = {
  createRateLimiter,
  fingerprintClient,
  getClientAddress,
  getSecurityHeaders,
  logSecurityEvent,
  resolvePublicPath,
  validateOrigin,
};