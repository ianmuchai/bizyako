"use strict";

const { applyVercelSecurityHeaders } = require("../lib/security/vercel");

module.exports = (req, res) => {
  applyVercelSecurityHeaders(res);
  if (!["GET", "HEAD"].includes(req.method)) {
    res.setHeader("Allow", "GET, HEAD");
    res.status(405).json({ ok: false, message: "Method not allowed." });
    return;
  }
  res.status(200).json({ ok: true, service: "BizYako backend", timestamp: new Date().toISOString() });
};