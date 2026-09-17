const CACHE='srb-games-v26';
const CORE=['./','./index.html','./style.css?v=26','./app.js?v=26','./manifest.json','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE))));
self.addEventListener('message',event=>{if(event.data&&event.data.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const u=new URL(event.request.url);
 const core=u.origin===self.location.origin && (/\/(index\.html|app\.js|style\.css)$/.test(u.pathname)||u.pathname.endsWith('/SRB-GAMES/')||u.pathname.endsWith('/SRB-GAMES'));
 if(core){event.respondWith(fetch(event.request,{cache:'no-store'}).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(event.request,c));return r;}).catch(()=>caches.match(event.request).then(r=>r||caches.match('./index.html'))));return;}
 event.respondWith(caches.match(event.request).then(c=>c||fetch(event.request).then(r=>{const x=r.clone();caches.open(CACHE).then(k=>k.put(event.request,x));return r;})));
});
