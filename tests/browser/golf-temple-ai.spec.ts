import { test, expect } from "@playwright/test";

test("Ultimate Golf exposes 1 Player Casual and 2 Players (no AI mode) and launches Lost Temple cleanly", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Play Ultimate Golf", exact: true })
    .click();
  await expect(page.getByRole("button", { name: /1 Player vs AI/ })).toHaveCount(
    0,
  );
  await expect(page.locator(".golf-mode")).toHaveCount(2);
  await page.getByRole("button", { name: /1 Player Casual/ }).click();
  await page.getByRole("button", { name: /Lost Temple/ }).click();
  await expect
    .poll(() =>
      page.evaluate(() => (window as any).__POCKET__.scene.game.course),
    )
    .toBe("temple");
  await page.getByRole("button", { name: "Golf help", exact: true }).click();
  await expect(page.locator(".golf-legend-item")).toHaveCount(6);
  await page.getByRole("button", { name: "Back to play", exact: true }).click();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Back to all games", exact: true })
    .click();
  expect(errors).toEqual([]);
});
