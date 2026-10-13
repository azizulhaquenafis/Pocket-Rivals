import { test, expect, type Page } from "@playwright/test";
const state = (p: Page) => p.evaluate(() => (window as any).__POCKET__);
async function point(p: Page, x: number, y: number) {
  const b = (await p.locator("canvas").boundingBox())!;
  return { x: b.x + (x / 420) * b.width, y: b.y + (y / 760) * b.height };
}
async function tap(p: Page, x: number, y: number) {
  const v = await point(p, x, y);
  await p.touchscreen.tap(v.x, v.y);
}
async function open(p: Page) {
  await p.goto("/?diagnostics");
  await p.getByRole("button", { name: "1 Player Arcade", exact: true }).click();
  await p
    .getByRole("button", { name: "Play Ultimate Golf", exact: true })
    .click();
  await expect.poll(async () => (await state(p)).scene.ready).toBe(true);
  await p.waitForTimeout(200);
}
async function gesture(p: Page, cancel = false) {
  const cdp = await p.context().newCDPSession(p),
    a = await point(p, 210, 360),
    b = await point(p, 175, 360);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ ...a, id: 1 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ ...b, id: 1 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: cancel ? "touchCancel" : "touchEnd",
    touchPoints: [],
  });
  await cdp.detach();
}
test("Ultimate Golf touch controls, cancel, pause, focus and all four 9:16 courses", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page);
  await page.screenshot({ path: "docs/golf-course-select.png" });
  for (let i = 0; i < 4; i++) {
    await tap(page, 210, 204 + i * 94);
    await expect
      .poll(async () => (await state(page)).scene.game.phase)
      .toBe("playing");
    await page.waitForTimeout(100);
    const before = (await state(page)).scene.game;
    expect(before.view.bounds.w / before.view.bounds.h).toBe(9 / 16);
    await gesture(page, true);
    expect((await state(page)).scene.game.strokes).toBe(0);
    await gesture(page);
    await expect
      .poll(async () => (await state(page)).scene.game.strokes)
      .toBe(1);
    await page.keyboard.press("Escape");
    const paused = (await state(page)).scene.game;
    await page.waitForTimeout(250);
    expect((await state(page)).scene.game).toEqual(paused);
    await page.getByRole("button", { name: /Keep playing/ }).click();
    await tap(page, 210, 659);
    expect((await state(page)).scene.game.view.zoom).toBe(2.5);
    await page.waitForTimeout(150);
    await page.screenshot({ path: `docs/golf-${i + 1}-focus.png` });
    await tap(page, 339, 659);
    expect((await state(page)).scene.game.strokes).toBe(0);
    await page.screenshot({ path: `docs/golf-${i + 1}.png` });
    await tap(page, 81, 659);
    expect((await state(page)).scene.game.phase).toBe("select");
  }
  expect((await state(page)).saved.rounds).toBe(0);
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Back to all games", exact: true })
    .click();
  expect((await state(page)).scene.inputListeners).toBe(0);
  expect(errors).toEqual([]);
});
test("Ultimate Golf mouse aiming, narrow screens, landscape and repeated cleanup", async ({
  page,
}) => {
  await open(page);
  for (const size of [
    { width: 1280, height: 900 },
    { width: 320, height: 568 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(size);
    await page.waitForTimeout(180);
    await tap(page, 210, 204);
    await expect.poll(async () => (await state(page)).scene.game.course).toBe("foundry");
    await page.waitForTimeout(80);
    const a = await point(page, 210, 360),
      b = await point(page, 175, 360);
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(b.x, b.y, { steps: 8 });
    await page.mouse.up();
    await expect
      .poll(async () => (await state(page)).scene.game.strokes)
      .toBe(1);
    const box = (await page.locator("canvas").boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(size.height + 1);
    await tap(page, 81, 659);
    expect((await state(page)).scene.children).toBeLessThan(50);
  }
  await tap(page, 210, 204);
  await page.keyboard.press("KeyF");
  await expect
    .poll(async () => (await state(page)).scene.game.view.zoom)
    .toBe(2.5);
  await page.keyboard.press("KeyR");
  await expect
    .poll(async () => (await state(page)).scene.game.view.zoom)
    .toBe(1);
});
