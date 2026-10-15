import { golfSolutions } from "../fixtures/golf-solutions";
import { test, expect, type Page } from "@playwright/test";
const state = (p: Page) => p.evaluate(() => (window as any).__POCKET__);
async function center(p: Page) {
  const b = (await p.locator(".golf-field").boundingBox())!;
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}
async function open(p: Page) {
  await p.goto("/?diagnostics");
  await p
    .getByRole("button", { name: "Play Ultimate Golf", exact: true })
    .click();
  await expect(
    p.getByRole("button", { name: /1 Player Casual/ }),
  ).toBeVisible();
}
async function gesture(p: Page, cancel = false) {
  const cdp = await p.context().newCDPSession(p),
    a = await center(p),
    b = { x: a.x - 35, y: a.y };
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
test("golf responsive touch, focus, pause and four courses", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page);
  await page.screenshot({ path: "docs/golf-modes.png" });
  await page.getByRole("button", { name: /1 Player Casual/ }).click();
  for (const name of ["Foundry", "Shoreline", "Event Horizon", "Lost Temple"]) {
    await page.getByRole("button", { name: new RegExp(name) }).click();
    await expect
      .poll(async () => (await state(page)).scene.game.phase)
      .toBe("playing");
    await page.getByRole("button", { name: "Golf help", exact: true }).click();
    const before = (await state(page)).scene.game;
    await page.waitForTimeout(150);
    expect((await state(page)).scene.game).toEqual(before);
    await page
      .getByRole("button", { name: "Back to play", exact: true })
      .click();
    await gesture(page, true);
    expect((await state(page)).scene.game.strokes).toBe(0);
    await gesture(page);
    await expect
      .poll(async () => (await state(page)).scene.game.strokes)
      .toBe(1);
    await page.keyboard.press("Escape");
    const paused = (await state(page)).scene.game;
    await page.waitForTimeout(200);
    expect((await state(page)).scene.game).toEqual(paused);
    await page.getByRole("button", { name: /Keep playing/ }).click();
    await page.getByRole("button", { name: "Focus", exact: true }).click();
    await expect
      .poll(async () => (await state(page)).scene.game.view.zoom)
      .toBeGreaterThan(2);
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await page.getByRole("button", { name: "Focus", exact: true }).click();
    await page.waitForTimeout(700);
    await gesture(page);
    await expect
      .poll(async () => (await state(page)).scene.game.strokes)
      .toBe(1);
    await page.screenshot({
      path: `docs/golf-${name.replaceAll(" ", "-")}-focus.png`,
    });
    await page.getByRole("button", { name: "Courses", exact: true }).click();
  }
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Back to all games", exact: true })
    .click();
  expect((await state(page)).scene.inputListeners).toBe(0);
  expect(await page.locator(".golf-ui").count()).toBe(0);
  expect(errors).toEqual([]);
});
test("golf mouse aiming, footer spacing and landscape cleanup", async ({
  page,
}) => {
  await open(page);
  await page.getByRole("button", { name: /1 Player Casual/ }).click();
  for (const size of [
    { width: 1280, height: 900 },
    { width: 320, height: 568 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(size);
    await page.waitForTimeout(180);
    await page.getByRole("button", { name: /Foundry/ }).click();
    await page.waitForTimeout(100);
    const a = await center(page);
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(a.x - 35, a.y, { steps: 8 });
    await page.mouse.up();
    await expect
      .poll(async () => (await state(page)).scene.game.strokes)
      .toBe(1);
    const field = (await page.locator(".golf-field").boundingBox())!,
      footer = (await page.locator(".golf-footer").boundingBox())!;
    expect(footer.y - field.y - field.height).toBeGreaterThanOrEqual(7);
    expect(footer.y + footer.height).toBeLessThanOrEqual(size.height);
    expect(footer.height).toBeGreaterThanOrEqual(48);
    await page.getByRole("button", { name: "Focus", exact: true }).click();
    await page.waitForTimeout(650);
    await page.screenshot({ path: `docs/golf-layout-${size.width}.png` });
    await page.getByRole("button", { name: "Courses", exact: true }).click();
    expect((await state(page)).scene.children).toBeLessThan(30);
  }
});
test("golf local handoff, real AI shots and clean rematches", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page);
  await page.getByRole("button", { name: /2 Player Challenge/ }).click();
  await page.getByRole("button", { name: /Foundry/ }).click();
  await page
    .getByRole("button", { name: "Start attempt", exact: true })
    .click();
  await gesture(page);
  await page.getByRole("button", { name: "Forfeit", exact: true }).click();
  await page
    .getByRole("button", { name: "Forfeit attempt", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Player 2, ready?" }),
  ).toBeVisible();
  expect((await state(page)).scene.game.competition.attempts[0]).toHaveLength(
    1,
  );
  await page
    .getByRole("button", { name: "Start attempt", exact: true })
    .click();
  expect((await state(page)).scene.game.strokes).toBe(0);
  await page.getByRole("button", { name: "Forfeit", exact: true }).click();
  await page
    .getByRole("button", { name: "Forfeit attempt", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "A draw!" })).toBeVisible();
  await page.getByRole("button", { name: "Rematch", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Player 1, ready?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Golf back", exact: true }).click();
  await page.getByRole("button", { name: "Golf back", exact: true }).click();
  await page.getByRole("button", { name: /1 Player vs AI/ }).click();
  await page.getByRole("button", { name: "Impossible", exact: true }).click();
  await page.getByRole("button", { name: /Foundry/ }).click();
  await page
    .getByRole("button", { name: "Start attempt", exact: true })
    .click();
  await expect
    .poll(
      async () => (await state(page)).scene.game.competition.opponent.strokes,
      { timeout: 10000 },
    )
    .toBeGreaterThan(0);
  const moving = (await state(page)).scene.game.competition.opponent;
  expect(Math.hypot(moving.ball.vx, moving.ball.vy)).toBeGreaterThan(0);
  await page.keyboard.press("Escape");
  const paused = (await state(page)).scene.game;
  await page.waitForTimeout(300);
  expect((await state(page)).scene.game).toEqual(paused);
  await page
    .getByRole("button", { name: "Back to all games", exact: true })
    .click();
  expect(errors).toEqual([]);
});
test("a complete Temple run uses real touch shots, banks its score and persists its record", async ({
  page,
}) => {
  test.setTimeout(60000);
  await open(page);
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 100));
  await page.getByRole("button", { name: "1 Player Casual" }).click();
  await page.getByRole("button", { name: "Easy", exact: true }).click();
  await page.clock.runFor(32);
  await page.getByRole("button", { name: /Lost Temple/ }).click();
  expect((await state(page)).scene.game.course).toBe("temple");
  const cdp = await page.context().newCDPSession(page);
  async function shot(vx: number, vy: number) {
    const start = await center(page),
      scale = (await state(page)).scene.game.view.scale,
      end = {
        x: start.x + (vy / 3.125) * scale,
        y: start.y - (vx / 3.125) * scale,
      };
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ ...start, id: 1 }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ ...end, id: 1 }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    for (let frame = 0; frame < 750; frame++) {
      await page.clock.runFor(16);
      const s = (await state(page)).scene.game;
      if (s.shootable || s.phase === "result") return;
    }
    throw Error("Shot did not settle");
  }
  for (const [wait, vx, vy] of golfSolutions[3]) {
    await page.clock.runFor(Math.round(wait * 1000));
    await shot(vx, vy);
    if ((await state(page)).scene.game.phase === "result") break;
  }
  // Real browser frames can advance a few extra simulation steps after a ball settles.
  // Aim the final three legal putts from the measured resting position.
  for (const [x, y] of [
    [1745, 690],
    [1745, 570],
    [1560, 575],
  ]) {
    const s = (await state(page)).scene.game;
    if (s.phase === "result") break;
    const distance = Math.hypot(x - s.ball.x, y - s.ball.y),
      speed = Math.sqrt(220 * distance);
    await shot(
      ((x - s.ball.x) / distance) * speed,
      ((y - s.ball.y) / distance) * speed,
    );
  }
  const result = (await state(page)).scene.game;
  expect(result.status).toBe("won");
  expect(result.recoveries).toBe(0);
  expect(result.progress[3]).toBeGreaterThan(0);
  await page.clock.resume();
  await page.waitForTimeout(100);
  await page.screenshot({ path: "docs/golf-browser-completion.png" });
  await page.getByRole("button", { name: "Finish run", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Play again →" }),
  ).toBeVisible();
  expect((await state(page)).saved.rounds).toBe(0);
  await page.getByRole("button", { name: "Back to all games" }).click();
  await page.reload();
  await page
    .getByRole("button", { name: "Play Ultimate Golf", exact: true })
    .click();
  await expect
    .poll(async () => (await state(page)).scene.game?.progress?.[3])
    .toBe(result.progress[3]);
  await cdp.detach();
});
