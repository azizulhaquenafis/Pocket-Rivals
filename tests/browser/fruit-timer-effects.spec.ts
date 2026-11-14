import { test, expect, type Page } from "@playwright/test";
const state = (p: Page) =>
  p.evaluate(() => (window as any).__POCKET__.scene.game);
async function open(p: Page, name: string) {
  await p.goto("/?aiSeed=77");
  await p.getByRole("button", { name: `Play ${name}`, exact: true }).click();
  await p.getByRole("radio", { name: /2 Players/ }).click();
  await p.getByRole("button", { name: /Let’s play/ }).click();
  await p.waitForFunction(() => (window as any).__POCKET__.scene.ready);
}
async function audioSpy(p: Page) {
  await p.addInitScript(() => {
    (window as any).__notes = [];
    const original = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function () {
      const o = original.call(this);
      const set = o.frequency.setValueAtTime.bind(o.frequency);
      o.frequency.setValueAtTime = (hz, at) => {
        (window as any).__notes.push(hz);
        return set(hz, at);
      };
      return o;
    };
  });
}
test("fruit decoys cause recoverable cooldown, real fruit splits, sound plays and pause freezes", async ({
  page,
}) => {
  await audioSpy(page);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.clock.install();
  await open(page, "Fruit Duel");
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  const reach = async (fruit: boolean) => {
    for (let i = 0; i < 120; i++) {
      const s = await state(page);
      if (s.phase === "active" && s.isFruit === fruit && s.cooldowns[0] === 0)
        return;
      await page.clock.runFor(100);
    }
    throw Error("No eligible object appeared");
  };
  await reach(false);
  await page.keyboard.press("Space");
  await page.clock.runFor(40);
  await expect
    .poll(async () => (await state(page)).cooldowns[0])
    .toBeGreaterThan(0);
  expect((await state(page)).scores).toEqual([0, 0]);
  const attempts = (await state(page)).attempts[0];
  await page.keyboard.press("Space");
  expect((await state(page)).attempts[0]).toBe(attempts);
  await page.keyboard.press("Escape");
  const paused = await state(page);
  await page.screenshot({ path: "docs/fruit-decoy.png" });
  await page.clock.runFor(250);
  expect(await state(page)).toEqual(paused);
  await page.getByRole("button", { name: /Keep playing/ }).click();
  await reach(true);
  await page.keyboard.press("Space");
  await page.clock.runFor(40);
  await expect.poll(async () => (await state(page)).scores[0]).toBe(1);
  await page.clock.runFor(230);
  await page.screenshot({ path: "docs/fruit-sliced.png" });
  const notes = await page.evaluate(() => (window as any).__notes);
  expect(notes).toContain(110);
  expect(notes).toContain(2400);
  expect(errors).toEqual([]);
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Back to all games", exact: true })
    .click();
  expect(
    await page.evaluate(() => (window as any).__POCKET__.scene.inputListeners),
  ).toBe(0);
});
