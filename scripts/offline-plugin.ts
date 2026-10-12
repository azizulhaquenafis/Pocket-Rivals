import type { Plugin } from "vite";
import { createHash } from "node:crypto";
/** Cache the complete packaged build; lazy code stays uninitialized until selected. */
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
      ];
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
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('pocket-rivals-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;event.respondWith(caches.open(CACHE).then(cache=>cache.match(event.request,{ignoreVary:true})).then(hit=>hit||fetch(event.request)));});
`,
      });
    },
  };
}
