import { readFile, writeFile, readdir } from "node:fs/promises";
import { gzipSync } from "node:zlib";
const manifest = JSON.parse(await readFile("dist/.vite/manifest.json", "utf8")),
  initial = new Set();
function visit(key) {
  if (initial.has(key)) return;
  initial.add(key);
  for (const child of manifest[key].imports ?? []) visit(child);
}
for (const [key, chunk] of Object.entries(manifest))
  if (chunk.isEntry) visit(key);
const rows = [];
for (const key of initial) {
  const chunk = manifest[key],
    code = await readFile("dist/" + chunk.file);
  rows.push({
    module: key,
    file: chunk.file,
    bytes: code.length,
    gzip: gzipSync(code).length,
  });
}
const gameChunks = Object.keys(manifest).filter((k) =>
  /src\/(games|arcade)\/.+\/index\.ts$/.test(k),
);
if (gameChunks.some((k) => initial.has(k)))
  throw Error("A game implementation leaked into the initial payload");
const registered = [];
for (const root of ["games", "arcade"])
  for (const folder of await readdir("src/" + root, { withFileTypes: true }))
    if (folder.isDirectory()) {
      const files = await readdir("src/" + root + "/" + folder.name);
      if (files.includes("config.ts") && files.includes("index.ts"))
        registered.push("src/" + root + "/" + folder.name + "/index.ts");
    }
if (registered.some((k) => !gameChunks.includes(k)))
  throw Error("A registered game is missing its lazy chunk");
const app = rows.find((r) => r.module === "index.html");
if (!app || app.gzip > 24000)
  throw Error(
    "Application shell exceeded its 24KB gzip budget; inspect imports",
  );
const report = {
  initial: rows,
  lazyGames: gameChunks,
  totalInitialGzip: rows.reduce((s, r) => s + r.gzip, 0),
};
await writeFile(
  "docs/bundle-report.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
