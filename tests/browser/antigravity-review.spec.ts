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

test("Water Guess accepts integer keypad and completes a five-round local match", async ({
  page,
}) => {
  await launch(page, "Water Guess");
  for (let round = 1; round <= 5; round++) {
    await expect.poll(async () => (await state(page)).state).toBe("GUESSING");
    const s = await state(page),
      actual = (s.match.actual / 100).toFixed(0);
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
  await tap(420 - 132, 762 - 541);
  expect((await state(page)).inputBuffer).toBe("12");
  await page.screenshot({ path: "docs/water-clean-blue.png" });
  await tap(420 - 286, 762 - 621);
  await expect.poll(async () => (await state(page)).state).toBe("REVEAL");
  expect((await state(page)).match.guesses[1]).toBe(1200);
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
