import { test, expect } from "@playwright/test";
const snapshot = (page: any) =>
  page.evaluate(() => (window as any).__POCKET__.scene.game);
test("all solo difficulty choices launch, remain idle before selection, and clean up", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const name of [
    "Tower Stack",
    "Orbit Hop",
    "Color Switch",
    "Pocket Climber",
    "Perfect Pour",
    "Star Patrol",
  ])
    for (const tier of ["Hard", "Impossible"]) {
      await page.goto("/");
      await page
        .getByRole("button", { name: "1 Player Arcade", exact: true })
        .click();
      await page
        .getByRole("button", { name: `Play ${name}`, exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: tier, exact: true }),
      ).toBeVisible();
      const before = await snapshot(page);
      await page.waitForTimeout(130);
      expect(await snapshot(page)).toEqual(before);
      await page.getByRole("button", { name: tier, exact: true }).click();
      await expect.poll(async () => (await snapshot(page))?.started).toBe(true);
      expect((await snapshot(page)).difficulty).toBe(tier.toLowerCase());
      await page.keyboard.press("Escape");
      await page
        .getByRole("button", { name: "Back to all games", exact: true })
        .click();
      expect(await page.locator(".arcade-setup").count()).toBe(0);
    }
  expect(errors).toEqual([]);
});
test("Orbit miss resolves promptly through real launch input", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "1 Player Arcade", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Play Orbit Hop", exact: true })
    .click();
  await page.getByRole("button", { name: "Medium", exact: true }).click();
  await expect
    .poll(
      async () => Math.abs(Math.abs((await snapshot(page)).angle) - Math.PI),
      { intervals: [20], timeout: 6000 },
    )
    .toBeLessThan(0.12);
  await page.keyboard.press("Space");
  await expect
    .poll(async () => (await snapshot(page)).lives, {
      intervals: [20],
      timeout: 1500,
    })
    .toBe(2);
  await page.waitForTimeout(550);
  expect((await snapshot(page)).lives).toBe(2);
});
test("removed cards stay hidden and redesigned previews load locally", async ({
  page,
}) => {
  await page.goto("/");
  const water = page.getByRole("button", {
    name: "Play Water Guess",
    exact: true,
  });
  await water.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      water
        .locator("img")
        .evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0),
    )
    .toBe(true);
  await water.screenshot({ path: "test-results/water-guess-preview.png" });
  await page
    .getByRole("button", { name: "1 Player Arcade", exact: true })
    .click();
  for (const name of ["Ricochet", "Pocket Pinball", "Slide Escape"])
    await expect(
      page.getByRole("button", { name: `Play ${name}`, exact: true }),
    ).toHaveCount(0);
  const orbit = page.getByRole("button", {
    name: "Play Orbit Hop",
    exact: true,
  });
  await orbit.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      orbit
        .locator("img")
        .evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0),
    )
    .toBe(true);
  await orbit.screenshot({ path: "test-results/orbit-preview.png" });
});
