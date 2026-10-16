import { test, expect, type Page } from "@playwright/test";
const snap = (p: Page) => p.evaluate(() => (window as any).__POCKET__);
async function open(p: Page, name: string) {
  await p.goto("/?aiSeed=77");
  await p.getByRole("button", { name: `Play ${name}`, exact: true }).click();
  await p.getByRole("radio", { name: /2 Players/ }).click();
  await p.getByRole("button", { name: /Let’s play/ }).click();
  await expect.poll(async () => (await snap(p)).scene.ready).toBe(true);
}
test("deferred games stay off the menu; active games still launch", async ({
  page,
}) => {
  await page.goto("/");
  for (const name of [
    "Flappy Jump",
    "Car Duel",
    "Archery Duel",
    "Chicken Jump",
  ])
    await expect(
      page.getByRole("button", { name: `Play ${name}`, exact: true }),
    ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Play Happy Birds", exact: true }),
  ).toBeVisible();
});
test("Happy Birds has no timed ending and freezes recovery while paused", async ({
  page,
}) => {
  await page.clock.install();
  await open(page, "Happy Birds");
  await page.clock.runFor(2300);
  await expect
    .poll(async () => (await snap(page)).scene.game.players[0].recovery)
    .toBeGreaterThan(0);
  await page.keyboard.press("Escape");
  const paused = (await snap(page)).scene.game;
  await page.clock.fastForward(30000);
  expect((await snap(page)).scene.game).toEqual(paused);
  expect(paused.remaining).toBeUndefined();
  await page.getByRole("button", { name: /Keep playing/ }).click();
  await page.clock.runFor(3200);
  expect((await snap(page)).scene.game.goal).toBe(15);
});
test("Happy Birds shares a single arena, accepts both touch flaps and disposes on exit", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.clock.install();
  await open(page, "Happy Birds");
  await page.clock.runFor(1120);
  await expect.poll(async () => (await snap(page)).scene.game.between).toBe(0);
  const b = (await page.locator("canvas").boundingBox())!,
    cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { id: 1, x: b.x + b.width * 0.4, y: b.y + (b.height * 500) / 760 },
      { id: 2, x: b.x + b.width * 0.6, y: b.y + (b.height * 250) / 760 },
    ],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await cdp.detach();
  await page.clock.runFor(16);
  const s = (await snap(page)).scene.game;
  expect(s.sharedArena).toBe(true);
  expect(s.players.every((p: any) => p.flapSerial === 1)).toBe(true);
  await page.screenshot({ path: "docs/happy-birds-shared.png" });
  await page.keyboard.press("Escape");
  const paused = (await snap(page)).scene.game;
  await page.waitForTimeout(250);
  expect((await snap(page)).scene.game).toEqual(paused);
  await page.getByRole("button", { name: /Keep playing/ }).click();
  await page.setViewportSize({ width: 360, height: 640 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: "docs/happy-birds-mobile.png" });
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Back to all games", exact: true })
    .click();
  expect((await snap(page)).scene.inputListeners).toBe(0);
  expect(errors).toEqual([]);
});
