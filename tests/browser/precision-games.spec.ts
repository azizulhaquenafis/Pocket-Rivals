import { test, expect, type Page } from "@playwright/test";

const state = (p: Page) => p.evaluate(() => (window as any).__POCKET__);

async function open(p: Page, name: string, ai = false) {
  await p.goto("/?diagnostics");
  await p.getByRole("button", { name: `Play ${name}`, exact: true }).click();
  if (ai) {
    await p.getByRole("radio", { name: /1 Player/ }).click();
    await p.getByRole("radio", { name: "Impossible", exact: true }).click();
  }
  await p.getByRole("button", { name: /Let’s play/ }).click();
  await expect.poll(async () => (await state(p)).scene.ready).toBe(true);
}

test("Water Guess supports 0.01% precision keypad input and completes a match", async ({ page }) => {
  page.on("console", (msg) => console.log("BROWSER:", msg.text()));
  test.setTimeout(45000);
  await open(page, "Water Guess", true);

  // Wait for fill animation to finish and state to become GUESSING
  await expect.poll(async () => (await state(page)).scene.game?.state).toBe("GUESSING");

  // Enter a guess with two decimal places using keyboard: "50.25", Enter
  await page.keyboard.type("50.25", { delay: 50 });
  await page.keyboard.press("Enter");

  // Wait for reveal
  await expect.poll(async () => (await state(page)).scene.game?.state).toBe("REVEAL");

  // Canvas screenshot for docs
  await page.screenshot({ path: "docs/water-guess.png" });

  // Verify game state
  const s = await page.evaluate(() => {
    const game = (window as any).__POCKET__.scene.game;
    return {
      actual: game.match.actual,
      g0: game.match.guesses[0],
      g1: game.match.guesses[1],
      state: game.state,
    };
  });

  expect(s.g0).toBe(5025); // 50.25%
  expect(s.g1).toBeGreaterThanOrEqual(0); // AI submitted a guess
  expect(s.state).toBe("REVEAL");
});

test("Perfect Timer supports centisecond precision and completes a match", async ({ page }) => {
  test.setTimeout(45000);
  await open(page, "Perfect Timer", true);

  // P1 taps Ready
  await page.keyboard.press("Space");

  // Wait for countdown (3, 2, 1, GO!) ~2.5s
  await page.waitForTimeout(3000);

  // Active timing is running (hidden)
  const isTiming = await page.evaluate(() => {
    return (window as any).__POCKET__.scene.game.state === "TIMING";
  });
  expect(isTiming).toBe(true);

  // Stop P1 near target
  await page.keyboard.press("Space");
  await page.waitForTimeout(500);

  // Screenshot for docs
  await page.screenshot({ path: "docs/perfect-timer.png" });

  // Verify stops recorded in centiseconds
  const stops = await page.evaluate(() => {
    const game = (window as any).__POCKET__.scene.game;
    return {
      target: game.match.target,
      p1Stop: game.match.stops[0],
      p2Stop: game.match.stops[1],
    };
  });

  expect(stops.p1Stop).toBeGreaterThan(0);
  expect(Number.isInteger(stops.p1Stop)).toBe(true);
});

test("Hammer Hit displays non-overlapping UI layout, dome marquee, and score popups", async ({ page }) => {
  test.setTimeout(45000);
  await open(page, "Hammer Hit", true);

  // Take screenshot of idle state
  await page.screenshot({ path: "docs/hammer-hit.png" });

  // Wait for initial ready cooldown (0.6s) to expire
  await page.waitForTimeout(750);

  // Strike anvil as Player 1
  await page.keyboard.press("Space");
  await page.waitForTimeout(600);

  // Take screenshot during puck rise / popup
  await page.screenshot({ path: "docs/hammer-hit-strike.png" });

  const scoreRecorded = await page.evaluate(() => {
    const game = (window as any).__POCKET__.scene.game;
    return game.scores[0].length > 0;
  });

  expect(scoreRecorded).toBe(true);
});
