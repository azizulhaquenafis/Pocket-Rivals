import { test, expect, type Page } from "@playwright/test";
const game = (page: Page) =>
  page.evaluate(() => (window as any).__POCKET__.scene.game);
async function launch(page: Page) {
  await page.goto("/?aiSeed=77");
  await page
    .getByRole("button", { name: "Play Happy Birds", exact: true })
    .click();
  await page.getByRole("radio", { name: /2 Players/ }).click();
  await page.getByRole("button", { name: /Let’s play/ }).click();
  await expect
    .poll(() => page.evaluate(() => (window as any).__POCKET__.scene.ready))
    .toBe(true);
}
test("star race shows real collectibles; a hit animates gray to color through the middle with no countdown", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.clock.install();
  await launch(page);
  expect((await game(page)).goal).toBe(15);
  expect((await game(page)).stars).toHaveLength(1);
  expect((await game(page)).remaining).toBeUndefined();
  await page.clock.runFor(2200);
  let s = await game(page);
  expect(s.players[0].alive).toBe(false);
  expect(s.players[0].recovery).toBeGreaterThan(2);
  expect(s.renderState[0].saturation).toBe(0);
  const scores = s.scores;
  const serial = s.players[0].flapSerial;
  await page.keyboard.press("Space");
  expect((await game(page)).players[0].flapSerial).toBe(serial);
  await page.screenshot({ path: "docs/happy-stars-gray.png" });
  await page.keyboard.press("Escape");
  const paused = await game(page);
  await page.clock.runFor(1500);
  expect(await game(page)).toEqual(paused);
  await page.getByRole("button", { name: /Keep playing/ }).click();
  await page.clock.runFor(1550);
  s = await game(page);
  expect(s.players[0].recovery).toBeGreaterThan(0);
  expect(s.renderState[0].saturation).toBeGreaterThan(0);
  expect(s.renderState[0].saturation).toBeLessThan(1);
  expect(Math.abs(s.players[0].x - 140)).toBeLessThan(15);
  expect(s.scores).toEqual(scores);
  await page.screenshot({ path: "docs/happy-stars-return.png" });
  await page.clock.runFor(1200);
  s = await game(page);
  expect(s.players[0].alive).toBe(true);
  expect(s.players[0].recovery).toBe(0);
  expect(s.renderState[0].saturation).toBe(1);
  await page.screenshot({ path: "docs/happy-stars-flying.png" });
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Back to all games", exact: true })
    .click();
  expect(
    await page.evaluate(() => (window as any).__POCKET__.scene.inputListeners),
  ).toBe(0);
  expect(errors).toEqual([]);
});
