import { test, expect } from "@playwright/test";
test("shared gravity corridor accepts simultaneous touch flips, pauses and cleans up", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?aiSeed=77");
  await page
    .getByRole("button", { name: "Play Gravity Runner", exact: true })
    .click();
  await page.getByRole("radio", { name: /2 Players/ }).click();
  await page.getByRole("button", { name: /Let’s play/ }).click();
  await page.waitForFunction(() => (window as any).__POCKET__.scene.ready);
  const state = () =>
    page.evaluate(() => (window as any).__POCKET__.scene.game);
  expect((await state()).sharedCourse).toBe(true);
  await page.screenshot({ path: "docs/gravity-shared-start.png" });
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
  await expect
    .poll(async () => (await state()).players.map((p: any) => p.gravity))
    .toEqual([-1, -1]);
  await page.keyboard.press("Escape");
  const paused = await state();
  await page.waitForTimeout(250);
  expect(await state()).toEqual(paused);
  await page.getByRole("button", { name: /Keep playing/ }).click();
  await expect
    .poll(async () => (await state()).distance)
    .toBeGreaterThan(paused.distance + 80);
  await page.screenshot({ path: "docs/gravity-shared-run.png" });
  await page.setViewportSize({ width: 360, height: 640 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: "docs/gravity-shared-mobile.png" });
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Back to all games", exact: true })
    .click();
  expect(
    await page.evaluate(() => (window as any).__POCKET__.scene.inputListeners),
  ).toBe(0);
  expect(errors).toEqual([]);
});

test("AI and a legal following player traverse the shared obstacle course", async ({
  page,
}) => {
  await page.goto("/?aiSeed=77");
  await page
    .getByRole("button", { name: "Play Gravity Runner", exact: true })
    .click();
  await page.getByRole("radio", { name: /1 Player/ }).click();
  await page.getByRole("radio", { name: "Hard", exact: true }).click();
  await page.getByRole("button", { name: /Let’s play/ }).click();
  await page.waitForFunction(() => (window as any).__POCKET__.scene.ready);
  const state = () =>
    page.evaluate(() => (window as any).__POCKET__.scene.game);
  for (let i = 0; i < 250; i++) {
    const s = await state();
    if (s.distance > 700) break;
    if (
      s.players[0].gravity !== s.players[1].gravity &&
      s.players[0].cooldown === 0
    )
      await page.keyboard.press("Space");
    await page.waitForTimeout(25);
  }
  expect((await state()).distance).toBeGreaterThan(700);
  expect((await state()).round).toBe(1);
  await page.screenshot({ path: "docs/gravity-shared-obstacles.png" });
});
