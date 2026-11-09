import { test, expect, type Page } from "@playwright/test";
const state = (page: Page) => page.evaluate(() => (window as any).__POCKET__);
async function launch(page: Page, ai = false) {
  await page.goto("/?aiSeed=42");
  await page.clock.install();
  await page
    .getByRole("button", { name: "Play Light Fingers", exact: true })
    .click();
  await page
    .getByRole("radio", { name: ai ? /1 Player/ : /2 Players/ })
    .click();
  await page.getByRole("button", { name: /Let’s play/ }).click();
  await expect.poll(async () => (await state(page)).scene.ready).toBe(true);
}
test("both hands recover visually, pause together, and Blue carries a stolen gem", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await launch(page);
  await page.keyboard.press("Space");
  await page.clock.runFor(220);
  let w = (await state(page)).scene.game;
  expect(w.hands).toHaveLength(2);
  expect(w.hands[0].phase).toBe("recovery");
  expect(w.hands[0].gray).toBeGreaterThan(0.5);
  expect(w.hands[1].phase).toBe("ready");
  expect(w.scores).toEqual([0, 0]);
  await page.keyboard.press("Enter");
  await page.clock.runFor(170);
  expect((await state(page)).scene.game.hands[1].phase).toBe("recovery");
  await page.screenshot({ path: "docs/light-hands-recovery.png" });
  await page.keyboard.press("Escape");
  const paused = (await state(page)).scene.game;
  await page.clock.runFor(1500);
  expect((await state(page)).scene.game).toEqual(paused);
  await page.getByRole("button", { name: /Keep playing/ }).click();
  await page.clock.runFor(1100);
  w = (await state(page)).scene.game;
  expect(w.hands[0].phase).toBe("ready");
  expect(w.cooldowns[0]).toBe(0);
  expect(w.hands[1].phase).toBe("ready");
  for (
    let i = 0;
    i < 50 && (await state(page)).scene.game.phase !== "active";
    i++
  )
    await page.clock.runFor(100);
  expect((await state(page)).scene.game.phase).toBe("active");
  await page.screenshot({ path: "docs/light-two-hands.png" });
  await page.keyboard.press("Enter");
  await page.clock.runFor(250);
  w = (await state(page)).scene.game;
  expect(w.scores).toEqual([0, 1]);
  expect(w.hands[1].carrying).toBe(true);
  expect(w.hands[0].phase).toBe("ready");
  await page.screenshot({ path: "docs/light-blue-steal.png" });
  await page.clock.runFor(650);
  expect((await state(page)).scene.game.hands[1].phase).toBe("ready");
  await page.setViewportSize({ width: 320, height: 568 });
  await page.clock.runFor(100);
  const bounds = (await page.locator("canvas").boundingBox())!;
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(569);
  await page.screenshot({ path: "docs/light-small.png" });
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Back to all games", exact: true })
    .click();
  expect((await state(page)).scene.inputListeners).toBe(0);
  expect(errors).toEqual([]);
});
test("AI uses its visible second hand after a legal delayed response", async ({
  page,
}) => {
  await launch(page, true);
  for (let i = 0; i < 90 && (await state(page)).scene.game.scores[1] === 0; i++)
    await page.clock.runFor(100);
  await page.clock.runFor(220);
  const w = (await state(page)).scene.game;
  expect(w.scores).toEqual([0, 1]);
  expect(w.hands[1].phase).toBe("steal");
  expect(w.hands[1].carrying).toBe(true);
  expect(w.ai.reaction).toBeGreaterThanOrEqual(0.12);
  await page.screenshot({ path: "docs/light-ai-steal.png" });
});
