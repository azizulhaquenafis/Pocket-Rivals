import { test, expect } from "@playwright/test";
test("five deferred games are absent while Paper Glider remains playable with guide, levels, hearts and wind", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "1 Player Arcade", exact: true })
    .click();
  for (const name of [
    "Pocket Drift",
    "Magnet Dash",
    "Tiny Foundry",
    "Shadow Step",
    "Domino Lab",
  ])
    await expect(
      page.getByRole("button", { name: `Play ${name}`, exact: true }),
    ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Play Paper Glider", exact: true })
    .click();
  const guideSummary = page.locator(".arcade-instructions summary");
  await expect(guideSummary).toContainText(/How to play/i);
  await guideSummary.click();
  await expect(page.locator(".arcade-guide li")).toHaveCount(4);
  await expect(page.locator(".arcade-guide")).toContainText("Red Dotted Line");
  await page.getByRole("button", { name: "Medium", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() => (window as any).__POCKET__.scene.game?.started),
    )
    .toBe(true);
  const state = await page.evaluate(() => (window as any).__POCKET__.scene.game);
  expect(state.level).toBe(1);
  expect(state.lives).toBe(3);
  expect(typeof state.windRatio).toBe("number");
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Back to all games", exact: true })
    .click();
  expect(
    await page.evaluate(() => (window as any).__POCKET__.scene.inputListeners),
  ).toBe(0);
});
