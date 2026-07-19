const { getCarouselSlides, posterSpecs, saveCarouselSlides } = require("../data/siteData");

function collectBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) {
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

  if (req.method === "GET") {
    res.status(200).json({ slides: getCarouselSlides(), posterSpecs });
    return;
  }

  if (req.method === "POST") {
    res.status(403).json({ ok: false, message: "Carousel changes must be saved from the local BizYako admin, then pushed to GitHub/Vercel." });
    return;
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).json({ ok: false, message: "Method not allowed." });
};
