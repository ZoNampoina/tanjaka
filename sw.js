const CACHE = "tanjaka-6b9b31307ef7";
const scope = self.registration.scope;
const home = new URL("./", scope);
const assets = new Map(Object.entries({"./": "text/html", "./tanjaka.84d8ce0803ea.css": "text/css", "./tanjaka.99591d964be1.js": "javascript", "./manifest.webmanifest": "json", "./icon-192.png": "image/png", "./icon-512.png": "image/png"}).map(([path,type]) => [new URL(path,scope).href,type]));

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const responses = await Promise.all([...assets].map(async ([url, type]) => {
      const response = await fetch(url, {cache:"reload",credentials:"same-origin"});
      if (!response.ok || response.redirected || !response.headers.get("content-type")?.includes(type)) {
        throw new Error("Impossible de préparer Tanjaka hors ligne.");
      }
      return [url,response];
    }));
    const cache = await caches.open(CACHE);
    await Promise.all(responses.map(([url,response]) => cache.put(url,response)));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith("tanjaka-") && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== home.origin) return;
  const entry = url.pathname === home.pathname || url.pathname === home.pathname + "index.html";
  if (request.mode === "navigate" && entry) {
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(CACHE);
      return await cache.match(home.href) ?? Response.error();
    }));
    return;
  }
  if (assets.has(url.href) && !entry) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      return await cache.match(request) ?? fetch(request);
    })());
  }
});
