import { test, expect, type Page } from "@playwright/test";
test.setTimeout(60000);
const game = (p: Page) =>
  p.evaluate(() => (window as any).__POCKET__.scene.game);
async function open(p: Page, name: string) {
  await p.goto("/");
  await p.getByRole("button", { name: `Play ${name}`, exact: true }).click();
  if (name === "Ultimate Golf") {
    await p.getByRole("button", { name: /1 Player Casual/ }).click();
    await p.getByRole("button", { name: /Foundry/ }).click();
    await expect.poll(async () => (await game(p)).phase).toBe("playing");
  } else await p.getByRole("button", { name: /Let’s play/ }).click();
  await p.waitForFunction(() => (window as any).__POCKET__.scene.ready);
  await expect(p.locator(".game-transition")).toBeHidden();
}
async function penPoint(p: Page) {
  const b = (await p.locator("canvas").boundingBox())!,
    s = await game(p),
    pen = s.bodies[s.turn];
  return {
    x: b.x + (pen.x * b.width) / 420,
    y: b.y + (pen.y * b.height) / 760,
  };
}
test("Penfight keeps a smooth unclamped mouse drag outside the canvas and releases once", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1200, height: 900 });
  await open(page, "Penfight");
  const b = (await page.locator("canvas").boundingBox())!,
    p = await penPoint(page);
  // An off-axis grab must not manufacture power from the initial finger offset.
  await page.mouse.move(p.x, p.y + (14 * b.height) / 760);
  await page.mouse.down();
  await page.mouse.move(p.x + 1, p.y + (14 * b.height) / 760);
  expect(
    Math.hypot((await game(page)).aim.dx, (await game(page)).aim.dy),
  ).toBeLessThan(2);
  await page.mouse.up();
  expect((await game(page)).shots).toBe(0);
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  await page.mouse.move(b.x - 60, p.y, { steps: 10 });
  await expect.poll(async () => (await game(page)).aim.dx).toBeGreaterThan(210);
  await page.mouse.move(b.x - 100, p.y, { steps: 5 });
  const before = (await game(page)).aim.dx;
  expect(before).toBeGreaterThan(250);
  await page.mouse.up();
  await expect.poll(async () => (await game(page)).shots).toBe(1);
  await page.waitForTimeout(100);
  expect((await game(page)).shots).toBe(1);
  expect((await game(page)).aim).toBeNull();
});
test("Penfight outside touch cancellation and pause never fire a shot", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1100, height: 850 });
  await open(page, "Penfight");
  const cdp = await page.context().newCDPSession(page),
    p = await penPoint(page),
    b = (await page.locator("canvas").boundingBox())!;
  const start = () =>
    cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ ...p, id: 1 }],
    });
  const move = () =>
    cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: b.x - 50, y: p.y, id: 1 }],
    });
  await start();
  await move();
  await expect.poll(async () => (await game(page)).aim.dx).toBeGreaterThan(210);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchCancel",
    touchPoints: [],
  });
  expect((await game(page)).aim).toBeNull();
  expect((await game(page)).shots).toBe(0);
  await start();
  await move();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: /Keep playing/ }),
  ).toBeVisible();
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.getByRole("button", { name: /Keep playing/ }).click();
  expect((await game(page)).shots).toBe(0);
  expect((await game(page)).aim).toBeNull();
  await start();
  await move();
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect.poll(async () => (await game(page)).shots).toBe(1);
  await cdp.detach();
});
test("Golf full and focused touch shots can release over the footer without clicking Retry", async ({
  page,
}) => {
  await open(page, "Ultimate Golf");
  const cdp = await page.context().newCDPSession(page);
  for (const focus of [false, true]) {
    if (focus) {
      await page.getByRole("button", { name: "Retry", exact: true }).click();
      await page.getByRole("button", { name: "Focus", exact: true }).click();
      await page.waitForTimeout(850);
    }
    const field = (await page.locator(".golf-field").boundingBox())!,
      footer = (await page
        .getByRole("button", { name: "Retry", exact: true })
        .boundingBox())!;
    const a = {
      x: field.x + field.width / 2,
      y: field.y + field.height / 2,
      id: 1,
    };
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [a],
    });
    await expect.poll(async () => (await game(page)).aiming).toBe(true);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        {
          x: footer.x + footer.width / 2,
          y: footer.y + footer.height / 2,
          id: 1,
        },
      ],
    });
    expect((await game(page)).aiming).toBe(true);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await expect.poll(async () => (await game(page)).strokes).toBe(1);
    await page.waitForTimeout(200);
    expect((await game(page)).strokes).toBe(1);
    expect((await game(page)).aiming).toBe(false);
  }
  await cdp.detach();
});
test("Golf mouse release beyond the canvas works and exit removes captured input", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1200, height: 900 });
  await open(page, "Ultimate Golf");
  const f = (await page.locator(".golf-field").boundingBox())!,
    b = (await page.locator("canvas").boundingBox())!;
  await page.mouse.move(f.x + f.width / 2, f.y + f.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x - 30, f.y + f.height / 2, { steps: 10 });
  expect((await game(page)).aiming).toBe(true);
  await page.mouse.up();
  await expect.poll(async () => (await game(page)).strokes).toBe(1);
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Back to all games", exact: true })
    .click();
  expect(
    await page.evaluate(() => (window as any).__POCKET__.scene.inputListeners),
  ).toBe(0);
});
