import { test, expect, type Page } from "@playwright/test";
const state = (p: Page) => p.evaluate(() => (window as any).__POCKET__);
async function tap(p: Page, x: number, y: number) {
  const b = (await p.locator("canvas").boundingBox())!;
  await p.touchscreen.tap(
    b.x + (x / 420) * b.width,
    b.y + (y / 760) * b.height,
  );
}
test("Hammer local field faces each player while host navigation remains fixed", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Play Hammer Hit", exact: true })
    .click();
  await page.getByRole("radio", { name: /2 Players/ }).click();
  await page.getByRole("button", { name: /Let’s play/ }).click();
  await expect
    .poll(async () => (await state(page)).scene.game?.cooldowns[0])
    .toBe(0);
  await page.screenshot({ path: "docs/hammer-clean-orange.png" });
  await tap(page, 210, 550);
  await expect
    .poll(async () => (await state(page)).scene.game.rotation)
    .toBe(Math.PI);
  await expect
    .poll(async () => (await state(page)).scene.game.turnWait)
    .toBe(0);
  await page.screenshot({ path: "docs/hammer-clean-blue.png" });
  await tap(page, 210, 762 - 550);
  await expect
    .poll(async () => (await state(page)).scene.game.scores[1].length)
    .toBe(1);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("heading", { name: "A little timeout?" }),
  ).toBeVisible();
});
test("new games enter tournaments automatically and a real new-game round crowns its winner", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Tournament", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /1 Player/ })
    .click();
  await page.getByRole("radio", { name: "Impossible", exact: true }).click();
  await page.getByLabel("Number of rounds").selectOption("1");
  await page.getByRole("button", { name: "Choose games" }).click();
  for (const name of [
    "Chicken Jump",
    "Archery Duel",
    "Gravity Runner",
    "Happy Birds",
    "Spike Attacks",
    "Flappy Jump",
    "Car Duel",
  ])
    await expect(
      page.getByRole("checkbox", { name: `○ ${name}`, exact: true }),
    ).toBeVisible();
  await page
    .getByRole("checkbox", { name: "○ Happy Birds", exact: true })
    .click();
  await page.getByRole("button", { name: "Start tournament →" }).click();
  await page.getByRole("button", { name: "Play next round →" }).click();
  await expect
    .poll(async () => (await state(page)).tournament.points[1], {
      timeout: 18000,
    })
    .toBe(1);
  expect((await state(page)).tournament.points).toEqual([0, 1]);
});
