import { test, expect, type Page } from "@playwright/test";
const state = (p: Page) => p.evaluate(() => (window as any).__POCKET__);
async function launch(p: Page, ai = false) {
  await p.goto("/?aiSeed=77");
  await p
    .getByRole("button", { name: "Play Spike Attacks", exact: true })
    .click();
  await p.getByRole("button", { name: /Courtyard/ }).click();
  await p.getByRole("radio", { name: ai ? /1 Player/ : /2 Players/ }).click();
  if (ai)
    await p.getByRole("radio", { name: "Impossible", exact: true }).click();
  await p.getByRole("button", { name: /Let’s play/ }).click();
  await expect.poll(async () => (await state(p)).scene.ready).toBe(true);
}
test("shared arena has independent joysticks, smooth legal motion and cancellation on pause", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await launch(page);
  const before = (await state(page)).scene.game;
  expect(before.sharedArena).toBe(true);
  await page.screenshot({ path: "docs/spike-shared-start.png" });
  const b = (await page.locator("canvas").boundingBox())!,
    cdp = await page.context().newCDPSession(page);
  const point = (id: number, x: number, y: number) => ({
    id,
    x: b.x + (x * b.width) / 420,
    y: b.y + (y * b.height) / 760,
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [point(1, 210, 595), point(2, 210, 158)],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [point(1, 242, 595), point(2, 178, 158)],
  });
  await page.waitForTimeout(180);
  const moved = (await state(page)).scene.game;
  expect(moved.players[0].x).toBeGreaterThan(before.players[0].x + 10);
  expect(moved.players[1].x).toBeLessThan(before.players[1].x - 10);
  expect(moved.players[0].x - before.players[0].x).toBeLessThan(55);
  await page.keyboard.press("Escape");
  const paused = (await state(page)).scene.game;
  await page.waitForTimeout(200);
  expect((await state(page)).scene.game).toEqual(paused);
  expect(paused.sticks.every((s: any) => !s.active)).toBe(true);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await cdp.detach();
  await page.getByRole("button", { name: /Keep playing/ }).click();
  const still = (await state(page)).scene.game.players;
  await page.waitForTimeout(100);
  expect((await state(page)).scene.game.players).toEqual(still);
  await page.setViewportSize({ width: 360, height: 640 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: "docs/spike-shared-mobile.png" });
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Back to all games", exact: true })
    .click();
  expect((await state(page)).scene.inputListeners).toBe(0);
  expect(errors).toEqual([]);
});
test("attacks really extend, AI takes cover, and the shared match finishes without fabricated points", async ({
  page,
}) => {
  await launch(page, true);
  await expect
    .poll(
      async () =>
        (await state(page)).scene.game.lengths.some((n: number) => n > 25),
      { timeout: 8000 },
    )
    .toBe(true);
  await page.screenshot({ path: "docs/spike-shared-strike.png" });
  await expect
    .poll(async () => (await state(page)).scene.game.scores[1], {
      timeout: 8000,
    })
    .toBeGreaterThan(0);
  await expect(page.getByRole("button", { name: /Rematch/ })).toBeVisible({
    timeout: 22000,
  });
});
test("deadline excludes pause time; desktop mouse joystick and repeated exits stay clean", async ({
  page,
}) => {
  await page.clock.install();
  await launch(page);
  await page.keyboard.press("Escape");
  const remaining = (await state(page)).scene.game.remaining;
  await page.clock.fastForward(30000);
  expect((await state(page)).scene.game.remaining).toBe(remaining);
  await page.getByRole("button", { name: /Keep playing/ }).click();
  await page.clock.runFor(50);
  expect((await state(page)).scene.game.remaining).toBeGreaterThan(
    remaining - 0.2,
  );
  await page.clock.fastForward(120000);
  await page.clock.runFor(1000);
  await expect(page.getByRole("button", { name: /Rematch/ })).toBeVisible();
  expect((await state(page)).scene.game.remaining).toBe(0);
  await page
    .getByRole("button", { name: "Back to all games", exact: true })
    .click();
  for (let i = 0; i < 3; i++) {
    await launch(page);
    const b = (await page.locator("canvas").boundingBox())!;
    await page.mouse.move(b.x + b.width * 0.5, b.y + (b.height * 595) / 760);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width * 0.57, b.y + (b.height * 595) / 760);
    await page.clock.runFor(150);
    expect((await state(page)).scene.game.players[0].x).toBeGreaterThan(120);
    await page.mouse.up();
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: "Back to all games", exact: true })
      .click();
    expect((await state(page)).scene.inputListeners).toBe(0);
  }
});

test("solo arrow keys control Orange and both local keyboard schemes stay active", async ({
  page,
}) => {
  await launch(page, true);
  const before = (await state(page)).scene.game.players[0].x;
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(130);
  await page.keyboard.up("ArrowRight");
  expect((await state(page)).scene.game.players[0].x).toBeGreaterThan(
    before + 8,
  );
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Back to all games", exact: true })
    .click();
  await launch(page);
  await page.keyboard.down("KeyD");
  await page.keyboard.down("ArrowLeft");
  await page.waitForTimeout(140);
  await page.keyboard.up("KeyD");
  await page.keyboard.up("ArrowLeft");
  const s = (await state(page)).scene.game;
  expect(s.players[0].x).toBeGreaterThan(120);
  expect(s.players[1].x).toBeLessThan(200);
});
test("browser gamepad input moves legally and held sticks cannot creep after pause", async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as any).__testPads = [];
    Object.defineProperty(navigator, "getGamepads", {
      value: () => (window as any).__testPads,
      configurable: true,
    });
  });
  await launch(page);
  await page.evaluate(() => {
    (window as any).__testPads = [
      { index: 0, connected: true, axes: [1, 0], buttons: [] },
    ];
  });
  await expect
    .poll(async () => (await state(page)).scene.game.players[0].x)
    .toBeGreaterThan(120);
  expect((await state(page)).scene.game.controls[0].source).toBe("gamepad");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /Keep playing/ }).click();
  const stopped = (await state(page)).scene.game.players[0].x;
  await page.waitForTimeout(150);
  expect((await state(page)).scene.game.players[0].x).toBe(stopped);
  await page.evaluate(() => ((window as any).__testPads[0].axes = [0, 0]));
  await page.waitForTimeout(50);
  await page.evaluate(() => ((window as any).__testPads[0].axes = [-1, 0]));
  await expect
    .poll(async () => (await state(page)).scene.game.players[0].x)
    .toBeLessThan(stopped - 5);
  await page.screenshot({ path: "docs/spike-keyboard-controller.png" });
});

test("three maps and Random launch, while solo hides the AI control", async ({
  page,
}) => {
  for (const [name, id] of [
    ["Courtyard", "courtyard"],
    ["Split Steps", "split-steps"],
    ["Crosswind", "crosswind"],
    ["Random map", "random"],
  ]) {
    await page.goto("/?aiSeed=77");
    await page
      .getByRole("button", { name: "Play Spike Attacks", exact: true })
      .click();
    await page.getByRole("button", { name: new RegExp(name) }).click();
    await page.getByRole("radio", { name: /1 Player/ }).click();
    await page.getByRole("button", { name: /Let’s play/ }).click();
    await expect.poll(async () => (await state(page)).scene.ready).toBe(true);
    const s = (await state(page)).scene.game;
    expect(s.visibleControls).toEqual([0]);
    expect(s.map).toBe(id === "random" ? "crosswind" : id);
    await page.screenshot({ path: `docs/spike-map-${id}.png` });
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: "Back to all games", exact: true })
      .click();
  }
});
