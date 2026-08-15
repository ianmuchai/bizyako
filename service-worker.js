const CACHE_PREFIX = "bizyako-";
const CACHE_NAME = "bizyako-shell-v15";
const APP_SHELL = [
  "/",
  "/index.html",
  "/styles.css?v=20260815-2",
  "/script.js?v=20260815-2",
  "/chat-history.js?v=20260815-2",
  "/product-demo.html",
  "/product-demo.js?v=20260815-2",
  "/manifest.webmanifest",
  "/data/site-static.json",
  "/assets/bizyako-logo.png",
  "/assets/bizyako-carousel-impact.webp",
  "/assets/icons/bizyako-192.png",
  "/assets/icons/bizyako-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes("by-admin")) return;

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkOnlyApi(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, "/index.html"));
    return;
  }

  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkOnlyApi(request) {
  try {
    return await fetch(request, { cache: "no-store" });
  } catch {
    return new Response(JSON.stringify({
      ok: false,
      offline: true,
      message: "BizYako is offline. Please reconnect and try again.",
    }), {
      status: 503,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}

async function networkFirst(request, fallbackPath = null) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (fallbackPath) return caches.match(fallbackPath);

    return new Response(JSON.stringify({ ok: false, offline: true, message: "BizYako data is temporarily unavailable." }), {
      status: 503,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
}