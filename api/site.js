"use strict";

const { applyVercelSecurityHeaders } = require("../lib/security/vercel");
const { getSitePayload } = require("../data/siteData");

module.exports = (req, res) => {
  applyVercelSecurityHeaders(res);
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ ok: false, message: "Method not allowed." });
    return;
  }
  res.status(200).json(getSitePayload());
};