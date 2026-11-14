import { expect, test, type Page } from "@playwright/test";
const state = (page: Page) => page.evaluate(() => (window as any).__POCKET__);

for (const variant of ["Basic Arithmetic", "University Challenge"]) {
  test(`${variant}: Impossible is quick, correct, pause-safe, and cleans up`, async ({
    page,
  }) => {
    test.setTimeout(60000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/?diagnostics&aiSeed=42");
    await page
      .getByRole("button", { name: "Play Math Quiz", exact: true })
      .click();
    await page.getByRole("button", { name: variant, exact: true }).click();
    await page.getByRole("radio", { name: /1 Player/ }).click();
    await page.getByRole("radio", { name: "Impossible", exact: true }).click();
    await page.getByRole("button", { name: /Let’s play/ }).click();
    await expect.poll(async () => (await state(page)).scene.ready).toBe(true);
    await expect
      .poll(async () => (await state(page)).scene.game.scores[1], {
        timeout: 2500,
      })
      .toBe(1);
    const first = (await state(page)).scene.game;
    expect(first.scores[0]).toBe(0);
    expect(first.time).toBeLessThan(2);
    expect(first.ai.seed).toBe(42);
    expect(first.ai.accuracy).toBe(1);
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("heading", { name: "A little timeout?" }),
    ).toBeVisible();
    const paused = (await state(page)).scene.game;
    await page.waitForTimeout(400);
    expect((await state(page)).scene.game).toEqual(paused);
    await page.getByRole("button", { name: /Keep playing/ }).click();
    await expect
      .poll(async () => (await state(page)).scene.game?.winner, {
        timeout: 35000,
      })
      .toBe(2);
    expect((await state(page)).scene.game.scores).toEqual([0, 10]);
    await expect(
      page.getByRole("button", { name: "Rematch", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Back to all games", exact: true })
      .click();
    expect((await state(page)).scene.inputListeners).toBe(0);
    expect(await page.locator(".quiz-overlay").count()).toBe(0);
    expect(errors).toEqual([]);
  });
}
