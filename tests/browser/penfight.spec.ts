import { test, expect, type Page } from "@playwright/test";
import { pens } from "../../src/games/penfight/PenPhysics";
test.setTimeout(60000);
const state = (page: Page) => page.evaluate(() => (window as any).__POCKET__);
async function open(page: Page, difficulty?: string) {
  await page.goto("/?aiSeed=42&aiReplay");
  await page
    .getByRole("button", { name: "Play Penfight", exact: true })
    .click();
  if (difficulty) {
    await page.getByRole("radio", { name: /1 Player/ }).click();
    await expect(
      page.getByRole("radio", { name: "Easy", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("radio", { name: "Medium", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("radio", { name: "Hard", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("radio", { name: "Impossible", exact: true }),
    ).toHaveCount(0);
    await page.getByRole("radio", { name: difficulty, exact: true }).click();
  } else
    await expect(
      page.getByRole("radio", { name: /2 Players/ }),
    ).toHaveAttribute("aria-checked", "true");
  await page.getByRole("button", { name: /Let’s play/ }).click();
  await expect.poll(async () => (await state(page)).scene.ready).toBe(true);
  await expect(page.locator(".game-transition")).toBeHidden();
  await page.waitForTimeout(100);
}
async function drag(page: Page, dx: number, dy: number, cancel = false) {
  const w = (await state(page)).scene.game,
    p = w.bodies[w.turn];
  const box = (await page.locator("canvas").boundingBox())!,
    cdp = await page.context().newCDPSession(page);
  const point = (x: number, y: number) => ({
    id: 1,
    x: box.x + (x / 420) * box.width,
    y: box.y + (y / 760) * box.height,
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [point(p.x, p.y)],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [point(p.x + dx, p.y + dy)],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: cancel ? "touchCancel" : "touchEnd",
    touchPoints: [],
  });
  await cdp.detach();
}
test("Penfight local touch shots, canceled gestures, settling, pause and cleanup", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page);
  await drag(page, -30, 0, true);
  expect((await state(page)).scene.game.shots).toBe(0);
  expect((await state(page)).scene.game.aim).toBe(null);
  await drag(page, -30, 0);
  expect((await state(page)).scene.game.shots).toBe(1);
  await page.waitForTimeout(100);
  const moving = (await state(page)).scene.game;
  expect(moving.bodies[0].x).toBeGreaterThan(210);
  await drag(page, 30, 0); // motion locks input even on an opponent's pen
  expect((await state(page)).scene.game.shots).toBe(1);
  await page.keyboard.press("Escape");
  const paused = (await state(page)).scene.game;
  await page.waitForTimeout(1000);
  expect((await state(page)).scene.game).toEqual(paused);
  await page.getByRole("button", { name: /Keep playing/ }).click();
  await page.waitForTimeout(2000);
  expect((await state(page)).scene.game.turn).toBe(1);
  expect((await state(page)).scene.game.phase).toBe("aim");
  await page.screenshot({ path: info.outputPath("penfight-mobile.png") });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.waitForTimeout(100);
  const box = (await page.locator("canvas").boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(569);
  await drag(page, 20, 0);
  expect((await state(page)).scene.game.shots).toBe(2);
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Back to all games", exact: true })
    .click();
  expect((await state(page)).scene.inputListeners).toBe(0);
  expect(errors).toEqual([]);
});
test("Penfight an ordinary opening makes contact and the warned edge moves after the sixth flick", async ({
  page,
}) => {
  await open(page);
  const game = async () => (await state(page)).scene.game;
  const initial = await game();
  await drag(page, 0, 62);
  await expect.poll(async () => (await game()).phase).toBe("aim");
  const contact = await game();
  expect(contact.bodies[1].y).toBeLessThan(initial.bodies[1].y - 10);
  expect(contact.pressure[0]).toBeGreaterThan(10);
  expect(contact.impacts).toBeGreaterThan(0);
  for (let i = 1; i < 6; i++) {
    const before = await game();
    expect(before.nextShrink.inFlicks).toBe(6 - i);
    expect(before.desk).toEqual(initial.desk);
    await drag(page, 12, 0);
    await expect.poll(async () => (await game()).phase).toBe("aim");
  }
  const narrowed = await game();
  expect(narrowed.shots).toBe(6);
  expect(narrowed.desk.left).toBeGreaterThan(initial.desk.left);
  expect(narrowed.desk.right).toBeLessThan(initial.desk.right);
  expect(narrowed.turn).toBe(0);
});

for (const difficulty of ["Easy", "Medium", "Hard"])
  test(`Penfight ${difficulty} AI waits, shoots legally in a worker and stops on pause`, async ({
    page,
  }) => {
    await open(page, difficulty);
    await drag(page, -25, 0);
    await expect
      .poll(async () => (await state(page)).scene.game.totalShots, {
        timeout: 15000,
      })
      .toBeGreaterThanOrEqual(2);
    const active = (await state(page)).scene.game;
    expect(active.ai.last.wait).toBeGreaterThanOrEqual(active.ai.last.delay);
    expect(active.ai.last.candidates).toBeGreaterThan(0);
    expect((await state(page)).diagnostics.aiMs).toBeGreaterThan(0);
    await page.keyboard.press("Escape");
    const paused = (await state(page)).scene.game;
    await page.waitForTimeout(2000);
    expect((await state(page)).scene.game).toEqual(paused);
  });
test("Penfight production mouse input, lazy load, tournament entry and settings regression", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:4173/");
  await page.setViewportSize({ width: 1200, height: 850 });
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(
    page.getByRole("slider", { name: "Effects volume" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close settings" }).click();
  await page
    .getByRole("button", { name: "Play Penfight", exact: true })
    .click();
  await page.getByRole("button", { name: /Let’s play/ }).click();
  await expect(page.locator("canvas")).toBeVisible();
  await page.waitForTimeout(500);
  const b = (await page.locator("canvas").boundingBox())!;
  const [orange] = pens();
  const x = b.x + (b.width * orange.x) / 420,
    y = b.y + (b.height * orange.y) / 760;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + (b.height * 88) / 760, { steps: 8 });
  await page.screenshot({ path: info.outputPath("penfight-desktop-aim.png") });
  await page.mouse.up();
  await page.waitForTimeout(800);
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Back to all games", exact: true })
    .click();
  await page.getByRole("button", { name: "Tournament", exact: true }).click();
  await page.getByRole("button", { name: "Choose games", exact: true }).click();
  await expect(page.getByRole("checkbox", { name: /Penfight/ })).toBeVisible();
  expect(errors).toEqual([]);
});
