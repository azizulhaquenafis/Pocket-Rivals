import { test, expect, type Page } from "@playwright/test";
const snap = (p: Page) => p.evaluate(() => (window as any).__POCKET__);
async function open(p: Page, name: string) {
  await p.goto("/?aiSeed=77");
  await p.getByRole("button", { name: `Play ${name}`, exact: true }).click();
  await p.getByRole("radio", { name: /1 Player/ }).click();
  await p.getByRole("radio", { name: "Impossible", exact: true }).click();
  await p.getByRole("button", { name: /Let’s play/ }).click();
  await expect.poll(async () => (await snap(p)).scene.ready).toBe(true);
  await p.waitForTimeout(250);
}
test("Gravity Runner flips via touch, scores survival and pauses cleanly", async ({
  page,
}) => {
  await open(page, "Gravity Runner");
  const b = (await page.locator("canvas").boundingBox())!;
  await page.touchscreen.tap(b.x + b.width * 0.5, b.y + (b.height * 550) / 760);
  expect((await snap(page)).scene.game.players[0].gravity).toBe(-1);
  await expect
    .poll(async () => (await snap(page)).scene.game.scores[1], {
      timeout: 16000,
    })
    .toBeGreaterThan(0);
  await page.keyboard.press("Escape");
  const s = (await snap(page)).scene.game;
  await page.waitForTimeout(250);
  expect((await snap(page)).scene.game).toEqual(s);
  await page.getByRole("button", { name: /Keep playing/ }).click();
  await page.screenshot({ path: "docs/gravity-runner-review.png" });
});
test("Happy Birds flaps through touch input and finishes a real star race", async ({
  page,
}) => {
  await page.clock.install();
  await open(page, "Happy Birds");
  await page.clock.runFor(1200);
  await expect.poll(async () => (await snap(page)).scene.game.between).toBe(0);
  const b = (await page.locator("canvas").boundingBox())!;
  await page.touchscreen.tap(b.x + b.width * 0.5, b.y + (b.height * 550) / 760);
  expect((await snap(page)).scene.game.players[0].vy).toBeLessThan(0);
  await page.screenshot({ path: "docs/happy-birds-review.png" });
  for (let i = 0; i < 120 && !(await snap(page)).scene.game.winner; i++)
    await page.clock.runFor(1000);
  await page.clock.runFor(1000);
  await expect(page.getByRole("button", { name: /Rematch/ })).toBeVisible();
  expect((await snap(page)).scene.game.scores[1]).toBe(15);
});
test("Spike Attacks supports movement, real cover and simultaneous scene cleanup", async ({
  page,
}) => {
  await open(page, "Spike Attacks");
  await page.keyboard.down("KeyA");
  await page.waitForTimeout(300);
  await page.keyboard.up("KeyA");
  expect((await snap(page)).scene.game.players[0].x).toBeLessThan(160);
  await expect
    .poll(async () => (await snap(page)).scene.game.scores[1], {
      timeout: 18000,
    })
    .toBeGreaterThan(0);
  await page.screenshot({ path: "docs/spike-attacks-review.png" });
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Back to all games", exact: true })
    .click();
  expect((await snap(page)).scene.inputListeners).toBe(0);
});
