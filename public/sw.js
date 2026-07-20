// ── SERVICE WORKER DI (ronda 8) ───────────────────────────────────────
// Mínimo y seguro: NO cachea agresivo.
//  - Navegación (index.html): SIEMPRE red primero → los deploys nuevos entran
//    apenas se publica; cache solo como fallback offline.
//  - Assets estáticos de Vite (/assets/*, con hash en el nombre = inmutables),
//    fuentes e íconos: cache-first.
//  - Todo lo demás (Supabase, APIs, YouTube): red directa, sin tocar.
// El nombre del cache lleva versión: al desplegar un sw.js nuevo, activate
// borra los caches viejos. skipWaiting + clients.claim para que el SW nuevo
// tome control sin esperar.
const CACHE = "di-shell-v1";

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/"]).catch(() => {})));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase, YouTube, etc: red directa

  // Navegación: red primero, fallback al cache (offline)
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("/", copy));
          return res;
        })
        .catch(() => caches.match("/")),
    );
    return;
  }

  // Shell estático inmutable: cache-first
  const esEstatico =
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/favicon.png" ||
    url.pathname === "/manifest.webmanifest";
  if (esEstatico) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
  }
  // resto: red directa (no interceptamos)
});
