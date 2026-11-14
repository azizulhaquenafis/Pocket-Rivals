import { test, expect, type Page } from "@playwright/test";
const snapshot = (p: Page) => p.evaluate(() => (window as any).__POCKET__);

test("Lumberjack Impossible completes 100 real chops, pauses and releases input", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?aiSeed=42");
  await page
    .getByRole("button", { name: "Play Lumberjack", exact: true })
    .click();
  await page.getByRole("radio", { name: /1 Player/ }).click();
  await page.getByRole("radio", { name: "Impossible", exact: true }).click();
  await page.getByRole("button", { name: /Let’s play/ }).click();
  await expect
    .poll(async () => (await snapshot(page)).scene.game?.players[1].score)
    .toBeGreaterThan(3);
  await page.keyboard.press("Escape");
  const paused = (await snapshot(page)).scene.game;
  await page.waitForTimeout(300);
  expect((await snapshot(page)).scene.game).toEqual(paused);
  await page.getByRole("button", { name: /Keep playing/ }).click();
  await expect
    .poll(async () => (await snapshot(page)).scene.game.winner, {
      timeout: 16000,
    })
    .toBe(2);
  const result = (await snapshot(page)).scene.game;
  expect(result.players[1].score).toBe(100);
  expect(result.players[1].alive).toBe(true);
  await expect(
    page.getByRole("button", { name: "Rematch", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Back to all games", exact: true })
    .click();
  expect((await snapshot(page)).scene.inputListeners).toBe(0);
  expect(errors).toEqual([]);
});

test("menu sleeps the renderer both after initial boot and game exit", async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as any).__drawCalls = 0;
    for (const GL of [WebGLRenderingContext, WebGL2RenderingContext]) {
      const original = GL.prototype.drawArrays;
      GL.prototype.drawArrays = function (
        ...args: Parameters<typeof original>
      ) {
        (window as any).__drawCalls++;
        return original.apply(this, args);
      };
    }
  });
  await page.goto("/");
  const verifyIdle = async () => {
    await page.waitForTimeout(350);
    const draws = await page.evaluate(() => (window as any).__drawCalls);
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => (window as any).__drawCalls)).toBe(draws);
  };
  await verifyIdle();
  await page.getByRole("button", { name: "Play Pong", exact: true }).click();
  await page.getByRole("button", { name: /Let’s play/ }).click();
  await expect.poll(async () => (await snapshot(page)).scene.ready).toBe(true);
  await page.waitForTimeout(300);
  const playing = await page.evaluate(() => (window as any).__drawCalls);
  expect(playing).toBeGreaterThan(0);
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Back to all games", exact: true })
    .click();
  await verifyIdle();
});
