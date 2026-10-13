import { test, expect, type Page } from "@playwright/test";
const state = (p: Page) => p.evaluate(() => (window as any).__POCKET__);
async function tap(p: Page, x: number, y: number) {
  const b = (await p.locator("canvas").boundingBox())!;
  await p.touchscreen.tap(
    b.x + (x / 420) * b.width,
    b.y + (y / 760) * b.height,
  );
}
async function launch(p: Page, name: string, ai = false, variant?: string) {
  await p.getByRole("button", { name: `Play ${name}`, exact: true }).click();
  if (variant)
    await p.getByRole("button", { name: new RegExp(variant + " —") }).click();
  if (ai) {
    await p.getByRole("radio", { name: /1 Player/ }).click();
    await p.getByRole("radio", { name: "Impossible", exact: true }).click();
  }
  await p.getByRole("button", { name: "Let’s play →" }).click();
  await expect.poll(async () => (await state(p)).state).toBe("playing");
  await p.waitForTimeout(400);
}
async function leave(p: Page) {
  await p.keyboard.press("Escape");
  await p
    .getByRole("button", { name: "Back to all games", exact: true })
    .click();
  await expect(p.locator("canvas")).not.toBeVisible();
  expect((await state(p)).scene.inputListeners).toBe(0);
}
async function drag(p: Page, x: number, y: number, toX: number, toY: number) {
  const b = (await p.locator("canvas").boundingBox())!,
    cdp = await p.context().newCDPSession(p),
    point = (x: number, y: number) => ({
      x: b.x + (x / 420) * b.width,
      y: b.y + (y / 760) * b.height,
      id: 7,
    });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [point(x, y)],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [point(toX, toY)],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await cdp.detach();
}
test("Connect Four completes a gravity win, rematches, saves and runs worker AI", async ({
  page,
}) => {
  await page.goto("/");
  await launch(page, "Connect Four");
  await page.screenshot({ path: "docs/connect-four.png" });
  for (const column of [0, 1, 0, 1, 0, 1, 0]) {
    await tap(page, 60 + column * 50, 260);
    await page.waitForTimeout(340);
  }
  await expect(
    page.getByRole("heading", { name: "Orange takes it!" }),
  ).toBeVisible();
  expect((await state(page)).saved.wins).toEqual([1, 0]);
  await page.getByRole("button", { name: /Rematch/ }).click();
  await expect.poll(async () => (await state(page)).scene.game?.moves).toBe(0);
  await page.waitForTimeout(350);
  await tap(page, 210, 260);
  await leave(page);
  await page.reload();
  await page.getByRole("button", { name: /Continue saved game/ }).click();
  await expect.poll(async () => (await state(page)).scene.ready).toBe(true);
  expect((await state(page)).scene.game.moves).toBe(1);
  await leave(page);
  await launch(page, "Connect Four", true);
  await tap(page, 210, 260);
  await expect.poll(async () => (await state(page)).scene.game.moves).toBe(2);
  expect((await state(page)).diagnostics.aiMs).toBeGreaterThan(0);
  expect((await state(page)).scene.game.turn).toBe(1);
});
test("Arcade has independent high scores, Snake controls, pause and game over", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "pocket-rivals.arcade.v1",
      JSON.stringify({ snake: 40 }),
    ),
  );
  await page.goto("/");
  await page
    .getByRole("button", { name: "1 Player Arcade", exact: true })
    .click();
  await expect(page.locator("[data-game]")).toHaveCount(3);
  await page.screenshot({ path: "docs/arcade.png" });
  await page
    .getByRole("button", { name: "Play Classic Snake", exact: true })
    .click();
  await expect.poll(async () => (await state(page)).state).toBe("playing");
  await page.waitForTimeout(250);
  await tap(page, 210, 574);
  await expect
    .poll(async () => (await state(page)).scene.game.direction)
    .toBe("up");
  await page.keyboard.press("Escape");
  const paused = (await state(page)).scene.game;
  await page.waitForTimeout(250);
  expect((await state(page)).scene.game).toEqual(paused);
  await page.screenshot({ path: "docs/snake-paused.png" });
  await page.getByRole("button", { name: /Keep playing/ }).click();
  await page.waitForTimeout(250);
  await page.screenshot({ path: "docs/snake.png" });
  await expect(page.getByRole("button", { name: "Play again →" })).toBeVisible({
    timeout: 8000,
  });
  await expect(
    page.getByRole("dialog").getByText("Personal best", { exact: false }),
  ).toContainText("40");
  expect((await state(page)).saved.rounds).toBe(0);
  await page.getByRole("button", { name: "Back to Arcade" }).click();
  await expect(
    page.getByRole("heading", { name: "A little me time" }),
  ).toBeVisible();
});
test("Star Patrol touch firing, keyboard controls, responsive layout and pooled projectiles", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "1 Player Arcade", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Play Star Patrol", exact: true })
    .click();
  await expect.poll(async () => (await state(page)).state).toBe("playing");
  await page.waitForTimeout(750);
  const b = (await page.locator("canvas").boundingBox())!,
    cdp = await context.newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ id: 1, x: b.x + b.width * 0.7, y: b.y + b.height * 0.78 }],
  });
  await page.waitForTimeout(700);
  let s = (await state(page)).scene.game;
  expect(s.player.x).toBeGreaterThan(250);
  expect(s.projectiles.some((p: any) => !p.enemy)).toBe(true);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.keyboard.down("ArrowLeft");
  await page.keyboard.down("Space");
  await page.waitForTimeout(500);
  await page.keyboard.up("ArrowLeft");
  await page.keyboard.up("Space");
  expect((await state(page)).scene.game.player.x).toBeLessThan(s.player.x);
  await page.screenshot({ path: "docs/star-patrol.png" });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.waitForTimeout(150);
  const small = (await page.locator("canvas").boundingBox())!;
  expect(small.x).toBeGreaterThanOrEqual(0);
  expect(small.y + small.height).toBeLessThanOrEqual(569);
  await leave(page);
  expect((await state(page)).saved.rounds).toBe(0);
});
test("new games are lazy, Arcade is excluded from tournaments, and navigation releases scenes", async ({
  page,
}) => {
  const errors: string[] = [],
    requests: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => requests.push(r.url()));
  await page.goto("/?diagnostics");
  await expect(
    page.getByRole("button", { name: "Play Pong", exact: true }),
  ).toBeVisible();
  expect(
    requests.some((url) =>
      /\/(ConnectFourGame|MiniGolfGame|SnakeGame|SpaceShooterGame)\.ts/.test(
        url,
      ),
    ),
  ).toBe(false);
  expect((await state(page)).diagnostics.modules).toEqual([]);
  for (const name of [
    "Connect Four",
    "Air Hockey",
    "Pong",
    "Air Hockey",
    "Connect Four",
    "Air Hockey",
  ]) {
    await launch(page, name);
    expect((await state(page)).scene.children).toBeLessThan(25);
    await expect(page.locator(".game-transition")).toBeHidden();
    await expect(page.locator("canvas")).toHaveCount(1);
    await leave(page);
    await expect(page.locator("#menu")).toBeVisible();
  }
  await page.getByRole("button", { name: "Tournament", exact: true }).click();
  await page.getByRole("button", { name: "Choose games" }).click();
  await expect(page.getByRole("checkbox")).toHaveCount(5);
  await expect(
    page.getByRole("checkbox", { name: /Snake|Star Patrol|Ultimate Golf/ }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});
test("match countdown uses elapsed time and freezes while backgrounded", async ({
  page,
}) => {
  await page.goto("/");
  for (const name of ["Pong", "Air Hockey"]) {
    await launch(page, name);
    const first = (await state(page)).scene.game.timer.remaining;
    await page.waitForTimeout(1100);
    expect((await state(page)).scene.game.timer.remaining).toBeLessThan(
      first - 1,
    );
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    const paused = (await state(page)).scene.game.timer.remaining;
    await page.waitForTimeout(400);
    expect((await state(page)).scene.game.timer.remaining).toBe(paused);
    await page.getByRole("button", { name: /Keep playing/ }).click();
    await page.waitForTimeout(200);
    expect((await state(page)).scene.game.timer.remaining).toBeGreaterThan(
      paused - 0.35,
    );
    await leave(page);
  }
});

test("Pong and Hockey restore foreground clocks after closing the page", async ({
  page,
}) => {
  await page.goto("/");
  for (const name of ["Pong", "Air Hockey"]) {
    await launch(page, name);
    await page.waitForTimeout(1100);
    await page.keyboard.press("Escape");
    const saved = (await state(page)).scene.game;
    await page
      .getByRole("button", { name: "Back to all games", exact: true })
      .click();
    await page.reload();
    await page.getByRole("button", { name: /Continue saved game/ }).click();
    await expect.poll(async () => (await state(page)).state).toBe("playing");
    const resumed = (await state(page)).scene.game;
    expect(resumed.timer.remaining).toBeGreaterThan(
      saved.timer.remaining - 0.3,
    );
    expect(resumed.timer.remaining).toBeLessThanOrEqual(saved.timer.remaining);
    expect(resumed.scores).toEqual(saved.scores);
    await leave(page);
  }
});
