import { test, expect, type Page } from "@playwright/test";
const snap = (p: Page) => p.evaluate(() => (window as any).__POCKET__);
async function open(p: Page, name: string) {
  await p.goto("/?aiSeed=77");
  await p.getByRole("button", { name: `Play ${name}`, exact: true }).click();
  await p.getByRole("radio", { name: /1 Player/ }).click();
  await p.getByRole("radio", { name: "Impossible", exact: true }).click();
  await p.getByRole("button", { name: /Let’s play/ }).click();
  await expect.poll(async () => (await snap(p)).scene.ready).toBe(true);
  await p.waitForTimeout(250);
}
test("Chicken Jump accepts independent controls, animates legal landings, pauses and exits", async ({
  page,
}) => {
  await open(page, "Chicken Jump");
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await expect
    .poll(async () => (await snap(page)).scene.game.players[1].score, {
      timeout: 12000,
    })
    .toBeGreaterThanOrEqual(2);
  await page.keyboard.press("Space");
  expect((await snap(page)).scene.game.players[0].phase).toBe("jumping");
  await page.keyboard.press("Escape");
  const before = (await snap(page)).scene.game;
  await page.waitForTimeout(350);
  expect((await snap(page)).scene.game).toEqual(before);
  await page.getByRole("button", { name: /Keep playing/ }).click();
  await page.screenshot({ path: "docs/chicken-jump-review.png" });
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Back to all games", exact: true })
    .click();
  expect((await snap(page)).scene.inputListeners).toBe(0);
  expect(errors).toEqual([]);
});
