import { test, expect, type Page } from "@playwright/test";
const state = (p: Page) =>
  p.evaluate(() => (window as any).__POCKET__.scene.game);
async function launch(p: Page, name: string, ai = false) {
  await p.goto("/");
  await p.getByRole("button", { name: `Play ${name}`, exact: true }).click();
  await p.getByRole("radio", { name: ai ? /1 Player/ : /2 Players/ }).click();
  await p.getByRole("button", { name: /Let’s play/ }).click();
  await expect
    .poll(() => p.evaluate(() => (window as any).__POCKET__.scene.ready))
    .toBe(true);
  await p.waitForTimeout(300);
}
test("Perfect Timer excludes pauses, locks stops, advances once and cleans up", async ({
  page,
}) => {
  await launch(page, "Perfect Timer");
  await page.keyboard.press("Space");
  await page.keyboard.press("Enter");
  await expect.poll(async () => (await state(page)).state).toBe("TIMING");
  await page.waitForTimeout(300);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("heading", { name: "A little timeout?" }),
  ).toBeVisible();
  await page.waitForTimeout(2400);
  await page.getByRole("button", { name: /Keep playing/ }).click();
  await page.keyboard.press("Space");
  await page.keyboard.press("Enter");
  let s = await state(page);
  expect(s.state).toBe("REVEAL");
  expect(s.match.stops[0]).toBeLessThan(200);
  expect(s.match.history).toHaveLength(1);
  await page.keyboard.press("Space");
  expect((await state(page)).match.history).toHaveLength(1);
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Back to all games", exact: true })
    .click();
  expect(
    await page.evaluate(() => (window as any).__POCKET__.scene.inputListeners),
  ).toBe(0);
});
