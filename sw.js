const CACHE='diario-prep-1.15.2-scudo';
const ASSETS=['./assets/status/green.png','./assets/status/blue.png','./','./index.html','./style.css?v=1.15.2-scudo','./app.js?v=1.15.2-scudo','./engine.js?v=1.15.2','./health.js?v=1.15.2','./dashboard.js?v=1.15.2','./dashboard.css?v=1.15.2','./assets/dashboard/rapporto.png','./assets/dashboard/prep.png','./assets/dashboard/analysis.png','./assets/dashboard/visit.png','./assets/dashboard/screening.png','./assets/dashboard/bottle.png','./icon.svg','./icon-192.png','./manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(async c=>{await c.addAll(ASSETS);await self.skipWaiting();}));});
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('diario-prep-')&&k!==CACHE).map(k=>caches.delete(k)));
 await self.clients.claim();
 // One navigation per worker activation upgrades installed iOS windows too.
 // Saved IndexedDB data and push subscriptions are never removed.
 const scope=new URL(self.registration.scope);
 for(const client of await clients.matchAll({type:'window',includeUncontrolled:true})){
  if(!client.url||typeof client.navigate!=='function')continue;
  const url=new URL(client.url);
  if(url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname)||!['','#home'].includes(url.hash))continue;
  url.searchParams.set('app_update',CACHE);
  await client.navigate(url.href).catch(()=>{});
 }
})()));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==location.origin)return;event.respondWith(fetch(event.request,{cache:event.request.mode==='navigate'?'no-store':'no-cache'}).then(response=>{if(response.ok){const clone=response.clone();caches.open(CACHE).then(c=>c.put(event.request,clone));}return response;}).catch(()=>caches.match(event.request).then(r=>r||(event.request.mode==='navigate'?caches.match('./index.html'):Response.error()))));});
const PUBLIC_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6Z2l5d2ZocnhqZGZncmhmd3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxMjA1MjQsImV4cCI6MjExMDY5NjUyNH0.RG9ZiOEwsnlQQwGb15POC3IWYVC6dJcs4MhLMH2ouik';
async function localDiscreet(fallback){
 if(typeof indexedDB==='undefined')return fallback!==false;
 return new Promise(resolve=>{let db;const r=indexedDB.open('diario-prep-v1');r.onerror=()=>resolve(fallback!==false);r.onsuccess=()=>{db=r.result;if(!db.objectStoreNames.contains('state')){db.close();resolve(fallback!==false);return}const q=db.transaction('state','readonly').objectStore('state').get('diary');q.onsuccess=()=>{resolve(q.result?.settings?.discreet??(fallback!==false));db.close()};q.onerror=()=>{db.close();resolve(fallback!==false)}}});
}
async function rememberActivation(token){
 if(typeof indexedDB==='undefined')return;
 await new Promise(resolve=>{const r=indexedDB.open('diario-prep-v1');r.onerror=()=>resolve();r.onsuccess=()=>{const db=r.result;try{if(!db.objectStoreNames.contains('state')){db.close();resolve();return}const tx=db.transaction('state','readwrite');tx.objectStore('state').put({token},'push');tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();resolve()};tx.onabort=()=>{db.close();resolve()};}catch{db.close();resolve()}}});
}
self.addEventListener('push',event=>{let p={};try{p=event.data.json()}catch{}
 event.waitUntil((async()=>{
 if(p.kind==='activation'){
  let ok=false;try{const r=await fetch('https://tzgiywfhrxjdfgrhfwyb.supabase.co/functions/v1/reminders',{method:'POST',headers:{'Content-Type':'application/json',apikey:PUBLIC_KEY,Authorization:'Bearer '+PUBLIC_KEY,'x-device-token':p.token},body:JSON.stringify({action:'confirm',proof:p.proof})});ok=r.ok;}catch{}
  if(ok)await rememberActivation(p.token);
  await self.registration.showNotification('Il tuo promemoria',{body:ok?'Notifiche attivate.':'Attivazione da verificare. Apri il diario.',tag:'activation',data:{url:self.registration.scope}});
  for(const client of await clients.matchAll({type:'window',includeUncontrolled:true}))client.postMessage({type:'push-activation',ok});
  return;
 }
 const discreet=await localDiscreet(p.discreet);
 await self.registration.showNotification(discreet?'Il tuo promemoria':(p.title||'Il tuo promemoria'),{body:discreet?'Apri il diario per controllare il promemoria.':(p.body||'Apri il diario per controllare il promemoria.'),...(discreet?{}:{icon:'./icon-192.png'}),tag:p.tag||'diario-promemoria',data:{url:self.registration.scope},requireInteraction:false});
 })());
});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(async list=>{const existing=list.find(c=>c.url.startsWith(self.registration.scope));if(existing)return existing.focus();return clients.openWindow(self.registration.scope)}));});
