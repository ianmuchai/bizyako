module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ ok: true, service: "BizYako backend", timestamp: new Date().toISOString() });
};
