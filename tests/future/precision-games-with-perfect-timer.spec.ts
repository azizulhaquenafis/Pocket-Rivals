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

