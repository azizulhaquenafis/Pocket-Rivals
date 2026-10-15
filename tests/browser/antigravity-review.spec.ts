import { test, expect, type Page } from "@playwright/test";
const state = (p: Page) =>
  p.evaluate(() => (window as any).__POCKET__.scene.game);
async function launch(p: Page, name: string, ai = false) {
  await p.goto("/");
  await p.getByRole("button", { name: `Play ${name}`, exact: true }).click();
  await p.getByRole("radio", { name: ai ? /1 Player/ : /2 Players/ }).click();
  await p.getByRole("button", { name: /Let’s play/ }).click();
  await expect
    .poll(() => p.evaluate(() => (window as any).__POCKET__.scene.ready))
    .toBe(true);
  await p.waitForTimeout(300);
}
test("Perfect Timer excludes pauses, locks stops, advances once and cleans up", async ({
  page,
}) => {
  await launch(page, "Perfect Timer");
  await page.keyboard.press("Space");
  await page.keyboard.press("Enter");
  await expect.poll(async () => (await state(page)).state).toBe("TIMING");
  await page.waitForTimeout(300);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("heading", { name: "A little timeout?" }),
  ).toBeVisible();
  await page.waitForTimeout(2400);
  await page.getByRole("button", { name: /Keep playing/ }).click();
  await page.keyboard.press("Space");
  await page.keyboard.press("Enter");
  let s = await state(page);
  expect(s.state).toBe("REVEAL");
  expect(s.match.stops[0]).toBeLessThan(200);
  expect(s.match.history).toHaveLength(1);
  await page.keyboard.press("Space");
  expect((await state(page)).match.history).toHaveLength(1);
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Back to all games", exact: true })
    .click();
  expect(
    await page.evaluate(() => (window as any).__POCKET__.scene.inputListeners),
  ).toBe(0);
});
test("Water Guess accepts decimal keypad and completes a five-round local match", async ({
  page,
}) => {
  await launch(page, "Water Guess");
  for (let round = 1; round <= 5; round++) {
    await expect.poll(async () => (await state(page)).state).toBe("GUESSING");
    const s = await state(page),
      actual = (s.match.actual / 100).toFixed(2);
    // Orange guesses exactly; Blue guesses zero. First player alternates each round.
    for (const value of round % 2 ? [actual, "0"] : ["0", actual]) {
      await expect.poll(async () => (await state(page)).turning).toBe(false);
      for (const c of value) {
        await page.keyboard.press(c === "." ? "NumpadDecimal" : `Digit${c}`);
        await page.waitForTimeout(40);
      }
      await page.keyboard.press("Enter");
    }
    await expect.poll(async () => (await state(page)).state).toBe("REVEAL");
    expect((await state(page)).match.scores).toEqual([round, 0]);
    await page.waitForTimeout(850);
    await page.keyboard.press("Enter");
  }
  await expect(page.getByRole("button", { name: /Rematch/ })).toBeVisible();
});
test("Water Guess rotates the real keypad and delays AI guesses", async ({
  page,
}) => {
  await launch(page, "Water Guess");
  await expect.poll(async () => (await state(page)).state).toBe("GUESSING");
  await page.keyboard.type("50", { delay: 60 });
  await page.keyboard.press("Enter");
  await expect.poll(async () => (await state(page)).turning).toBe(false);
  expect((await state(page)).rotation).toBe(Math.PI);
  const b = (await page.locator("canvas").boundingBox())!;
  const tap = async (x: number, y: number) =>
    page.touchscreen.tap(b.x + (x / 420) * b.width, b.y + (y / 760) * b.height);
  // Inverted 1, decimal, 2 and confirm buttons.
  await tap(420 - 60, 762 - 541);
  await tap(420 - 60, 762 - 621);
  await tap(420 - 132, 762 - 541);
  expect((await state(page)).inputBuffer).toBe("1.2");
  await page.screenshot({ path: "docs/water-clean-blue.png" });
  await tap(420 - 286, 762 - 621);
  await expect.poll(async () => (await state(page)).state).toBe("REVEAL");
  expect((await state(page)).match.guesses[1]).toBe(120);
  await launch(page, "Water Guess", true);
  await expect.poll(async () => (await state(page)).state).toBe("GUESSING");
  expect((await state(page)).match.guesses[1]).toBeNull();
  await page.waitForTimeout(350);
  expect((await state(page)).match.guesses[1]).toBeNull();
  await page.screenshot({ path: "docs/water-clean-orange.png" });
  await expect
    .poll(async () => (await state(page)).match.guesses[1])
    .not.toBeNull();
});
