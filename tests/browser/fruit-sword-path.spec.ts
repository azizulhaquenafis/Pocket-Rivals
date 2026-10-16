import { test, expect } from "@playwright/test";
test("sword traverses, recovers to original side, locks input and freezes on pause", async ({
  page,
}) => {
  const s = () => page.evaluate(() => (window as any).__POCKET__.scene.game);
  await page.goto("/?aiSeed=77");
  await page
    .getByRole("button", { name: "Play Fruit Duel", exact: true })
    .click();
  await page.getByRole("radio", { name: /2 Players/ }).click();
  await page.getByRole("button", { name: /Let’s play/ }).click();
  await page.waitForFunction(() => (window as any).__POCKET__.scene.ready);
  const ready = await s();
  expect(ready.swordPoses[0].x).toBe(322);
  await page.screenshot({ path: "docs/fruit-sword-rest.png" });
  await page.keyboard.press("Space");
  await expect.poll(async () => (await s()).attempts[0]).toBe(1);
  await page.waitForTimeout(300);
  const moving = await s();
  expect(moving.swordPoses[0].x).not.toBe(322);
  expect(moving.swings[0]).toBeLessThan(1);
  await page.keyboard.press("Space");
  expect((await s()).attempts[0]).toBe(1);
  await page.keyboard.press("Escape");
  const paused = await s();
  await page.waitForTimeout(200);
  expect(await s()).toEqual(paused);
  await page.getByRole("button", { name: /Keep playing/ }).click();
  await expect.poll(async () => (await s()).cooldowns[0]).toBe(0);
  expect((await s()).swordPoses[0].x).toBe(322);
  await page.screenshot({ path: "docs/fruit-sword-return.png" });
  await page.keyboard.press("Space");
  await expect.poll(async () => (await s()).attempts[0]).toBe(2);
  await expect.poll(async () => (await s()).cooldowns[0]).toBe(0);
  expect((await s()).swordPoses[0].x).toBe(322);
});
