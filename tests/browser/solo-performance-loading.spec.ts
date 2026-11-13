import { test, expect, type Page } from "@playwright/test";
const snapshot = (p: Page) => p.evaluate(() => (window as any).__POCKET__);
async function arcade(page: Page, name: string) {
  await page
    .getByRole("button", { name: "1 Player Arcade", exact: true })
    .click();
  await page.getByRole("button", { name: `Play ${name}`, exact: true }).click();
}
async function delayRenderer(page: Page) {
  await page.addInitScript(() => {
    const property = Object.getOwnPropertyDescriptor(
      HTMLImageElement.prototype,
      "src",
    )!;
    Object.defineProperty(HTMLImageElement.prototype, "src", {
      ...property,
      set(value: string) {
        if (value.startsWith("data:image/png"))
          setTimeout(() => property.set!.call(this, value), 1800);
        else property.set!.call(this, value);
      },
    });
  });
}
test("selection before renderer boot finishes starts the intended game", async ({
  page,
}) => {
  await delayRenderer(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await arcade(page, "Orbit Hop");
  await expect
    .poll(async () => (await snapshot(page)).state, { timeout: 7000 })
    .toBe("playing");
  await expect(
    page.getByRole("button", { name: "Medium", exact: true }),
  ).toBeVisible();
  expect((await snapshot(page)).scene.id).toBe("orbit-hop");
});
test("cancel during renderer boot cannot resurrect the abandoned game", async ({
  page,
}) => {
  await delayRenderer(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await arcade(page, "Orbit Hop");
  await page.locator(".game-transition button").click();
  await page
    .getByRole("button", { name: "Play Color Switch", exact: true })
    .click();
  await expect
    .poll(async () => (await snapshot(page)).state, { timeout: 7000 })
    .toBe("playing");
  expect((await snapshot(page)).scene.id).toBe("color-switch");
  await expect(page.locator(".arcade-setup section")).toHaveAttribute(
    "aria-label",
    "Color Switch difficulty",
  );
});
test("a stalled download times out; its late completion cannot replace another game", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  await page.route("**/src/arcade/orbit-hop/index.ts*", async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto("/");
  await page.clock.install();
  await arcade(page, "Orbit Hop");
  await expect(page.locator(".game-transition")).toBeVisible();
  await page.clock.fastForward(12100);
  await expect(
    page.getByRole("heading", { name: "That game took a break." }),
  ).toBeVisible();
  await expect(page.locator(".game-transition")).toBeHidden();
  await page
    .getByRole("button", { name: "Back to games", exact: true })
    .click();
  release();
  await page
    .getByRole("button", { name: "Play Color Switch", exact: true })
    .click();
  await page.getByRole("button", { name: "Hard", exact: true }).click();
  await page.clock.runFor(500);
  const s = await snapshot(page);
  expect(s.scene.id).toBe("color-switch");
  expect(s.scene.ready).toBe(true);
  await expect(page.locator(".arcade-setup")).toHaveCount(0);
});
test("backgrounding during a delayed import preserves pause and resume", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  await page.route("**/src/arcade/orbit-hop/index.ts*", async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto("/");
  await arcade(page, "Orbit Hop");
  await page.keyboard.press("Escape");
  release();
  await expect.poll(async () => (await snapshot(page)).scene.ready).toBe(true);
  expect((await snapshot(page)).state).toBe("paused");
  expect((await snapshot(page)).scene.paused).toBe(true);
  await page.getByRole("button", { name: /Keep playing/ }).click();
  await page.getByRole("button", { name: "Medium", exact: true }).click();
  await expect
    .poll(async () => (await snapshot(page)).scene.game.started)
    .toBe(true);
});
test("unchanged solo text produces no per-frame canvas rasterization", async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as any).__textDraws = 0;
    const original = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (
      ...args: Parameters<typeof original>
    ) {
      (window as any).__textDraws++;
      return original.apply(this, args);
    };
  });
  for (const name of [
    "Orbit Hop",
    "Color Switch",
    "Perfect Pour",
    "Tower Stack",
  ]) {
    await page.goto("/");
    await arcade(page, name);
    await page.getByRole("button", { name: "Medium", exact: true }).click();
    const samples = await page.evaluate(async () => {
      const start = (window as any).__textDraws;
      const frames: number[] = [];
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
        draws: (window as any).__textDraws - start,
        frameP95: frames.sort((a, b) => a - b)[85],
      };
    });
    expect(
      samples.draws,
      `${name} should reuse its label textures`,
    ).toBeLessThanOrEqual(2);
    console.log(name, samples);
  }
});
