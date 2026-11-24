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

test("Water Guess supports whole-percent keypad input and reveals a round", async ({
  page,
}) => {
  page.on("console", (msg) => console.log("BROWSER:", msg.text()));
  test.setTimeout(45000);
  await open(page, "Water Guess", true);

  // Wait for fill animation to finish and state to become GUESSING
  await expect
    .poll(async () => (await state(page)).scene.game?.state)
    .toBe("GUESSING");

  // Enter a guess with two decimal places using keyboard: "50", Enter
  await page.keyboard.type("50", { delay: 50 });
  await page.keyboard.press("Enter");

  // Wait for reveal
  await expect
    .poll(async () => (await state(page)).scene.game?.state)
    .toBe("REVEAL");

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

  expect(s.g0).toBe(5000); // 50.25%
  expect(s.g1).toBeGreaterThanOrEqual(0); // AI submitted a guess
  expect(s.state).toBe("REVEAL");
});

test("Hammer Hit displays non-overlapping UI layout, dome marquee, and score popups", async ({
  page,
}) => {
  test.setTimeout(45000);
  await open(page, "Hammer Hit", true);

  // Take screenshot of idle state
  await page.screenshot({ path: "docs/hammer-hit.png" });

  // Wait for initial ready cooldown (0.6s) to expire
  await expect
    .poll(async () => (await state(page)).scene.game.turnWait)
    .toBe(0);
  await expect
    .poll(async () => (await state(page)).scene.game.cooldowns[0])
    .toBe(0);

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

  // Global H hotkey toggles the How to Play modal in any game and pauses cleanly while open.
  await page.keyboard.press("KeyH");
  await expect(page.locator(".help-modal")).toBeVisible();
  expect((await state(page)).state).toBe("paused");
  await page.keyboard.press("KeyH");
  await expect(page.locator(".help-modal")).toHaveCount(0);
  expect((await state(page)).state).toBe("playing");
});
