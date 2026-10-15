import { test, expect, type Page } from "@playwright/test";

const mallets = (page: Page): Promise<{ x: number; y: number }[]> =>
  page.evaluate(() => (window as any).__POCKET__.scene.game.mallets);

async function start(page: Page, solo = false) {
  await page.goto("/");
  await page.getByRole("button", { name: "Play Air Hockey", exact: true }).click();
  if (solo) await page.getByRole("radio", { name: /1 Player/ }).click();
  await page.getByRole("button", { name: "Let’s play →" }).click();
  await expect
    .poll(() => page.evaluate(() => (window as any).__POCKET__?.scene.ready))
    .toBe(true);
}

test("Air Hockey keyboard moves both players in 2P mode with WASD and Arrows", async ({
  page,
}) => {
  await start(page);

  // Player 0 (Orange) uses WASD: move left and up
  await page.keyboard.down("KeyA");
  await page.keyboard.down("KeyW");
  await expect.poll(async () => (await mallets(page))[0].x).toBeLessThan(190);
  await expect.poll(async () => (await mallets(page))[0].y).toBeLessThan(550);
  await page.keyboard.up("KeyA");
  await page.keyboard.up("KeyW");

  // Player 0 moves right and down
  await page.keyboard.down("KeyD");
  await page.keyboard.down("KeyS");
  await expect.poll(async () => (await mallets(page))[0].x).toBeGreaterThan(230);
  await expect.poll(async () => (await mallets(page))[0].y).toBeGreaterThan(570);
  await page.keyboard.up("KeyD");
  await page.keyboard.up("KeyS");

  // Player 1 (Blue) uses Arrows: move right and down towards net
  await page.keyboard.down("ArrowRight");
  await page.keyboard.down("ArrowDown");
  await expect.poll(async () => (await mallets(page))[1].x).toBeGreaterThan(230);
  await expect.poll(async () => (await mallets(page))[1].y).toBeGreaterThan(200);
  await page.keyboard.up("ArrowRight");
  await page.keyboard.up("ArrowDown");

  // Player 1 moves left and up towards back rail
  await page.keyboard.down("ArrowLeft");
  await page.keyboard.down("ArrowUp");
  await expect.poll(async () => (await mallets(page))[1].x).toBeLessThan(190);
  await expect.poll(async () => (await mallets(page))[1].y).toBeLessThan(170);
  await page.keyboard.up("ArrowLeft");
  await page.keyboard.up("ArrowUp");

  // Pause test: pause clears input and stops mallets
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /Keep playing/ })).toBeVisible();
  const stopped = await mallets(page);
  await page.waitForTimeout(100);
  expect(await mallets(page)).toEqual(stopped);
});

test("Air Hockey solo accepts both WASD and Arrow keys for the human mallet", async ({
  page,
}) => {
  await start(page, true);

  // Solo player moves using Arrow keys
  await page.keyboard.down("ArrowLeft");
  await page.keyboard.down("ArrowUp");
  await expect.poll(async () => (await mallets(page))[0].x).toBeLessThan(190);
  await expect.poll(async () => (await mallets(page))[0].y).toBeLessThan(550);
  await page.keyboard.up("ArrowLeft");
  await page.keyboard.up("ArrowUp");

  // Solo player moves using WASD
  await page.keyboard.down("KeyD");
  await page.keyboard.down("KeyS");
  await expect.poll(async () => (await mallets(page))[0].x).toBeGreaterThan(230);
  await expect.poll(async () => (await mallets(page))[0].y).toBeGreaterThan(570);
  await page.keyboard.up("KeyD");
  await page.keyboard.up("KeyS");
});
