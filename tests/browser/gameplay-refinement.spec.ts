import { test, expect, type Page } from "@playwright/test";
const game = (page: Page) =>
  page.evaluate(() => (window as any).__POCKET__.scene.game);
test("Spike players push, resist and release through ordinary two-player keyboard input", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/?aiSeed=77");
  await page
    .getByRole("button", { name: "Play Spike Attacks", exact: true })
    .click();
  await page.getByRole("radio", { name: /2 Players/ }).click();
  await page.getByRole("button", { name: /Let’s play/ }).click();
  await expect.poll(async () => (await game(page))?.players?.length).toBe(2);
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  const initial = (await game(page)).players;
  await page.keyboard.down("KeyD");
  await page.clock.runFor(800);
  const pushed = (await game(page)).players;
  expect(pushed[1].x).toBeGreaterThan(initial[1].x + 8);
  expect(pushed[1].x - pushed[0].x).toBeCloseTo(18, 1);
  await page.keyboard.down("ArrowLeft");
  await page.clock.runFor(250);
  const resisted = (await game(page)).players;
  expect(Math.abs(resisted[0].x - pushed[0].x)).toBeLessThan(2);
  await page.keyboard.up("KeyD");
  await page.clock.runFor(150);
  expect((await game(page)).players[0].x).toBeLessThan(resisted[0].x - 6);
  await page.keyboard.up("ArrowLeft");
  await page.keyboard.press("Escape");
  const paused = await game(page);
  await page.clock.runFor(500);
  expect(await game(page)).toEqual(paused);
  await page
    .getByRole("button", { name: "Back to all games", exact: true })
    .click();
  expect(
    await page.evaluate(() => (window as any).__POCKET__.scene.inputListeners),
  ).toBe(0);
});
test("Color journey offers distinct tiers, real steering/hopping and clean pause/exit", async ({
  page,
}) => {
  const widths: number[] = [];
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const tier of ["Medium", "Hard", "Impossible"]) {
    await page.goto("/");
    await page
      .getByRole("button", { name: "1 Player Arcade", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Play Color Switch", exact: true })
      .click();
    await page.getByRole("button", { name: tier, exact: true }).click();
    const initial = await game(page);
    widths.push(initial.laneWidth);
    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(160);
    await page.keyboard.up("ArrowRight");
    expect((await game(page)).x).toBeGreaterThan(initial.x + 5);
    await page.keyboard.press("Space");
    await page.waitForTimeout(80);
    expect((await game(page)).y).toBeLessThan(initial.floor - 5);
    await page.keyboard.press("Escape");
    const paused = await game(page);
    await page.waitForTimeout(180);
    expect(await game(page)).toEqual(paused);
    await page.getByRole("button", { name: /Keep playing/ }).click();
    await page.screenshot({
      path: `/tmp/color-journey-${tier.toLowerCase()}.png`,
    });
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: "Back to all games", exact: true })
      .click();
    expect(
      await page.evaluate(
        () => (window as any).__POCKET__.scene.inputListeners,
      ),
    ).toBe(0);
  }
  expect(widths[0]).toBeGreaterThan(widths[1]);
  expect(widths[1]).toBeGreaterThan(widths[2]);
  expect(errors).toEqual([]);
});

test("four redesigned previews load as lightweight local SVGs in production", async ({
  page,
}) => {
  await page.goto("http://127.0.0.1:4173/");
  for (const [section, names] of [
    ["2 Player Games", ["Lumberjack", "Fruit Duel"]],
    ["1 Player Arcade", ["Color Switch", "Pocket Climber"]],
  ] as const) {
    await page.getByRole("button", { name: section, exact: true }).click();
    for (const name of names) {
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
      expect(await card.locator("img").getAttribute("src")).toMatch(/\.svg$/);
      await card.screenshot({
        path: `/tmp/preview-${name.toLowerCase().replaceAll(" ", "-")}.png`,
      });
    }
  }
});
