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
test("Flappy Jump releases a physical ball and AI sinks a basket", async ({
  page,
}) => {
  await open(page, "Flappy Jump");
  await page.keyboard.press("Space");
  expect((await snap(page)).scene.game.players[0].jumping).toBe(true);
  await expect
    .poll(async () => (await snap(page)).scene.game.players[0].ball)
    .toBeTruthy();
  await expect
    .poll(async () => (await snap(page)).scene.game.players[1].score, {
      timeout: 14000,
    })
    .toBeGreaterThan(0);
  await page.screenshot({ path: "docs/flappy-jump-review.png" });
});
