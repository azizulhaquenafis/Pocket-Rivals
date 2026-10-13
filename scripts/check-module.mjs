import {
  realpath,
  mkdtemp,
  cp,
  symlink,
  readFile,
  readdir,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { build } from "vite";
import { spawnSync } from "node:child_process";
const root = process.cwd(),
  temp = await realpath(
    await mkdtemp(path.join(tmpdir(), "pocket-module-check-")),
  );
try {
  for (const p of ["src", "public", "index.html", "tsconfig.json"])
    await cp(path.join(root, p), path.join(temp, p), { recursive: true });
  await cp(
    path.join(root, "examples/tap-duel"),
    path.join(temp, "src/games/tap-duel"),
    { recursive: true },
  );
  await symlink(
    path.join(root, "node_modules"),
    path.join(temp, "node_modules"),
    "dir",
  );
  const check = spawnSync(
    process.execPath,
    [
      path.join(root, "node_modules/typescript/bin/tsc"),
      "--noEmit",
      "--project",
      path.join(temp, "tsconfig.json"),
    ],
    { encoding: "utf8" },
  );
  if (check.status !== 0) throw Error(check.stdout + check.stderr);
  await build({
    root: temp,
    configFile: false,
    logLevel: "error",
    build: { target: "es2022" },
  });
  const assets = await readdir(path.join(temp, "dist/assets"));
  let code = "";
  for (const file of assets.filter((x) => x.endsWith(".js")))
    code += await readFile(path.join(temp, "dist/assets", file), "utf8");
  for (const needle of ["Tap Duel", "tap-duel", "TAP YOUR HALF"])
    if (!code.includes(needle))
      throw Error(`Missing discovered module: ${needle}`);
  console.log(
    "PASS: copied only a game folder; metadata and lazy implementation compiled automatically. Existing source unchanged.",
  );
} finally {
  await rm(temp, { recursive: true, force: true });
}
