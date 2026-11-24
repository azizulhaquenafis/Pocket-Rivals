import { test, expect } from "@playwright/test";
const names = [
  "Tower Stack",
  "Orbit Hop",
  "Color Switch",
  "Perfect Pour",
  "Pocket Climber",
];
for (const [width, height, mobile] of [
  [320, 568, true],
  [844, 390, true],
  [1280, 800, false],
] as const)
  test(`Arcade inputs and viewport ${width}×${height}`, async ({ browser }) => {
    test.setTimeout(90000);
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: mobile,
      hasTouch: mobile,
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const name of names) {
      await page.goto("http://127.0.0.1:5173/");
      await page
        .getByRole("button", { name: "1 Player Arcade", exact: true })
        .click();
      await page
        .getByRole("button", { name: `Play ${name}`, exact: true })
        .click();
      await page.getByRole("button", { name: "Medium", exact: true }).click();
      await page.waitForFunction(() => (window as any).__POCKET__.scene.ready);
      const b = (await page.locator("canvas").boundingBox())!,
        pos = (x: number, y: number) => ({
          x: b.x + (x * b.width) / 420,
          y: b.y + (y * b.height) / 760,
        });
      expect(b.x).toBeGreaterThanOrEqual(-1);
      expect(b.y).toBeGreaterThanOrEqual(-1);
      expect(b.x + b.width).toBeLessThanOrEqual(width + 1);
      expect(b.y + b.height).toBeLessThanOrEqual(height + 1);
      const state = () =>
        page.evaluate(() => (window as any).__POCKET__.scene.game);
      const cdp = await context.newCDPSession(page);
      const start = async (x: number, y: number) => {
        const p = pos(x, y);
        if (mobile)
          await cdp.send("Input.dispatchTouchEvent", {
            type: "touchStart",
            touchPoints: [{ id: 1, ...p }],
          });
        else {
          await page.mouse.move(p.x, p.y);
          await page.mouse.down();
        }
      };
      const move = async (x: number, y: number) => {
        const p = pos(x, y);
        if (mobile)
          await cdp.send("Input.dispatchTouchEvent", {
            type: "touchMove",
            touchPoints: [{ id: 1, ...p }],
          });
        else await page.mouse.move(p.x, p.y);
      };
      const end = async () => {
        if (mobile)
          await cdp.send("Input.dispatchTouchEvent", {
            type: "touchEnd",
            touchPoints: [],
          });
        else await page.mouse.up();
      };
      if (name === "Ricochet") {
        await start(210, 580);
        await move(210, 720);
        await end();
        await expect.poll(async () => (await state()).shots).toBe(4);
      } else if (name === "Perfect Pour") {
        await start(210, 450);
        await page.waitForTimeout(150);
        await end();
        expect((await state()).volume).toBeGreaterThan(0);
      } else if (name === "Pocket Climber") {
        await start(300, 500);
        await page.waitForTimeout(120);
        await end();
        expect((await state()).x).toBeGreaterThan(210);
      } else if (name === "Slide Escape") {
        await start(48 + 1.5 * 54, 190 + 0.5 * 54);
        await end();
        expect((await state()).selected).toBeGreaterThan(0);
      } else {
        await start(210, name === "Pocket Pinball" ? 618 : 400);
        if (name === "Color Switch") await page.waitForTimeout(200);
        await end();
        await page.waitForTimeout(50);
        if (name === "Tower Stack")
          expect((await state()).score).toBeGreaterThan(0);
        if (name === "Pocket Pinball")
          expect((await state()).balls.length).toBe(1);
        if (name === "Color Switch")
          expect((await state()).y).toBeLessThan(540);
        if (name === "Orbit Hop") expect((await state()).orbit).toBe(false);
      }
      await cdp.detach();
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("button", { name: /Keep playing/ }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Back to all games", exact: true })
        .click();
      expect(
        await page.evaluate(
          () => (window as any).__POCKET__.scene.inputListeners,
        ),
      ).toBe(0);
    }
    expect(errors).toEqual([]);
    await context.close();
  });
