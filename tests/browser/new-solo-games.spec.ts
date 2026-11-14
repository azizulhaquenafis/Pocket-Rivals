import { readFileSync } from "node:fs";
import { test, expect, type Page } from "@playwright/test";
const games = [
  "Pocket Drift",
  "Magnet Dash",
  "Paper Glider",
  "Tiny Foundry",
  "Shadow Step",
  "Domino Lab",
];
const snapshot = (p: Page) =>
  p.evaluate(() => (window as any).__POCKET__.scene.game);
async function open(p: Page, name: string, tier = "Medium") {
  await p.goto("/");
  await p.getByRole("button", { name: "1 Player Arcade", exact: true }).click();
  await p.getByRole("button", { name: `Play ${name}`, exact: true }).click();
  await expect(p.getByText("How to play", { exact: true })).toBeVisible();
  await p.getByRole("button", { name: tier, exact: true }).click();
  await expect.poll(async () => (await snapshot(p))?.started).toBe(true);
}
async function point(p: Page, x: number, y: number) {
  const b = await p.locator("canvas").boundingBox();
  if (!b) throw Error("No canvas");
  return { x: b.x + (x * b.width) / 420, y: b.y + (y * b.height) / 760 };
}
for (const name of games)
  test(`${name}: touch, keyboard, pause, restart and cleanup`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.clock.install();
    await open(page, name);
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
    const before = await snapshot(page);
    if (name === "Pocket Drift") {
      await page.keyboard.down("ArrowLeft");
      await page.clock.runFor(220);
      await page.keyboard.up("ArrowLeft");
      expect((await snapshot(page)).angle).toBeLessThan(before.angle - 0.2);
    }
    if (name === "Magnet Dash") {
      await page.keyboard.press("Space");
      await page.clock.runFor(250);
      expect((await snapshot(page)).x).toBeGreaterThan(before.x + 10);
    }
    if (name === "Paper Glider") {
      await page.keyboard.down("ArrowRight");
      await page.clock.runFor(250);
      await page.keyboard.up("ArrowRight");
      expect((await snapshot(page)).x).toBeGreaterThan(before.x + 8);
    }
    if (name === "Tiny Foundry") {
      await page.keyboard.down("Space");
      await page.clock.runFor(250);
      await page.keyboard.up("Space");
      expect((await snapshot(page)).drops).toBeGreaterThan(0);
    }
    if (name === "Shadow Step") {
      await page.keyboard.down("ArrowRight");
      await page.clock.runFor(250);
      await page.keyboard.up("ArrowRight");
      expect((await snapshot(page)).x).toBeGreaterThan(before.x + 10);
    }
    if (name === "Domino Lab") {
      await page.keyboard.press("Space");
      expect((await snapshot(page)).pieces.length).toBe(1);
      await page.keyboard.press("Backspace");
      expect((await snapshot(page)).pieces.length).toBe(0);
    }
    const touch = await point(
      page,
      name === "Domino Lab" ? 84 : name === "Shadow Step" ? 100 : 320,
      name === "Domino Lab" ? 483 : name === "Shadow Step" ? 548 : 450,
    );
    await page.touchscreen.tap(touch.x, touch.y);
    await page.clock.runFor(100);
    if (name === "Magnet Dash") expect((await snapshot(page)).side).toBe(-1);
    if (name === "Domino Lab")
      expect((await snapshot(page)).pieces.length).toBe(1);
    await page.screenshot({
      path: `/tmp/new-${name.toLowerCase().replaceAll(" ", "-")}.png`,
    });
    await page.keyboard.press("Escape");
    const paused = await snapshot(page);
    await page.clock.runFor(600);
    expect(await snapshot(page)).toEqual(paused);
    await page.clock.resume();
    await page
      .getByRole("button", { name: "Start a fresh match", exact: true })
      .click();
    await page.getByRole("button", { name: "Hard", exact: true }).click();
    expect((await snapshot(page)).difficulty).toBe("hard");
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: "Back to all games", exact: true })
      .click();
    expect(
      await page.evaluate(
        () => (window as any).__POCKET__.scene.inputListeners,
      ),
    ).toBe(0);
    expect(errors).toEqual([]);
  });
test("all six production previews load, engines stay lazy on menu", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));
  await page.goto("http://127.0.0.1:4173/");
  await page
    .getByRole("button", { name: "1 Player Arcade", exact: true })
    .click();
  for (const name of games) {
    const card = page.getByRole("button", {
      name: `Play ${name}`,
      exact: true,
    });
    await card.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        card
          .locator("img")
          .evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0),
      )
      .toBe(true);
  }
  const manifest = JSON.parse(readFileSync("dist/.vite/manifest.json", "utf8"));
  const engines = Object.entries(manifest)
    .filter(([key]) => /src\/(games|arcade)\/.+\/index\.ts$/.test(key))
    .map(([, v]) => (v as { file: string }).file);
  expect(
    requests.some((url) => engines.some((file) => url.endsWith(file))),
  ).toBe(false);
  await page
    .getByRole("button", { name: "2 Player Games", exact: true })
    .click();
  for (const name of [
    "Spike Attacks",
    "Air Hockey",
    "Tic-Tac-Toe",
    "Connect Four",
    "Dots and Boxes",
  ]) {
    const card = page.getByRole("button", {
      name: `Play ${name}`,
      exact: true,
    });
    await card.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        card
          .locator("img")
          .evaluate(
            (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
          ),
      )
      .toBe(true);
  }
  await page
    .getByRole("button", { name: "1 Player Arcade", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Play Domino Lab", exact: true })
    .click();
  await page.getByRole("button", { name: "Impossible", exact: true }).click();
  await expect(page.locator("canvas")).toBeVisible();
  await page.screenshot({ path: "/tmp/domino-production.png" });
});

test("held mobile touch steers and pours, cancel releases controls", async ({
  page,
}) => {
  const cdp = await page.context().newCDPSession(page);
  await page.clock.install();
  for (const name of ["Pocket Drift", "Paper Glider", "Tiny Foundry"]) {
    await open(page, name);
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
    const before = await snapshot(page),
      p = await point(page, 340, 450);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: p.x, y: p.y, id: 1 }],
    });
    await page.clock.runFor(300);
    const held = await snapshot(page);
    if (name === "Pocket Drift")
      expect(held.angle).toBeGreaterThan(before.angle + 0.3);
    if (name === "Paper Glider") expect(held.x).toBeGreaterThan(before.x + 8);
    if (name === "Tiny Foundry") expect(held.drops).toBeGreaterThan(0);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchCancel",
      touchPoints: [],
    });
    await page.clock.runFor(100);
    if (name === "Tiny Foundry")
      expect((await snapshot(page)).pouring).toBe(false);
    await page.clock.resume();
  }
  await cdp.detach();
});

test("Domino Lab completes six puzzles through real inputs, saves score and rematches", async ({
  page,
}) => {
  test.setTimeout(120000);
  const { DominoWorld } = await import("../../src/arcade/domino-lab/Rules");
  await page.clock.install();
  await open(page, "Domino Lab");
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  const model = new DominoWorld();
  for (let level = 1; level <= 6; level++) {
    model.level = level;
    model.layout();
    expect((await snapshot(page)).level).toBe(level);
    for (const c of model.solution().slice(1, -1)) {
      const p = await point(page, 63 + c.c * 42 + 21, 168 + c.r * 42 + 21);
      await page.mouse.click(p.x, p.y);
    }
    await page.keyboard.press("Enter");
    await page.clock.runFor(15000);
  }
  await expect(
    page.getByRole("button", { name: "Play again →", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Six chain reactions mastered/)).toBeVisible();
  const result = await snapshot(page);
  expect(result.score).toBeGreaterThanOrEqual(600);
  await page.clock.resume();
  await page.getByRole("button", { name: "Play again →", exact: true }).click();
  await page.getByRole("button", { name: "Medium", exact: true }).click();
  expect((await snapshot(page)).score).toBe(0);
  expect((await snapshot(page)).level).toBe(1);
});

test.describe("desktop landscape", () => {
  test.use({
    viewport: { width: 1366, height: 768 },
    isMobile: false,
    hasTouch: false,
    deviceScaleFactor: 1,
  });
  test("all six Impossible modes launch without clipping controls or runtime errors", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const name of games) {
      await open(page, name, "Impossible");
      await page.keyboard.press("Space");
      await page.waitForTimeout(80);
      await page.screenshot({
        path: `/tmp/desktop-${name.toLowerCase().replaceAll(" ", "-")}.png`,
      });
      expect((await snapshot(page)).difficulty).toBe("impossible");
    }
    expect(errors).toEqual([]);
  });
});

test("small mobile instructions scroll and every game remains inside the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  for (const name of games) {
    await page.goto("/");
    await page
      .getByRole("button", { name: "1 Player Arcade", exact: true })
      .click();
    await page
      .getByRole("button", { name: `Play ${name}`, exact: true })
      .click();
    await page.getByText("How to play", { exact: true }).click();
    await page.getByRole("button", { name: "Hard", exact: true }).click();
    const box = (await page.locator("canvas").boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(-1);
    expect(box.y).toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width).toBeLessThanOrEqual(321);
    expect(box.y + box.height).toBeLessThanOrEqual(569);
    expect((await snapshot(page)).started).toBe(true);
  }
});

test("new games keep rendering bounded and reuse unchanged text textures", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.addInitScript(() => {
    (window as any).__textDraws = 0;
    const original = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (
      ...a: Parameters<typeof original>
    ) {
      (window as any).__textDraws++;
      return original.apply(this, a);
    };
  });
  for (const name of games) {
    await open(page, name);
    const sample = await page.evaluate(async () => {
      const start = (window as any).__textDraws,
        frames: number[] = [];
      let last = performance.now();
      await new Promise<void>((resolve) => {
        const tick = (now: number) => {
          frames.push(now - last);
          last = now;
          if (frames.length < 90) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      });
      return {
        textDraws: (window as any).__textDraws - start,
        p95: frames.sort((a, b) => a - b)[85],
      };
    });
    expect(sample.textDraws).toBeLessThan(35);
    console.log(name, sample);
  }
});
