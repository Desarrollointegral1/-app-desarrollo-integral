// ── SERVICE WORKER DI ─────────────────────────────────────────────────
// Ronda 8 (base): NO cachea agresivo.
//  - Navegación (index.html): SIEMPRE red primero → los deploys nuevos entran
//    apenas se publica; cache solo como fallback offline.
//  - Assets estáticos de Vite (/assets/*, con hash en el nombre = inmutables),
//    fuentes e íconos: cache-first.
// Ronda 18 (GIFs lentos en mobile): los GIFs/JPGs del catálogo viven en el
// bucket público de Supabase Storage y se re-bajaban SIEMPRE por red (el SW
// ignoraba todo lo cross-origin). Ahora esos assets van cache-first con un
// cache propio (di-gifs-v1) y poda LRU simple: tope de 220 entradas, al
// superarlo se borran las más viejas (FIFO por orden de inserción de
// cache.keys(), suficiente como aproximación). Un GIF ya visto queda en el
// teléfono y abre al toque. Son archivos inmutables (el dataset no pisa
// paths), así que cache-first es seguro.
// Todo lo demás (API de Supabase, YouTube): red directa, sin tocar.
const CACHE = "di-shell-v2";
const GIF_CACHE = "di-gifs-v1";
const GIF_MAX_ENTRIES = 220;
// Prefijo de los assets públicos del catálogo en Supabase Storage:
const STORAGE_PUBLIC = "/storage/v1/object/public/";

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/"]).catch(() => {})));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== GIF_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Poda LRU (aproximada por orden de inserción): mantiene el cache de GIFs
// acotado para no comerse el almacenamiento del teléfono.
async function trimGifCache() {
  try {
    const c = await caches.open(GIF_CACHE);
    const keys = await c.keys();
    if (keys.length <= GIF_MAX_ENTRIES) return;
    const sobran = keys.length - GIF_MAX_ENTRIES;
    for (let i = 0; i < sobran; i++) await c.delete(keys[i]);
  } catch (err) {
    /* nunca romper un fetch por un fallo de poda */
  }
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // ── Ronda 18: media del catálogo en Supabase Storage (cross-origin) ──
  // Cache-first: si ya se vio, sale del teléfono sin tocar la red.
  if (url.pathname.startsWith(STORAGE_PUBLIC)) {
    e.respondWith(
      caches.open(GIF_CACHE).then((c) =>
        c.match(req).then(
          (hit) =>
            hit ||
            fetch(req).then((res) => {
              if (res.ok || res.type === "opaque") {
                const copy = res.clone();
                c.put(req, copy).then(trimGifCache);
              }
              return res;
            }),
        ),
      ),
    );
    return;
  }

  if (url.origin !== self.location.origin) return; // API Supabase, YouTube, etc: red directa

  // Navegación: red primero, fallback al cache (offline) — NO tocar: es lo
  // que garantiza que cada deploy nuevo entre apenas se publica.
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
    url.pathname.startsWith("/ejercicios/") ||
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
