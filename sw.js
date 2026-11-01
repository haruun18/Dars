const C = "dars-v17", A = "dars-audio";
const CORE = ["./", "index.html", "icon.png", "manifest.json"];
self.addEventListener("install", e => { e.waitUntil(caches.open(C).then(c => Promise.allSettled(CORE.map(u => c.add(u)))).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C && x !== A).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.hostname.endsWith("googleapis.com") && u.pathname.includes("generateContent")) return;
  if (u.hostname === "ntfy.sh") return;
  if (u.pathname.endsWith(".bin")) {
    // les voix : gardées à part, pour ne pas les retélécharger à chaque mise à jour
    e.respondWith(caches.open(A).then(async c => { const hit = await c.match(r); if (hit) return hit; const res = await fetch(r); if (res.ok) c.put(r, res.clone()); return res; }));
    return;
  }
  const page = r.mode === "navigate" || u.pathname.endsWith("/") || u.pathname.endsWith(".html");
  if (page) {
    e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(C).then(c => c.put("index.html", cp)); return res; }).catch(() => caches.match("index.html").then(m => m || caches.match("./"))));
    return;
  }
  e.respondWith(caches.open(C).then(async c => { const hit = await c.match(r, {ignoreSearch: true});
    const net = fetch(r).then(res => { if (res && (res.ok || res.type === "opaque")) c.put(r, res.clone()); return res; }).catch(() => hit);
    return hit || net; }));
});
