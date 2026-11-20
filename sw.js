const CACHE='diario-prep-1.8.0';
const ASSETS=['./','./index.html','./style.css?v=1.8','./app.js?v=1.8','./engine.js?v=1.8','./icon.svg','./icon-192.png','./manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(async c=>{await c.addAll(ASSETS);await self.skipWaiting();}));});
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('diario-prep-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==location.origin)return;event.respondWith(fetch(event.request).then(response=>{if(response.ok){const clone=response.clone();caches.open(CACHE).then(c=>c.put(event.request,clone));}return response;}).catch(()=>caches.match(event.request).then(r=>r||(event.request.mode==='navigate'?caches.match('./index.html'):Response.error()))));});
const PUBLIC_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6Z2l5d2ZocnhqZGZncmhmd3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxMjA1MjQsImV4cCI6MjExMDY5NjUyNH0.RG9ZiOEwsnlQQwGb15POC3IWYVC6dJcs4MhLMH2ouik';
self.addEventListener('push',event=>{let p={};try{p=event.data.json()}catch{}
 event.waitUntil((async()=>{
 if(p.kind==='activation'){
  let ok=false;try{const r=await fetch('https://tzgiywfhrxjdfgrhfwyb.supabase.co/functions/v1/reminders',{method:'POST',headers:{'Content-Type':'application/json',apikey:PUBLIC_KEY,Authorization:'Bearer '+PUBLIC_KEY,'x-device-token':p.token},body:JSON.stringify({action:'confirm',proof:p.proof})});ok=r.ok;}catch{}
  await self.registration.showNotification('Il tuo promemoria',{body:ok?'Notifiche attivate.':'Attivazione da verificare. Apri il diario.',tag:'activation',data:{url:self.registration.scope}});
  for(const client of await clients.matchAll({type:'window',includeUncontrolled:true}))client.postMessage({type:'push-activation',ok});
  return;
 }
 await self.registration.showNotification(p.title||'Il tuo promemoria',{body:p.body||'Apri il diario per controllare il promemoria.',...(p.discreet?{}:{icon:'./icon-192.png'}),tag:p.tag||'diario-promemoria',data:{url:self.registration.scope},requireInteraction:false});
 })());
});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(async list=>{const existing=list.find(c=>c.url.startsWith(self.registration.scope));if(existing)return existing.focus();return clients.openWindow(self.registration.scope)}));});
