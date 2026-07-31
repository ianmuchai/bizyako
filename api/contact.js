"use strict";

const { createRateLimiter, logSecurityEvent, validateContactPayload } = require("../lib/security");
const {
  applyVercelSecurityHeaders,
  getVercelClientKey,
  getVercelSecurityConfig,
  isVercelOriginAllowed,
  readVercelJson,
  sendVercelError,
} = require("../lib/security/vercel");
const { normalizeLead } = require("../data/siteData");

const contactLimiter = createRateLimiter({ limit: 6, windowMs: 10 * 60 * 1000 });

module.exports = async (req, res) => {
  applyVercelSecurityHeaders(res);
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ ok: false, message: "Method not allowed." });
    return;
  }

  const config = getVercelSecurityConfig();
  const client = getVercelClientKey(req, config);
  if (!isVercelOriginAllowed(req, config)) {
    logSecurityEvent("vercel_contact_origin_rejected", { client });
    res.status(403).json({ ok: false, message: "Request not allowed." });
    return;
  }

  const rate = contactLimiter.check(client);
  if (!rate.allowed) {
    logSecurityEvent("vercel_contact_rate_limited", { client });
    res.setHeader("Retry-After", String(Math.max(1, Math.ceil(rate.retryAfterMs / 1000))));
    res.status(429).json({ ok: false, message: "Too many requests. Please try again later." });
    return;
  }

  try {
    const payload = await readVercelJson(req, 32 * 1024);
    const validation = validateContactPayload(payload);
    if (!validation.ok) {
      res.status(400).json({ ok: false, message: validation.message });
      return;
    }
    const result = normalizeLead(validation.value);
    logSecurityEvent("vercel_contact_accepted", { client, lead: result.lead?.id });
    res.status(201).json(result);
  } catch (error) {
    sendVercelError(res, error);
  }
};