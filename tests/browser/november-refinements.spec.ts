import { test, expect, type Page } from "@playwright/test";
test.setTimeout(60000);
const game = (p: Page) =>
  p.evaluate(() => (window as any).__POCKET__.scene.game);
async function open(p: Page, name: string, variant?: string) {
  await p.goto("/?aiSeed=77");
  await p.getByRole("button", { name: `Play ${name}`, exact: true }).click();
  if (variant)
    await p.getByRole("button", { name: new RegExp(variant) }).click();
  await p.getByRole("button", { name: /Let’s play/ }).click();
  await p.waitForFunction(() => (window as any).__POCKET__.scene.ready);
  await expect(p.locator(".game-transition")).toBeHidden();
}
test("Penfight deadline advances while aiming and excludes pause; Perfect Timer is deferred", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Play Perfect Timer", exact: true }),
  ).toHaveCount(0);
  await open(page, "Penfight");
  await page.clock.install();
  await page.clock.runFor(1000);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: /Keep playing/ }),
  ).toBeVisible();
  const before = (await game(page)).remaining;
  await page.clock.fastForward(30000);
  expect((await game(page)).remaining).toBe(before);
  await page.getByRole("button", { name: /Keep playing/ }).click();
  await page.clock.fastForward(121000);
  await page.clock.runFor(1200);
  await expect(
    page.getByRole("button", { name: "Rematch", exact: true }),
  ).toBeVisible();
  expect((await game(page)).winner).toBe("draw");
});
test("Water Guess refuses occupied guesses and shows a minimal winner-colored reveal", async ({
  page,
}) => {
  await open(page, "Water Guess");
  await expect.poll(async () => (await game(page)).state).toBe("GUESSING");
  await page.keyboard.type("50", { delay: 60 });
  await page.keyboard.press("Enter");
  await expect.poll(async () => (await game(page)).activeGuesser).toBe(1);
  await expect.poll(async () => (await game(page)).turning).toBe(false);
  await page.keyboard.type("50", { delay: 60 });
  await page.keyboard.press("Enter");
  expect((await game(page)).match.guesses).toEqual([5000, null]);
  await page.keyboard.type("51", { delay: 60 });
  await page.keyboard.press("Enter");
  await expect.poll(async () => (await game(page)).state).toBe("REVEAL");
  expect((await game(page)).match.guesses).toEqual([5000, 5100]);
  await page.waitForTimeout(350);
  await page.screenshot({ path: "docs/water-integer-reveal.png" });
});
test("Lumberjack completes a real 100-chop race with no idle deaths", async ({
  page,
}) => {
  test.setTimeout(120000);
  await open(page, "Lumberjack");
  await page.waitForTimeout(2100);
  expect((await game(page)).players.every((p: any) => p.alive)).toBe(true);
  await page.screenshot({ path: "docs/lumber-race.png" });
  const patterns = await page.evaluate(async () => {
    const {branches} = await import("/src/games/lumberjack/Rules.ts" as string);
    return branches((window as any).__POCKET__.scene.game.seed);
  });
  for (let i = 0; i < 100; i++) {
    const left = patterns[i] !== -1 && patterns[i + 1] !== -1;
    await page.keyboard.press(left ? "KeyA" : "KeyD");
    await expect
      .poll(async () => (await game(page)).players[0].score)
      .toBe(i + 1);
    await page.waitForTimeout(95);
  }
  await expect(
    page.getByRole("button", { name: "Rematch", exact: true }),
  ).toBeVisible();
  expect((await game(page)).winner).toBe(1);
});
test("Spike warning is visible and Dots starts with equal unselected edges", async ({
  page,
}) => {
  await open(page, "Spike Attacks");
  await expect.poll(async () => (await game(page)).phase).toBe("warning");
  await page.screenshot({ path: "docs/spike-red-warning.png" });
  await open(page, "Dots and Boxes");
  await page.screenshot({ path: "docs/dots-neutral-edges.png" });
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  expect((await game(page)).edges.filter((x: number) => x !== 0)).toHaveLength(
    1,
  );
});
