import { test, expect } from "@playwright/test";
const snapshot = (page: any) =>
  page.evaluate(() => (window as any).__POCKET__.scene.game);
async function launch(page: any, name: string) {
  await page.goto("/?diagnostics&aiSeed=77");
  await page.getByRole("button", { name: `Play ${name}`, exact: true }).click();
  await page.getByRole("radio", { name: /2 Players/ }).click();
  await page.getByRole("button", { name: /Let’s play/ }).click();
  await page.waitForFunction(() => (window as any).__POCKET__.scene.ready);
}
test("Gravity foreground round deadline, pause, reset and live clock", async ({
  page,
}) => {
  await page.clock.install();
  await launch(page, "Gravity Runner");
  await page.keyboard.press("Escape");
  await expect
    .poll(() => page.evaluate(() => (window as any).__POCKET__.scene.paused))
    .toBe(true);
  const paused = await snapshot(page);
  await page.clock.fastForward(125000);
  expect(await snapshot(page)).toEqual(paused);
  await page.getByRole("button", { name: /Keep playing/ }).click();
  await page.clock.runFor(50);
  await page.clock.fastForward(121000);
  await expect.poll(async () => (await snapshot(page)).timedOut).toBe(true);
  const draw = await snapshot(page);
  expect(draw.scores).toEqual([0, 0]);
  expect(draw.remaining).toBe(0);
  expect(draw.players.every((p: any) => p.alive)).toBe(true);
  await page.screenshot({ path: "test-results/gravity-round-draw.png" });
  await page.clock.runFor(1300);
  const next = await snapshot(page);
  expect(next.round).toBe(2);
  expect(next.map).not.toBe(draw.map);
  expect(next.remaining).toBeGreaterThan(115); // Browser screenshots/commands also consume foreground time.
  expect(next.remaining).toBeLessThanOrEqual(120);
  expect(next.speed).toBe(145);
});
test("long quiz equations scroll on touch without answering or overflowing the page", async ({
  page,
}) => {
  await launch(page, "Math Quiz");
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 760 });
    await page.evaluate(async () => {
      const { renderMath } = await import(
        "/src/games/math-quiz/MathUI.ts" as string
      );
      document.querySelectorAll<HTMLElement>(".quiz-formula").forEach((n) => {
        renderMath(
          String.raw`\alpha,\beta\text{ solve }x^2-35x+72=0.\quad\alpha^2+\beta^2=?`,
          n,
        );
        n.scrollLeft = 0;
      });
    });
    await page.waitForTimeout(120);
    const geometry = await page
      .locator(".quiz-formula")
      .evaluateAll((nodes) =>
        nodes.map((n) => ({
          client: n.clientWidth,
          scroll: n.scrollWidth,
          font: parseFloat(getComputedStyle(n).fontSize),
        })),
      );
    expect(geometry.every((g) => g.scroll > g.client && g.font >= 16)).toBe(
      true,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const node = page.locator(".quiz-side.orange .quiz-formula");
    const b = (await node.boundingBox())!;
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: b.x + b.width * 0.85, y: b.y + b.height * 0.5 }],
    });
    for (let i = 1; i <= 8; i++)
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          { x: b.x + b.width * (0.85 - i * 0.075), y: b.y + b.height * 0.5 },
        ],
      });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await expect
      .poll(() => node.evaluate((n) => n.scrollLeft))
      .toBeGreaterThan(10);
    expect((await snapshot(page)).scores).toEqual([0, 0]);
    await page.screenshot({ path: `test-results/quiz-scroll-${width}.png` });
    await cdp.detach();
  }
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Back to all games", exact: true })
    .click();
  await expect(page.locator(".quiz-overlay")).toHaveCount(0);
  await expect(page.locator("#game-stage")).not.toHaveClass(
    /quiz-scroll-enabled/,
  );
});
