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
test("Gravity Runner flips via touch, scores survival and pauses cleanly", async ({
  page,
}) => {
  await open(page, "Gravity Runner");
  const b = (await page.locator("canvas").boundingBox())!;
  await page.touchscreen.tap(b.x + b.width * 0.5, b.y + (b.height * 550) / 760);
  expect((await snap(page)).scene.game.players[0].gravity).toBe(-1);
  await expect
    .poll(async () => (await snap(page)).scene.game.scores[1], {
      timeout: 16000,
    })
    .toBeGreaterThan(0);
  await page.keyboard.press("Escape");
  const s = (await snap(page)).scene.game;
  await page.waitForTimeout(250);
  expect((await snap(page)).scene.game).toEqual(s);
  await page.getByRole("button", { name: /Keep playing/ }).click();
  await page.screenshot({ path: "docs/gravity-runner-review.png" });
});
test("Happy Birds flaps through touch input and finishes a real survival match", async ({
  page,
}) => {
  await open(page, "Happy Birds");
  await expect.poll(async () => (await snap(page)).scene.game.between).toBe(0);
  const b = (await page.locator("canvas").boundingBox())!;
  await page.touchscreen.tap(b.x + b.width * 0.5, b.y + (b.height * 550) / 760);
  expect((await snap(page)).scene.game.players[0].vy).toBeLessThan(0);
  await page.screenshot({ path: "docs/happy-birds-review.png" });
  await expect(page.getByRole("button", { name: /Rematch/ })).toBeVisible({
    timeout: 15000,
  });
});
test("Spike Attacks supports movement, real cover and simultaneous scene cleanup", async ({
  page,
}) => {
  await open(page, "Spike Attacks");
  await page.keyboard.down("KeyA");
  await page.waitForTimeout(300);
  await page.keyboard.up("KeyA");
  expect((await snap(page)).scene.game.players[0].x).toBeLessThan(160);
  await expect
    .poll(async () => (await snap(page)).scene.game.scores[1], {
      timeout: 18000,
    })
    .toBeGreaterThan(0);
  await page.screenshot({ path: "docs/spike-attacks-review.png" });
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Back to all games", exact: true })
    .click();
  expect((await snap(page)).scene.inputListeners).toBe(0);
});
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
