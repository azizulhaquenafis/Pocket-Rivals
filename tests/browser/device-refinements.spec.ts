import { test, expect, type Page } from "@playwright/test";
const game = (p: Page) =>
  p.evaluate(() => (window as any).__POCKET__.scene.game);
async function open(p: Page, name: string) {
  await p.goto("/?aiSeed=77");
  await p.getByRole("button", { name: `Play ${name}`, exact: true }).click();
  await p.getByRole("radio", { name: /2 Players/ }).click();
  await p.getByRole("button", { name: /Let’s play/ }).click();
  await p.waitForFunction(() => (window as any).__POCKET__.scene.ready);
  await expect(p.locator(".game-transition")).toBeHidden();
}
test("desktop turns and both quiz panels stay upright; subtitle clutter is absent", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    isMobile: false,
    hasTouch: false,
    baseURL: "http://127.0.0.1:5173",
  });
  const page = await context.newPage();
  try {
    await open(page, "Hammer Hit");
    await expect.poll(async () => (await game(page)).cooldowns[0]).toBe(0);
    const b = (await page.locator("canvas").boundingBox())!;
    await page.mouse.click(b.x + b.width / 2, b.y + (b.height * 550) / 760);
    await expect.poll(async () => (await game(page)).turn).toBe(1);
    await expect.poll(async () => (await game(page)).turnWait).toBe(0);
    expect((await game(page)).rotation).toBe(0);
    await page.mouse.click(b.x + b.width / 2, b.y + (b.height * 550) / 760);
    await expect.poll(async () => (await game(page)).scores[1].length).toBe(1);
    await page.goto("/");
    await page
      .getByRole("button", { name: "Play Math Quiz", exact: true })
      .click();
    await expect(page.locator(".variant-choice small")).toHaveCount(0);
    await expect(page.locator(".setup-controls")).toHaveCount(0);
    await page.getByRole("radio", { name: /2 Players/ }).click();
    await page.getByRole("button", { name: /Let’s play/ }).click();
    await expect(page.locator(".quiz-side.blue")).toBeVisible();
    await page.waitForFunction(() => (window as any).__POCKET__.scene.ready);
    expect(
      await page
        .locator(".quiz-side.blue")
        .evaluate((e) => getComputedStyle(e).transform),
    ).toBe("none");
    await page.screenshot({ path: "docs/quiz-desktop-upright.png" });
    // Verify PC keyboard controls: Orange (lower half) uses ArrowLeft/ArrowDown/ArrowRight; Blue (upper half) uses KeyA/KeyS/KeyD.
    await expect
      .poll(async () => (await game(page)).phase)
      .toBe("active");
    const q1 = (await game(page)).question;
    await page.keyboard.press(
      ["ArrowLeft", "ArrowDown", "ArrowRight"][q1.correctIndex],
    );
    await expect.poll(async () => (await game(page)).scores[0]).toBe(1);
    await expect(page.locator(".quiz-panel.win-orange")).toBeVisible();
    await expect
      .poll(async () => (await game(page)).phase, { timeout: 5000 })
      .toBe("active");
    await expect(page.locator(".quiz-panel.win-orange")).toHaveCount(0);
    const q2 = (await game(page)).question;
    await page.keyboard.press(["KeyA", "KeyS", "KeyD"][q2.correctIndex]);
    await expect.poll(async () => (await game(page)).scores[1]).toBe(1);
    await expect(page.locator(".quiz-panel.win-blue")).toBeVisible();

    // Connect Four PC keys 1-7 drop directly into columns 1-7
    await open(page, "Connect Four");
    await page.keyboard.press("Digit4");
    await expect.poll(async () => (await game(page)).moves).toBe(1);
    expect((await game(page)).cells[38]).toBe(1);
    await page.waitForTimeout(360);
    await page.keyboard.press("Digit1");
    await expect.poll(async () => (await game(page)).moves).toBe(2);
    expect((await game(page)).cells[35]).toBe(2);
    await page.waitForTimeout(360);
    await page.keyboard.press("Numpad7");
    await expect.poll(async () => (await game(page)).moves).toBe(3);
    expect((await game(page)).cells[41]).toBe(1);
  } finally {
    await context.close();
  }
});
test("mobile quiz still faces the opponent and Lumberjack keeps safe branches above heads", async ({
  page,
}) => {
  await page.goto("/?aiSeed=77");
  await page
    .getByRole("button", { name: "Play Math Quiz", exact: true })
    .click();
  await page.getByRole("radio", { name: /2 Players/ }).click();
  await expect(page.locator(".setup-controls")).toHaveCount(0);
  await page.getByRole("button", { name: /Let’s play/ }).click();
  await page.waitForFunction(() => (window as any).__POCKET__.scene.ready);
  await expect(page.locator(".game-transition")).toBeHidden();
  await expect(page.locator(".quiz-side.blue.local")).toBeVisible();
  await open(page, "Lumberjack");
  for (let i = 0; i < 3; i++) {
    const m = await game(page),
      left = m.pattern[i] !== -1 && m.pattern[i + 1] !== -1;
    await page.keyboard.press(left ? "ArrowLeft" : "ArrowRight");
    await expect
      .poll(async () => (await game(page)).players[0].score)
      .toBe(i + 1);
    await page.waitForTimeout(150);
  }
  expect((await game(page)).players[0].alive).toBe(true);
  await page.screenshot({ path: "docs/lumber-head-clearance.png" });
});
