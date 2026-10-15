import { test, expect } from "@playwright/test";
test("Car Duel holds independent touch controls, cancels on pause, and removes own listeners", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?aiSeed=77");
  await page
    .getByRole("button", { name: "Play Car Duel", exact: true })
    .click();
  await page.getByRole("radio", { name: /2 Players/ }).click();
  await page.getByRole("button", { name: /Let’s play/ }).click();
  const state = () => page.evaluate(() => (window as any).__POCKET__);
  await expect.poll(async () => (await state()).scene.ready).toBe(true);
  await expect.poll(async () => (await state()).scene.game.between).toBe(0);
  const b = (await page.locator("canvas").boundingBox())!,
    point = (id: number, x: number) => ({
      id,
      x: b.x + (x / 420) * b.width,
      y: b.y + (585 / 760) * b.height,
    });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [point(0, 155), point(1, 260)],
  });
  await page.waitForTimeout(350);
  let s = (await state()).scene.game;
  expect(s.cars[0].vx).toBeGreaterThan(10);
  expect(s.cars[1].vx).toBeLessThan(-10);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchCancel",
    touchPoints: [],
  });
  await page.keyboard.press("Escape");
  const paused = (await state()).scene.game;
  await page.waitForTimeout(300);
  expect((await state()).scene.game).toEqual(paused);
  await page.getByRole("button", { name: /Keep playing/ }).click();
  await page.screenshot({ path: "docs/car-duel-review.png" });
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Back to all games", exact: true })
    .click();
  expect((await state()).scene.inputListeners).toBe(0);
  expect(errors).toEqual([]);
});
