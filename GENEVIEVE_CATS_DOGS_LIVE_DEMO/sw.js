const CACHE='genevieve-care-demo-v5';
const ASSETS=['./','./index.html','./employee.html','./transport.html','./owner.html','./styles.css','./store.js','./shared.js','./app.js','./safety-command.js','./employee.js','./transport.js','./owner.js','./assets/genevieve-ga-logo.png','./assets/genevieve-tree-logo.jpg','./assets/mr-gruff.jpg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{const cp=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return resp}).catch(()=>caches.match('./index.html'))))});
