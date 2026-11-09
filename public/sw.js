const CACHE = "dental-share-static-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") return;
  const blocked = ["/api", "/app", "/lab", "/merchant", "/provider", "/admin"];
  if (blocked.some((prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`))) return;
  if (!url.pathname.startsWith("/_next/static") && url.pathname !== "/manifest.webmanifest") return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const fresh = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached || fresh;
    }),
  );
});
