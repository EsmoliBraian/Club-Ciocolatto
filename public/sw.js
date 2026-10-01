// Bump this on any change that should force every installed client to purge
// its old cache — the browser only re-checks this file for byte changes, so
// without a version bump a stale cache can persist indefinitely on a device
// (this exact bug: someone re-adding the home-screen icon kept seeing an old
// build because nothing ever told the old cache to clear).
const CACHE_NAME = "club-ciocolatto-v3";
const APP_SHELL = ["/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

// Navigations (the actual pages) are ALWAYS fetched fresh from the network —
// never cached, never served stale. This app shows live points/balances, so
// an offline-cached page would be actively misleading, not just outdated.
// Only content-hashed static assets (Next's own /_next/* build output) are
// cached — safe to cache-first forever, since the same hashed URL is
// guaranteed to always be the same bytes.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (request.mode === "navigate") return;

  if (["style", "script", "image", "font"].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
  }
});

self.addEventListener("push", (event) => {
  let payload = { title: "Club Ciocolatto", body: "Tenés novedades.", url: "/actividad" };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    // Malformed/empty payload — fall back to the generic message above.
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: payload.url || "/actividad" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/actividad";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
