// MARAMI offline cache: lets the hosted app open without internet.
// - The app page itself: network first (always the newest version when online), cached copy offline.
// - Firebase library files and the Excel reader (xlsx, GEN 3 imports): cached after the first load.
const CACHE='marami-gen4-v1';
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.add('./')).catch(()=>{}))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin===self.location.origin){
    // one cached copy per file (the page is stored once, whatever is after "?" in the link)
    const key=req.mode==='navigate'?new URL('./',self.registration.scope).href:url.origin+url.pathname;
    e.respondWith(fetch(req).then(res=>{if(res.ok&&res.type==='basic'){const copy=res.clone();caches.open(CACHE).then(c=>c.put(key,copy))}return res})
      .catch(()=>caches.match(key).then(r=>r||Response.error())));
    return;
  }
  const library=(url.hostname==='www.gstatic.com'&&url.pathname.startsWith('/firebasejs/'))||(url.hostname==='cdn.jsdelivr.net'&&url.pathname.startsWith('/npm/xlsx@'));
  if(library){
    e.respondWith(caches.match(req).then(r=>r||fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return res})));
  }
});
