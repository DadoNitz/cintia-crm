// Service worker do CRM: deixa o app abrir sem internet.
// - Páginas: tenta a rede primeiro (pega a versão nova) e cai no cache se estiver offline.
// - Arquivos do build (/_next/static, ícones, fontes): cache primeiro, porque o nome muda a cada versão.
// - /api nunca é guardado (sugestões da IA precisam ser na hora).
const VERSAO = "cmc-v1";
const BASE = ["/", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.pathname.startsWith("/api/")) return;

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then((r) => { const c = r.clone(); caches.open(VERSAO).then((cache) => cache.put("/", c)); return r; })
        .catch(() => caches.match("/")),
    );
    return;
  }

  const estatico = url.pathname.startsWith("/_next/static/") || /\.(png|svg|woff2?|webmanifest)$/.test(url.pathname) || url.hostname.endsWith("gstatic.com");
  if (estatico) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((r) => {
        if (r.ok || r.type === "opaque") { const c = r.clone(); caches.open(VERSAO).then((cache) => cache.put(req, c)); }
        return r;
      })),
    );
  }
});
