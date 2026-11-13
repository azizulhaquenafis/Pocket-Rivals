import { test, expect, type Page } from "@playwright/test";
const entries = [
  ["Tower Stack", "tower-stack"],
  ["Orbit Hop", "orbit-hop"],
  ["Color Switch", "color-switch"],
  ["Perfect Pour", "perfect-pour"],
  ["Pocket Climber", "pocket-climber"],
];
const snap = (page: Page) => page.evaluate(() => (window as any).__POCKET__);
async function launch(page: Page, name: string) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "1 Player Arcade", exact: true })
    .click();
  await page.getByRole("button", { name: `Play ${name}`, exact: true }).click();
  await page.getByRole("button", { name: "Medium", exact: true }).click();
  await expect.poll(async () => (await snap(page)).scene.ready).toBe(true);
}
async function tap(page: Page, x: number, y: number) {
  const b = (await page.locator("canvas").boundingBox())!;
  await page.mouse.click(b.x + (b.width * x) / 420, b.y + (b.height * y) / 760);
}
for (const [name, id] of entries)
  test(`${name}: launch, real action, pause, restart and cleanup`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize({ width: 390, height: 844 });
    await launch(page, name);
    await page.screenshot({ path: `test-results/solo-${id}.png` });
    if (id === "tower-stack") {
      for (let n = 0; n < 100; n++) {
        const w = (await snap(page)).scene.game;
        if (Math.abs(w.moving.x - w.top.x) < 8) {
          await page.keyboard.press("Space");
          break;
        }
        await page.waitForTimeout(16);
      }
      await expect
        .poll(async () => (await snap(page)).scene.game.score)
        .toBeGreaterThan(0);
    }
    if (id === "ricochet") {
      await page.keyboard.press("Space");
      expect((await snap(page)).scene.game.shots).toBe(4);
      await expect
        .poll(async () => (await snap(page)).scene.game.score)
        .toBeGreaterThan(0);
    }
    if (id === "orbit-hop") {
      await page.keyboard.press("Space");
      await expect
        .poll(async () => (await snap(page)).scene.game.orbit)
        .toBe(false);
    }
    if (id === "pocket-pinball") {
      await tap(page, 210, 618);
      await expect
        .poll(async () => (await snap(page)).scene.game.balls.length)
        .toBe(1);
      await page.keyboard.down("ArrowLeft");
      await page.waitForTimeout(100);
      expect((await snap(page)).scene.game.left).toBeLessThan(0);
      await page.keyboard.up("ArrowLeft");
    }
    if (id === "color-switch") {
      await page.keyboard.press("Space");
      await page.waitForTimeout(100);
      expect((await snap(page)).scene.game.y).toBeLessThan(590);
    }
    if (id === "slide-escape") {
      const move = await page.evaluate(async () => {
        const { canMove } = await import(
          "/src/arcade/slide-escape/Rules.ts" as string
        );
        const w = (window as any).__POCKET__.scene.game;
        for (let i = 0; i < w.pieces.length; i++)
          for (const d of [-1, 1])
            if (canMove(w.pieces, i, d)) return { i, d, p: w.pieces[i] };
        throw Error("No moves");
      });
      await tap(page, 48 + (move.p.x + 0.5) * 54, 190 + (move.p.y + 0.5) * 54);
      await page.keyboard.press(
        move.p.vertical
          ? move.d < 0
            ? "ArrowUp"
            : "ArrowDown"
          : move.d < 0
            ? "ArrowLeft"
            : "ArrowRight",
      );
      expect((await snap(page)).scene.game.moves).toBe(1);
      await tap(page, 120, 590);
      expect((await snap(page)).scene.game.moves).toBe(0);
    }
    if (id === "perfect-pour") {
      await page.keyboard.down("Space");
      await page.waitForTimeout(350);
      await page.keyboard.up("Space");
      expect((await snap(page)).scene.game.volume).toBeGreaterThan(0);
    }
    if (id === "pocket-climber") {
      await page.keyboard.down("ArrowRight");
      await page.waitForTimeout(100);
      await page.keyboard.up("ArrowRight");
      expect((await snap(page)).scene.game.x).toBeGreaterThan(210);
    }
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: /Keep playing/ }),
    ).toBeVisible();
    const paused = (await snap(page)).scene.game;
    await page.waitForTimeout(180);
    expect((await snap(page)).scene.game).toEqual(paused);
    await page
      .getByRole("button", { name: "Start a fresh match", exact: true })
      .click();
    await page.getByRole("button", { name: "Medium", exact: true }).click();
    await expect.poll(async () => (await snap(page)).scene.ready).toBe(true);
    expect((await snap(page)).scene.game.score).toBe(0);
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: "Back to all games", exact: true })
      .click();
    expect((await snap(page)).scene.inputListeners).toBe(0);
    expect((await snap(page)).saved.rounds).toBe(0);
    expect(errors).toEqual([]);
  });
test("all new cards are visible, load local vector previews and keep engines lazy", async ({
  page,
}) => {
  const engines: string[] = [];
  page.on("request", (r) => {
    if (/\/src\/arcade\/[^/]+\/(Game|Rules)\.ts/.test(r.url()))
      engines.push(r.url());
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "1 Player Arcade", exact: true })
    .click();
  await expect(page.locator("[data-game]")).toHaveCount(7);
  for (const [name, id] of entries) {
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
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  expect(engines).toEqual([]);
});
