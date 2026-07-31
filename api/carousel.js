"use strict";

const { logSecurityEvent, validateCarouselPayload } = require("../lib/security");
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
const { getCarouselSlides, posterSpecs } = require("../data/siteData");

module.exports = async (req, res) => {
  const isWrite = req.method === "POST";
  applyVercelSecurityHeaders(res, { admin: isWrite });

  if (req.method === "GET") {
    res.status(200).json({ slides: getCarouselSlides(), posterSpecs });
    return;
  }
  if (!isWrite) {
    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ ok: false, message: "Method not allowed." });
    return;
  }

  const config = getVercelSecurityConfig();
  const client = getVercelClientKey(req, config);
  const session = getVercelSession(req, config);
  if (!session.ok) {
    res.status(401).json({ ok: false, message: "Authentication required." });
    return;
  }
  if (!isVercelOriginAllowed(req, config) || !verifyCsrf(req, session)) {
    logSecurityEvent("vercel_carousel_write_rejected", { client });
    res.status(403).json({ ok: false, message: "Request not allowed." });
    return;
  }

  try {
    const payload = await readVercelJson(req, 8 * 1024 * 1024);
    const validation = validateCarouselPayload(payload);
    if (!validation.ok) {
      res.status(400).json({ ok: false, message: validation.message });
      return;
    }
    logSecurityEvent("vercel_carousel_read_only", { client, slides: validation.slides.length });
    res.status(403).json({
      ok: false,
      readOnly: true,
      message: "Carousel changes must be saved from the local BizYako admin, then pushed to GitHub and Vercel.",
    });
  } catch (error) {
    sendVercelError(res, error, { admin: true });
  }
};