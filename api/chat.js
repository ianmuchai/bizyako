"use strict";

const { createRateLimiter, logSecurityEvent } = require("../lib/security");
const { AdvisorError, requestAdvisorReply, validateChatPayload } = require("../lib/advisor");
const {
  applyVercelSecurityHeaders,
  getVercelClientKey,
  getVercelSecurityConfig,
  isVercelOriginAllowed,
  readVercelJson,
  sendVercelError,
} = require("../lib/security/vercel");

const chatLimiter = createRateLimiter({ limit: 12, windowMs: 10 * 60 * 1000 });
const chatInFlight = new Set();

function durationBucket(startedAt) {
  const elapsed = Date.now() - startedAt;
  if (elapsed < 1_000) return "under_1s";
  if (elapsed < 5_000) return "1_to_5s";
  if (elapsed < 10_000) return "5_to_10s";
  return "over_10s";
}

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
    logSecurityEvent("vercel_advisor_origin_rejected", { client });
    res.status(403).json({ ok: false, message: "Request not allowed." });
    return;
  }

  const rate = chatLimiter.check(client);
  if (!rate.allowed) {
    logSecurityEvent("vercel_advisor_rate_limited", { client });
    res.setHeader("Retry-After", String(Math.max(1, Math.ceil(rate.retryAfterMs / 1000))));
    res.status(429).json({ ok: false, message: "Too many requests. Please try again later." });
    return;
  }
  if (chatInFlight.has(client)) {
    logSecurityEvent("vercel_advisor_concurrent_request_rejected", { client });
    res.setHeader("Retry-After", "1");
    res.status(429).json({ ok: false, message: "Please wait for the current reply." });
    return;
  }

  let inFlight = false;
  try {
    const payload = await readVercelJson(req, 16 * 1024);
    const validation = validateChatPayload(payload);
    if (!validation.ok) {
      res.status(400).json({ ok: false, message: validation.message });
      return;
    }

    const startedAt = Date.now();
    chatInFlight.add(client);
    inFlight = true;
    try {
      const result = await requestAdvisorReply(validation.messages);
      logSecurityEvent("vercel_advisor_reply_completed", {
        client,
        model: result.model,
        fallback: result.fallback,
        duration: durationBucket(startedAt),
      });
      res.status(200).json({ ok: true, ...result });
    } catch (error) {
      const providerLimited = error instanceof AdvisorError && error.status === 429;
      logSecurityEvent(providerLimited ? "vercel_advisor_provider_rate_limited" : "vercel_advisor_reply_failed", {
        client,
        duration: durationBucket(startedAt),
      });
      if (providerLimited) {
        res.setHeader("Retry-After", "30");
        res.status(429).json({ ok: false, message: "The advisor is busy. Please try again shortly." });
        return;
      }
      res.status(503).json({
        ok: false,
        message: "The BizYako advisor is temporarily unavailable. Please try again shortly.",
      });
    }
  } catch (error) {
    sendVercelError(res, error);
  } finally {
    if (inFlight) chatInFlight.delete(client);
  }
};
