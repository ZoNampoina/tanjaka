const VERSION="atelier-20261119";
const CACHE="tanjaka-atelier-c9e37b641842";
const scope=self.registration.scope;
const home=new URL("./",scope);
const assets=new Map(Object.entries({"./":"text/html","./tanjaka.ae5b376b36f1.css":"text/css","./tanjaka.c9e37b641842.js":"javascript","./manifest.webmanifest":"json","./icon-192.png":"image/png","./icon-512.png":"image/png","./assets/mark.svg":"image/svg+xml","./assets/barlow-condensed.ttf":null,"./assets/manrope.ttf":null,"./assets/rice.webp":"image/webp","./assets/beans.webp":"image/webp","./assets/bread.webp":"image/webp","./assets/cheese.webp":"image/webp","./assets/yogurt.webp":"image/webp","./assets/milk.webp":"image/webp","./assets/banana.webp":"image/webp","./assets/eggs.webp":"image/webp","./assets/pushup0.jpg":"image/jpeg","./assets/pushup1.jpg":"image/jpeg"}).map(([path,type])=>[new URL(path,scope).href,type]));
self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    const responses=await Promise.all([...assets].map(async([url,type])=>{
      const response=await fetch(url,{cache:"reload",credentials:"same-origin"});
      if(!response.ok||response.redirected||(type&&!response.headers.get("content-type")?.includes(type)))throw Error("Impossible de préparer Tanjaka hors ligne.");
      return [url,response];
    }));
    const cache=await caches.open(CACHE);
    await Promise.all(responses.map(([url,response])=>cache.put(url,response)));
    await self.skipWaiting();
  })());
});
self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    for(const key of await caches.keys())if(key.startsWith("tanjaka-")&&key!==CACHE)await caches.delete(key);
    await self.clients.claim();
    for(const client of await self.clients.matchAll({type:"window"}))client.postMessage({type:"TANJAKA_VERSION",version:VERSION});
  })());
});
self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url);
  if(url.origin!==home.origin)return;
  const entry=url.pathname===home.pathname||url.pathname===home.pathname+"index.html";
  if(request.mode==="navigate"&&entry){
    event.respondWith((async()=>{
      try{const response=await fetch(request);if(response.ok)return response;}catch{}
      return await(await caches.open(CACHE)).match(home.href)??Response.error();
    })());return;
  }
  if(assets.has(url.href)&&!entry){
    event.respondWith((async()=>await(await caches.open(CACHE)).match(request)??fetch(request))());
  }
});
