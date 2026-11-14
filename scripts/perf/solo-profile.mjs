import { chromium } from "@playwright/test";
// Run against the local Vite server; reports short idle samples, not device certification.
const b = await chromium.launch({ channel: "chrome", headless: true });
const p = await b.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
await p.addInitScript(() => {
  window.__perf = { text: 0, uploads: 0 };
  const f = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function (...a) {
    window.__perf.text++;
    return f.apply(this, a);
  };
  for (const C of [WebGLRenderingContext, WebGL2RenderingContext]) {
    const f = C.prototype.texImage2D;
    C.prototype.texImage2D = function (...a) {
      window.__perf.uploads++;
      return f.apply(this, a);
    };
  }
});
const report = [];
for (const [name, path, cls] of [
  ["Orbit Hop", "shared/arcade/ArcadeGame", "ArcadeGame"],
  ["Color Switch", "shared/arcade/ArcadeGame", "ArcadeGame"],
  ["Perfect Pour", "shared/arcade/ArcadeGame", "ArcadeGame"],
  ["Pocket Climber", "shared/arcade/ArcadeGame", "ArcadeGame"],
  ["Classic Snake", "arcade/snake/SnakeGame", "SnakeGame"],
  ["Star Patrol", "arcade/space-shooter/SpaceShooterGame", "SpaceShooterGame"],
]) {
  await p.goto("http://127.0.0.1:5173/");
  await p.getByRole("button", { name: "1 Player Arcade", exact: true }).click();
  const t = Date.now();
  await p.getByRole("button", { name: `Play ${name}`, exact: true }).click();
  await p.waitForFunction(() => window.__POCKET__?.state === "playing");
  const loading = Date.now() - t;
  if (name === "Classic Snake")
    await p.getByRole("button", { name: "Play →", exact: true }).click();
  else await p.getByRole("button", { name: "Medium", exact: true }).click();
  const result = await p.evaluate(
    async ({ path, cls }) => {
      const url = performance
        .getEntriesByType("resource")
        .map((e) => e.name)
        .find((n) => n.includes("/src/" + path + ".ts"));
      const M = await import(url ?? "/src/" + path + ".ts");
      const proto = M[cls].prototype,
        original = proto.update;
      const cpu = [];
      proto.update = function (...a) {
        const start = performance.now();
        const r = original.apply(this, a);
        cpu.push(performance.now() - start);
        return r;
      };
      const start = { ...window.__perf },
        frames = [];
      let last = performance.now();
      await new Promise((resolve) => {
        function frame(now) {
          frames.push(now - last);
          last = now;
          if (frames.length < 120) requestAnimationFrame(frame);
          else resolve();
        }
        requestAnimationFrame(frame);
      });
      proto.update = original;
      const sum = frames.reduce((a, b) => a + b, 0);
      frames.sort((a, b) => a - b);
      cpu.sort((a, b) => a - b);
      return {
        fps: 120000 / sum,
        frameP95: frames[114],
        updateP95: cpu[Math.floor(cpu.length * 0.95)],
        textDraws: window.__perf.text - start.text,
        uploads: window.__perf.uploads - start.uploads,
      };
    },
    { path, cls },
  );
  report.push({ name, loading, ...result });
  console.log(JSON.stringify(report.at(-1)));
}
await b.close();
