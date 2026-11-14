import { test, expect, type Page } from "@playwright/test";

const state = (page: Page) =>
  page.evaluate(() => (window as any).__POCKET__.scene.game);

async function open(page: Page, ai = false) {
  await page.goto("/?aiSeed=77");
  await page
    .getByRole("button", { name: "Play Water Guess", exact: true })
    .click();
  await page
    .getByRole("radio", { name: ai ? /1 Player/ : /2 Players/ })
    .click();
  await page.getByRole("button", { name: /Let’s play/ }).click();
  await expect.poll(async () => (await state(page))?.keypadEnabled).toBe(true);
}

async function guess(page: Page, value: number) {
  await expect.poll(async () => (await state(page)).keypadEnabled).toBe(true);
  await page.keyboard.type(String(value), { delay: 20 });
  await page.keyboard.press("Enter");
}

async function round(page: Page, winner: 1 | 2 | "draw", rotation: number) {
  const initial = await state(page);
  const actual = initial.match.actual / 100;
  const values =
    winner === "draw"
      ? [actual - 1, actual + 1]
      : winner === 1
        ? [actual, 0]
        : [0, actual];
  for (const player of [initial.activeGuesser, 1 - initial.activeGuesser])
    await guess(page, values[player]);
  await expect.poll(async () => (await state(page)).state).toBe("REVEAL");
  await expect.poll(async () => (await state(page)).turning).toBe(false);
  const result = await state(page);
  expect(result.roundWinner).toBe(winner);
  expect(result.rotation).toBe(rotation);
  expect(result.keypadEnabled).toBe(false);
  await expect
    .poll(async () => (await state(page)).revealAge)
    .toBeGreaterThan(0.85);
  // Continuing is intentional: stray number presses must not skip the result.
  await page.keyboard.press("Digit9");
  expect((await state(page)).state).toBe("REVEAL");
}

test("Water local mobile reveals face the winner and tie preserves the reader", async ({
  page,
}) => {
  await open(page);
  await round(page, 2, Math.PI);
  await page.screenshot({ path: "/tmp/water-local-blue-reveal.png" });
  await page.keyboard.press("Enter");
  await round(page, 1, 0);
  await page.keyboard.press("Enter");
  await round(page, "draw", Math.PI);
  await page.keyboard.press("Enter");
  await expect.poll(async () => (await state(page)).keypadEnabled).toBe(true);
  expect((await state(page)).activeGuesser).toBe(1);
  await page.screenshot({ path: "/tmp/water-local-blue-keypad.png" });
});

test("Water local desktop keeps both players and results upright", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 1100, height: 900 },
    hasTouch: false,
  });
  const page = await context.newPage();
  try {
    await open(page);
    await round(page, 2, 0);
    await page.keyboard.press("Enter");
    await expect.poll(async () => (await state(page)).keypadEnabled).toBe(true);
    expect((await state(page)).activeGuesser).toBe(1);
    expect((await state(page)).rotation).toBe(0);
  } finally {
    await context.close();
  }
});

test("Water AI wait disables the submitted keypad until the round reveals", async ({
  page,
}) => {
  await open(page, true);
  await guess(page, 0);
  const submitted = await state(page);
  expect(submitted.match.guesses).toEqual([0, null]);
  expect(submitted.keypadEnabled).toBe(false);
  await page.keyboard.type("51");
  await page.keyboard.press("Enter");
  expect((await state(page)).inputBuffer).toBe("");
  await expect.poll(async () => (await state(page)).state).toBe("REVEAL");
  expect((await state(page)).rotation).toBe(0);
});
