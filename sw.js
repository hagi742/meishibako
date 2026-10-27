'use strict';
const PREFIX='meishibako-v2-',CACHE=PREFIX+'20261027-3',READY='./__offline-ready-v22__';
const files=['./','index.html','style.css','app.js','core.js','ocr-parser.js','ocr.js','manifest.webmanifest','icon-192.png','icon-512.png','vendor/tesseract.min.js','vendor/worker.min.js','vendor/eng.traineddata.gz','vendor/jpn.traineddata.gz',...['','-simd','-lstm','-simd-lstm'].flatMap(v=>['.wasm','.wasm.js'].map(s=>'vendor/tesseract-core'+v+s))];
async function announce(data){for(const client of await self.clients.matchAll({includeUncontrolled:true}))client.postMessage(data)}
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);let next=0,done=0;
 try{
  await cache.delete(READY);
  await Promise.all(Array.from({length:3},async()=>{while(next<files.length){const file=files[next++];const response=await fetch(new Request(new URL(file,self.registration.scope),{cache:'reload'}));if(!response.ok)throw Error(file+' (HTTP '+response.status+')');await cache.put(file,response);done++;await announce({type:'MEISHIBAKO_CACHE_PROGRESS',done,total:files.length})}}));
  await cache.put(READY,new Response('2.2'));await self.skipWaiting();
 }catch(e){await announce({type:'MEISHIBAKO_CACHE_ERROR',message:e.message});throw e}
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);if(!await cache.match(READY))throw Error('Offline cache is incomplete');
 for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);
 await self.clients.claim();await announce({type:'MEISHIBAKO_OFFLINE_READY_V22'});
})()));
self.addEventListener('message',event=>{if(event.data?.type==='MEISHIBAKO_CHECK_V22')event.waitUntil((async()=>{const cache=await caches.open(CACHE);if(await cache.match(READY))event.source?.postMessage({type:'MEISHIBAKO_OFFLINE_READY_V22'})})())});
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  if(req.mode==='navigate'){
   try{const response=await fetch(req);if(response.ok)return response;const cached=await cache.match('index.html');return cached||response}
   catch(e){const cached=await cache.match('index.html');if(cached)return cached;throw e}
  }
  const cached=await cache.match(req,{ignoreSearch:true});return cached||fetch(req);
 })());
});
