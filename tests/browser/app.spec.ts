import { test, expect, type Page } from "@playwright/test";
const snapshot = (page: Page) =>
  page.evaluate(() => (window as any).__POCKET__);
async function start(page: Page, name: string) {
  await page.getByRole("button", { name: `Play ${name}`, exact: true }).click();
  await page.getByRole("button", { name: "Let’s play →" }).click();
  await expect.poll(async () => (await snapshot(page))?.scene.ready).toBe(true);
  await page.waitForTimeout(300);
}
async function tapGame(page: Page, x: number, y: number) {
  const box = await page.locator("canvas").boundingBox();
  if (!box) throw Error("No canvas");
  await page.touchscreen.tap(
    box.x + (x / 420) * box.width,
    box.y + (y / 760) * box.height,
  );
}
async function menu(page: Page) {
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Back to all games" }).click();
  await expect(
    page.getByRole("heading", { name: "Pick your play" }),
  ).toBeVisible();
}
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Pick your play" }),
  ).toBeVisible();
});
test("five illustrated games, mobile scrolling and persistent sound controls", async ({
  page,
}) => {
  await expect(page.locator("[data-game]")).toHaveCount(5);
  await page.screenshot({ path: "docs/menu-mobile.png" });
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("switch", { name: /Sound effects/ }).click();
  await expect(
    page.getByRole("switch", { name: /Sound effects/ }),
  ).toHaveAttribute("aria-checked", "false");
  await page.reload();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(
    page.getByRole("switch", { name: /Sound effects/ }),
  ).toHaveAttribute("aria-checked", "false");
  await page.getByRole("button", { name: "Close settings" }).click();
  await page
    .getByRole("button", { name: "Play Tic-Tac-Toe" })
    .scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("button", { name: "Play Tic-Tac-Toe" }),
  ).toBeInViewport();
});
test("full tic-tac-toe win, rematch, draw, persistence, and reset", async ({
  page,
}) => {
  await start(page, "Tic-Tac-Toe");
  await page.screenshot({ path: "docs/tic-tac-toe.png" });
  for (const i of [0, 3, 1, 4, 2])
    await tapGame(page, 102 + (i % 3) * 108, 273 + Math.floor(i / 3) * 108);
  await expect(
    page.getByRole("heading", { name: "Orange takes it!" }),
  ).toBeVisible();
  await page.waitForTimeout(300);
  await page.screenshot({ path: "docs/results.png" });
  expect((await snapshot(page)).saved.wins).toEqual([1, 0]);
  await page.getByRole("button", { name: /Rematch/ }).click();
  await expect
    .poll(
      async () =>
        (await snapshot(page)).scene.game?.cells.filter(Boolean).length,
    )
    .toBe(0);
  await page.waitForTimeout(300);
  for (const i of [0, 1, 2, 4, 3, 5, 7, 6, 8])
    await tapGame(page, 102 + (i % 3) * 108, 273 + Math.floor(i / 3) * 108);
  await expect(
    page.getByRole("heading", { name: "Evenly matched." }),
  ).toBeVisible();
  expect((await snapshot(page)).saved.rounds).toBe(2);
  expect((await snapshot(page)).saved.draws).toBe(1);
  await page.getByRole("button", { name: "Back to all games" }).click();
  await page.reload();
  await expect(page.getByTestId("wins-one")).toHaveText("1");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Reset the scoreboard" }).click();
  await page.getByRole("button", { name: "Yes, reset scores" }).click();
  await page.getByRole("button", { name: "Close settings" }).click();
  await expect(page.getByTestId("wins-one")).toHaveText("0");
});
for (const name of ["Pong", "Air Hockey"])
  test(`${name}: real simultaneous touch identifiers, cancellation and pause`, async ({
    page,
    context,
  }) => {
    await start(page, name);
    const box = (await page.locator("canvas").boundingBox())!;
    const point = (x: number, y: number, id: number) => ({
      x: box.x + (x / 420) * box.width,
      y: box.y + (y / 760) * box.height,
      id,
      radiusX: 5,
      radiusY: 5,
    });
    const cdp = await context.newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [point(140, 580, 1), point(280, 180, 2)],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [point(100, 550, 1), point(320, 210, 2)],
    });
    await page.waitForTimeout(200);
    let s = await snapshot(page);
    expect(s.scene.pointers.every((p: any) => p.down)).toBe(true);
    expect(new Set(s.scene.pointers.map((p: any) => p.id)).size).toBe(2);
    const pieces =
      name === "Pong" ? s.scene.game.paddles : s.scene.game.mallets;
    expect(pieces[0].x).toBeCloseTo(100, 0);
    expect(pieces[1].x).toBeCloseTo(320, 0);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchCancel",
      touchPoints: [],
    });
    await page.waitForTimeout(50);
    expect(
      (await snapshot(page)).scene.pointers.every((p: any) => !p.down),
    ).toBe(true);
    await page.screenshot({
      path: `docs/${name === "Pong" ? "ping-pong" : "air-hockey"}.png`,
    });
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: /Keep playing/ }),
    ).toBeVisible();
    s = await snapshot(page);
    await page.waitForTimeout(200);
    expect((await snapshot(page)).scene.game).toEqual(s.scene.game);
    await page.getByRole("button", { name: /Keep playing/ }).click();
    expect((await snapshot(page)).state).toBe("playing");
  });
test("repeated switching releases every input listener and game object", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (let i = 0; i < 12; i++) {
    const name = ["Pong", "Air Hockey", "Tic-Tac-Toe"][i % 3];
    await start(page, name);
    const s = await snapshot(page);
    expect(s.scene.inputListeners).toBe(name === "Tic-Tac-Toe" ? 1 : 5);
    expect(s.scene.children).toBeLessThan(20);
    await menu(page);
    expect((await snapshot(page)).scene.inputListeners).toBe(0);
  }
  expect(errors).toEqual([]);
});
test("resize keeps the entire portrait field visible; backgrounding requires resume", async ({
  page,
}) => {
  await start(page, "Air Hockey");
  for (const [width, height] of [
    [320, 568],
    [412, 915],
    [768, 1024],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(150);
    const box = (await page.locator("canvas").boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(-1);
    expect(box.y).toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
    expect(box.y + box.height).toBeLessThanOrEqual(height + 1);
  }
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect(
    page.getByRole("heading", { name: "Rivalry on hold." }),
  ).toBeVisible();
  expect((await snapshot(page)).scene.paused).toBe(true);
  await page.getByRole("button", { name: /Keep playing/ }).click();
  expect((await snapshot(page)).scene.paused).toBe(false);
});
