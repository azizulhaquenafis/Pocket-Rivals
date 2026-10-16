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
test("Archery Duel uses three input stages and AI scores real impacts", async ({
  page,
}) => {
  await open(page, "Archery Duel");
  await page.keyboard.press("Space");
  expect((await snap(page)).scene.game.players[0].stage).toBe("horizontal");
  await page.waitForTimeout(180);
  await page.keyboard.press("Space");
  expect((await snap(page)).scene.game.players[0].stage).toBe("vertical");
  await page.waitForTimeout(180);
  await page.keyboard.press("Space");
  expect((await snap(page)).scene.game.players[0].stage).toBe("flight");
  await expect
    .poll(async () => (await snap(page)).scene.game.players[1].score, {
      timeout: 10000,
    })
    .toBeGreaterThan(0);
  await page.screenshot({ path: "docs/archery-duel-review.png" });
});
