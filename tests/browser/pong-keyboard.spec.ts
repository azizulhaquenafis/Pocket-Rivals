import { test, expect, type Page } from "@playwright/test";

const paddles = (page: Page): Promise<{ x: number }[]> =>
  page.evaluate(() => (window as any).__POCKET__.scene.game.paddles);

async function start(page: Page, solo = false) {
  await page.goto("/");
  await page.getByRole("button", { name: "Play Pong", exact: true }).click();
  if (solo) await page.getByRole("radio", { name: /1 Player/ }).click();
  await page.getByRole("button", { name: "Let’s play →" }).click();
  await expect
    .poll(() => page.evaluate(() => (window as any).__POCKET__?.scene.ready))
    .toBe(true);
}

test("Pong keyboard moves both players, clamps at edges and clears on pause", async ({
  page,
}) => {
  await start(page);
  await page.keyboard.down("KeyA");
  await page.keyboard.down("ArrowRight");
  await expect
    .poll(async () => (await paddles(page)).map((p) => p.x))
    .toEqual([68, 352]);
  await page.keyboard.up("KeyA");
  await page.keyboard.up("ArrowRight");
  await page.keyboard.down("KeyD");
  await page.keyboard.down("ArrowLeft");
  await expect
    .poll(async () => (await paddles(page)).map((p) => p.x))
    .toEqual([352, 68]);
  await page.keyboard.press("Escape");
  await page.keyboard.up("KeyD");
  await page.keyboard.up("ArrowLeft");
  await page.getByRole("button", { name: /Keep playing/ }).click();
  await page.waitForTimeout(150);
  expect((await paddles(page)).map((p) => p.x)).toEqual([352, 68]);
  await page.keyboard.down("KeyA");
  await expect.poll(async () => (await paddles(page))[0].x).toBeLessThan(300);
  await page.keyboard.up("KeyA");
  await page.waitForTimeout(80);
  const stopped = (await paddles(page))[0].x;
  await page.waitForTimeout(150);
  expect((await paddles(page))[0].x).toBe(stopped);
});

test("Pong solo accepts arrows and A/D for the human paddle", async ({
  page,
}) => {
  await start(page, true);
  await page.keyboard.down("ArrowLeft");
  await expect.poll(async () => (await paddles(page))[0].x).toBe(68);
  await page.keyboard.up("ArrowLeft");
  await page.keyboard.down("KeyD");
  await expect.poll(async () => (await paddles(page))[0].x).toBe(352);
  await page.keyboard.up("KeyD");
});
