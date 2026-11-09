const CACHE = 'taskmate-static-v10-accounts';
const ASSETS = ['./','./index.html','./styles.css','./app.js','./excel-import.js','./Template_Import_TaskMate_Jadwal_Rak.xlsx','./roster-data.js','./config.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const u=new URL(e.request.url);
 if(u.origin!==location.origin)return; // Supabase/API request tidak di-cache.
 e.respondWith(fetch(e.request).then(r=>{if(r.ok&&ASSETS.filter(a=>a!=='./').some(a=>u.pathname.endsWith(a.replace('./','')))){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return r}).catch(()=>caches.match(e.request)));
});

// Web Push: dapat menampilkan notifikasi meskipun aplikasi tidak sedang terbuka.
self.addEventListener('push',event=>{
 let payload={};try{payload=event.data?.json()||{}}catch{}
 event.waitUntil(self.registration.showNotification(payload.title||'⏰ Checklist Shift',{
  body:payload.body||'Ada pekerjaan shift yang belum selesai.',icon:'./icons/icon-192.png',badge:'./icons/icon-192.png',tag:payload.tag||'shift-reminder',renotify:true,
  vibrate:[250,120,250,120,350],data:{url:payload.url||'./?tab=shift'}
 }));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();const relative=event.notification.data?.url||'./?tab=shift';
 event.waitUntil((async()=>{
  const dest=new URL(relative,self.registration.scope);if(dest.origin!==self.location.origin)return;
  const windows=await clients.matchAll({type:'window',includeUncontrolled:true});
  for(const client of windows){if(new URL(client.url).origin===dest.origin){await client.focus();if('navigate' in client)await client.navigate(dest.href);return}}
  await clients.openWindow(dest.href);
 })());
});
