import { test, expect } from "@playwright/test";
const state = (p: any) =>
  p.evaluate(() => (window as any).__POCKET__.scene.game);
test("steal animation and compact Lumberjack fields remain playable", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  async function open(name: string) {
    await page.goto("/");
    await page
      .getByRole("button", { name: `Play ${name}`, exact: true })
      .click();
    await page.getByRole("radio", { name: /2 Players/ }).click();
    await page.getByRole("button", { name: /Let’s play/ }).click();
    await page.waitForFunction(() => (window as any).__POCKET__.scene.ready);
  }
  await open("Light Fingers");
  await expect
    .poll(async () => (await state(page)).phase, { timeout: 7000 })
    .toBe("active");
  await page.keyboard.press("Space");
  await expect.poll(async () => (await state(page)).capturedBy).toBe(0);
  await page.waitForTimeout(250);
  await page.screenshot({ path: "docs/light-stolen.png" });
  await page.keyboard.press("Escape");
  const paused = await state(page);
  await page.waitForTimeout(200);
  expect(await state(page)).toEqual(paused);
  await page.setViewportSize({ width: 360, height: 640 });
  await open("Lumberjack");
  await page.screenshot({ path: "docs/lumber-polish.png" });
  const b = (await page.locator("canvas").boundingBox())!;
  await page.touchscreen.tap(
    b.x + b.width * 0.25,
    b.y + (b.height * 550) / 760,
  );
  await expect.poll(async () => (await state(page)).players[0].score).toBe(1);
  await page.waitForTimeout(60);
  await page.screenshot({ path: "docs/lumber-chop.png" });
  expect(errors).toEqual([]);
});
