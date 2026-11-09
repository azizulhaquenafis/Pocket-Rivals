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
test("Perfect Timer schedules clock ticks and stop click, pause stops ticking", async ({
  page,
}) => {
  await audioSpy(page);
  await open(page, "Perfect Timer");
  await page.keyboard.press("Space");
  await page.keyboard.press("Enter");
  await expect.poll(async () => (await state(page)).state).toBe("TIMING");
  await page.waitForTimeout(650);
  await page.keyboard.press("Space");
  let notes = await page.evaluate(() => (window as any).__notes);
  expect(notes).toContain(1550);
  expect(notes).toContain(820);
  await page.keyboard.press("Escape");
  const count = await page.evaluate(() => (window as any).__notes.length);
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => (window as any).__notes.length)).toBe(count);
});

