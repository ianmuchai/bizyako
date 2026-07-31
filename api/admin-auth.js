"use strict";

const {
  DEFAULT_SESSION_TTL_MS,
  clearSessionCookie,
  createRateLimiter,
  createSession,
  createSessionCookie,
  logSecurityEvent,
  verifyPassword,
} = require("../lib/security");
const {
  applyVercelSecurityHeaders,
  getVercelClientKey,
  getVercelSecurityConfig,
  getVercelSession,
  isVercelOriginAllowed,
  readVercelJson,
  sendVercelError,
  verifyCsrf,
} = require("../lib/security/vercel");

const loginLimiter = createRateLimiter({ limit: 5, windowMs: 15 * 60 * 1000 });

module.exports = async (req, res) => {
  applyVercelSecurityHeaders(res, { admin: true });
  const config = getVercelSecurityConfig();
  const client = getVercelClientKey(req, config);

  try {
    if (req.method === "GET") {
      const session = getVercelSession(req, config);
      res.status(200).json(session.ok
        ? { ok: true, authenticated: true, csrfToken: session.csrfToken, expiresAt: session.expiresAt }
        : { ok: true, authenticated: false });
      return;
    }

    if (req.method === "POST") {
      if (!config.configured) {
        logSecurityEvent("vercel_admin_auth_unconfigured", { client });
        res.status(503).json({ ok: false, message: "Administration is temporarily unavailable." });
        return;
      }
      if (!isVercelOriginAllowed(req, config)) {
        logSecurityEvent("vercel_login_origin_rejected", { client });
        res.status(403).json({ ok: false, message: "Request not allowed." });
        return;
      }
      const rate = loginLimiter.check(client);
      if (!rate.allowed) {
        res.setHeader("Retry-After", String(Math.max(1, Math.ceil(rate.retryAfterMs / 1000))));
        res.status(429).json({ ok: false, message: "Too many requests. Please try again later." });
        return;
      }

      const payload = await readVercelJson(req, 4 * 1024);
      const fields = payload && typeof payload === "object" && !Array.isArray(payload) ? Object.keys(payload) : [];
      if (fields.length !== 1 || fields[0] !== "password" || !verifyPassword(payload.password, config.passwordHash)) {
        logSecurityEvent("vercel_login_failed", { client });
        res.status(401).json({ ok: false, message: "Unable to sign in." });
        return;
      }

      const session = createSession({ secret: config.sessionSecret });
      logSecurityEvent("vercel_login_succeeded", { client });
      res.setHeader("Set-Cookie", createSessionCookie(session.token, {
        secure: true,
        maxAgeSeconds: Math.floor(DEFAULT_SESSION_TTL_MS / 1000),
      }));
      res.status(200).json({
        ok: true,
        authenticated: true,
        csrfToken: session.csrfToken,
        expiresAt: session.expiresAt,
      });
      return;
    }

    if (req.method === "DELETE") {
      const session = getVercelSession(req, config);
      if (!session.ok) {
        res.status(401).json({ ok: false, message: "Authentication required." });
        return;
      }
      if (!isVercelOriginAllowed(req, config) || !verifyCsrf(req, session)) {
        logSecurityEvent("vercel_logout_rejected", { client });
        res.status(403).json({ ok: false, message: "Request not allowed." });
        return;
      }
      res.setHeader("Set-Cookie", clearSessionCookie({ secure: true }));
      res.status(200).json({ ok: true, authenticated: false });
      return;
    }

    res.setHeader("Allow", "GET, POST, DELETE");
    res.status(405).json({ ok: false, message: "Method not allowed." });
  } catch (error) {
    sendVercelError(res, error, { admin: true });
  }
};