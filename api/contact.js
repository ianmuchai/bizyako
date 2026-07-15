const { normalizeLead } = require("../data/siteData");

function collectBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ ok: false, message: "Method not allowed." });
    return;
  }

  try {
    const payload = req.body && typeof req.body === "object" ? req.body : JSON.parse((await collectBody(req)) || "{}");
    const result = normalizeLead(payload);
    res.status(result.ok ? 201 : 400).json(result);
  } catch (error) {
    res.status(400).json({ ok: false, message: "Invalid request payload." });
  }
};
