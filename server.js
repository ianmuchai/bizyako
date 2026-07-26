const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 5173;
const PUBLIC_ROOT = __dirname;

const { getSitePayload, normalizeLead, getCarouselSlides, posterSpecs, saveCarouselSlides } = require("./data/siteData");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml; charset=utf-8",
  ".ico": "image/x-icon",
};

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function collectBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 8_000_000) {
        req.destroy();
        reject(new Error("Request body too large"));
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function serveFile(res, pathname) {
  const cleanPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(PUBLIC_ROOT, cleanPath));

  if (!filePath.startsWith(PUBLIC_ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-store" : "public, max-age=3600",
    });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/api/health") {
    sendJson(res, 200, { ok: true, service: "BizYako backend", timestamp: new Date().toISOString() });
    return;
  }

  if (url.pathname === "/api/site") {
    sendJson(res, 200, {
      brand: "bizYako",
      tagline: "Your Business, Powered by AI.",
      ...getSitePayload(),
    });
    return;
  }


  if (url.pathname === "/api/carousel") {
    if (req.method === "GET") {
      sendJson(res, 200, { slides: getCarouselSlides(), posterSpecs });
      return;
    }

    if (req.method === "POST") {
      try {
        const body = await collectBody(req);
        const payload = JSON.parse(body || "{}");
        const slides = saveCarouselSlides(payload.slides || []);
        sendJson(res, 200, { ok: true, message: "Carousel posters saved locally. Push to GitHub/Vercel to publish.", slides, posterSpecs });
      } catch (error) {
        sendJson(res, 400, { ok: false, message: "Invalid carousel payload." });
      }
      return;
    }

    sendJson(res, 405, { ok: false, message: "Method not allowed." });
    return;
  }

  if (url.pathname === "/api/contact" && req.method === "POST") {
    try {
      const body = await collectBody(req);
      const payload = JSON.parse(body || "{}");
      const result = normalizeLead(payload);
      sendJson(res, result.ok ? 201 : 400, result);
    } catch (error) {
      sendJson(res, 400, { ok: false, message: "Invalid request payload." });
    }
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    sendJson(res, 404, { ok: false, message: "API route not found." });
    return;
  }

  serveFile(res, url.pathname);
});

server.listen(PORT, () => {
  console.log(`BizYako frontend and backend running at http://localhost:${PORT}`);
});


