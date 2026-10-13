import type { Plugin } from "vite";
import { createHash } from "node:crypto";
/** Cache only the shell on install. Game chunks are cached on demand or by an explicit download. */
export function offlinePlugin(): Plugin {
  return {
    name: "pocket-offline",
    apply: "build",
    generateBundle(_options, bundle) {
      const files = [
          "./",
          "./index.html",
          "./icon.svg",
          ...Object.keys(bundle).map((f) => "./" + f),
        ],
        initial = new Set<string>(["./", "./index.html", "./icon.svg"]);
      const visit = (name: string) => {
        if (initial.has("./" + name)) return;
        initial.add("./" + name);
        const chunk = bundle[name];
        if (chunk?.type === "chunk") chunk.imports.forEach(visit);
      };
      for (const item of Object.values(bundle)) {
        if (item.type === "chunk" && item.isEntry) visit(item.fileName);
        if (/\.(css|woff2?)$/.test(item.fileName))
          initial.add("./" + item.fileName);
      }
      const version = createHash("sha256")
        .update(JSON.stringify(Object.keys(bundle)))
        .digest("hex")
        .slice(0, 12);
      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: `
const CACHE='pocket-rivals-${version}';
const FILES=${JSON.stringify([...new Set(files)])};
const SHELL=${JSON.stringify([...initial])};
const ALLOWED=new Set(FILES.map(f=>new URL(f,self.location.href).href));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('pocket-rivals-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data?.type!=='CACHE_ALL')return;event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>event.ports[0]?.postMessage({ok:true}),()=>event.ports[0]?.postMessage({ok:false})));});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;event.respondWith((async()=>{const cache=await caches.open(CACHE),hit=await cache.match(event.request,{ignoreVary:true});if(hit)return hit;const response=await fetch(event.request);if(response.ok&&ALLOWED.has(event.request.url))await cache.put(event.request,response.clone());return response;})());});
`,
      });
    },
  };
}
