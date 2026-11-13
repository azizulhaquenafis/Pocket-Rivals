import { test, expect, type Page } from "@playwright/test";
async function launch(page: Page, name: string) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "1 Player Arcade", exact: true })
    .click();
  await page.getByRole("button", { name: `Play ${name}`, exact: true }).click();
  await page.getByRole("button", { name: "Medium", exact: true }).click();
  await page.waitForFunction(() => (window as any).__POCKET__.scene.ready);
}
const state = (page: Page) =>
  page.evaluate(() => (window as any).__POCKET__.scene.game);
async function point(page: Page, x: number, y: number) {
  const b = (await page.locator("canvas").boundingBox())!;
  return { x: b.x + (x * b.width) / 420, y: b.y + (y * b.height) / 760 };
}
test("Perfect Pour: real hold/release completes ten vessels and records a score", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.clock.install();
  await launch(page, "Perfect Pour");
  for (let round = 1; round <= 10; round++) {
    const w = await state(page);
    expect(w.round).toBe(round);
    const duration = w.target * (3.1 + (round % 3) * 0.35) * 1000;
    await page.keyboard.down("Space");
    await page.clock.runFor(duration);
    await page.keyboard.up("Space");
    await page.clock.runFor(700);
    expect((await state(page)).rating).toBeGreaterThanOrEqual(90);
    await page.clock.runFor(1600);
  }
  await page.clock.runFor(1000);
  await expect(
    page.getByRole("button", { name: "Play again →" }),
  ).toBeVisible();
  expect((await state(page)).score).toBeGreaterThanOrEqual(900);
});
test("Tower Stack: a real miss ends the run, and restart resets it", async ({
  page,
}) => {
  await launch(page, "Tower Stack");
  await page.keyboard.press("Space"); // First off-center block trims the tower.
  for (let i = 0; i < 10 && !(await state(page)).done; i++) {
    await page.waitForTimeout(200);
    await page.keyboard.press("Space");
  }
  await expect(
    page.getByRole("button", { name: "Play again →" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Play again →" }).click();
  await page.getByRole("button", { name: "Medium", exact: true }).click();
  await expect.poll(async () => (await state(page))?.score).toBe(0);
});
