'use strict';
const PREFIX='meishibako-v2-',CACHE=PREFIX+'20261027-1';
const files=['./','index.html','style.css','app.js','core.js','manifest.webmanifest','icon-192.png','icon-512.png','vendor/tesseract.min.js','vendor/worker.min.js','vendor/eng.traineddata.gz','vendor/jpn.traineddata.gz',...['','-simd','-lstm','-simd-lstm'].flatMap(v=>['.wasm','.wasm.js'].map(s=>'vendor/tesseract-core'+v+s))];
self.addEventListener('install',e=>e.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(files);await self.skipWaiting()})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);await self.clients.claim()})()));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith((async()=>{const cache=await caches.open(CACHE),hit=await cache.match(e.request,{ignoreSearch:true});if(hit)return hit;try{return await fetch(e.request)}catch(err){if(e.request.mode==='navigate')return await cache.match('index.html');throw err}})())});

self.addEventListener('message',e=>{if(e.data?.type==='MEISHIBAKO_CHECK_V2')e.waitUntil((async()=>{if(await caches.has(CACHE))e.source?.postMessage({type:'MEISHIBAKO_OFFLINE_READY_V2'})})())});
