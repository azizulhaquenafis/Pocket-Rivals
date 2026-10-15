import { test, expect, type Page } from "@playwright/test";
const state = (p: Page) => p.evaluate(() => (window as any).__POCKET__);
async function tap(p: Page, x: number, y: number) {
  const b = (await p.locator("canvas").boundingBox())!;
  await p.touchscreen.tap(
    b.x + (x / 420) * b.width,
    b.y + (y / 760) * b.height,
  );
}
test("seeded personalities, all AI lifecycles, and worker cleanup survive repeated navigation", async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    const Original = window.Worker;
    const active = new Set<Worker>();
    (window as any).__aiWorkers = active;
    window.Worker = class extends Original {
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        active.add(this);
      }
      terminate() {
        active.delete(this);
        super.terminate();
      }
    };
  });
  await page.goto("/?aiSeed=314159&aiReplay&diagnostics");
  for (const [name, variant, x, y] of [
    ["Pong", "", 0, 0],
    ["Air Hockey", "", 0, 0],
    ["Tic-Tac-Toe", "Classic", 102, 273],
    ["Tic-Tac-Toe", "Ultimate", 52, 233],
    ["Connect Four", "", 210, 280],
    ["Dots and Boxes", "", 97, 240],
    ["Hammer Hit", "", 0, 0],
    ["Light Fingers", "", 0, 0],
    ["Fruit Duel", "", 0, 0],
    ["Lumberjack", "", 0, 0],
    ["Connect Four", "", 160, 280],
    ["Dots and Boxes", "", 172, 240],
  ] as const) {
    await page
      .getByRole("button", { name: `Play ${name}`, exact: true })
      .click();
    if (variant)
      await page
        .getByRole("button", { name: new RegExp(variant + " —") })
        .click();
    await page.getByRole("radio", { name: /1 Player/ }).click();
    await page.getByRole("radio", { name: "Hard", exact: true }).click();
    await page.getByRole("button", { name: /Let’s play/ }).click();
    await expect.poll(async () => (await state(page)).scene.ready).toBe(true);
    await page.waitForTimeout(320);
    expect((await state(page)).scene.game.ai.seed).toBe(314159);
    if (x) await tap(page, x, y);
    await page.waitForTimeout(750);
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("heading", { name: "A little timeout?" }),
    ).toBeVisible();
    const paused = (await state(page)).scene.game;
    await page.waitForTimeout(350);
    expect((await state(page)).scene.game).toEqual(paused);
    expect(await page.evaluate(() => (window as any).__aiWorkers.size)).toBe(0);
    await page.getByRole("button", { name: /Keep playing/ }).click();
    await page.waitForTimeout(150);
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: "Back to all games", exact: true })
      .click();
    expect((await state(page)).scene.inputListeners).toBe(0);
    expect(await page.evaluate(() => (window as any).__aiWorkers.size)).toBe(0);
  }
  expect(errors).toEqual([]);
});
test("fixed seed repeats a strategy move and saved match retains its personality", async ({
  page,
}) => {
  const moves: number[] = [];
  for (let run = 0; run < 2; run++) {
    await page.goto("/?aiSeed=2026&aiReplay");
    await page
      .getByRole("button", { name: "Play Connect Four", exact: true })
      .click();
    await page.getByRole("radio", { name: /1 Player/ }).click();
    await page.getByRole("radio", { name: "Impossible", exact: true }).click();
    await page.getByRole("button", { name: /Let’s play/ }).click();
    await expect.poll(async () => (await state(page)).scene.ready).toBe(true);
    await page.waitForTimeout(350);
    await tap(page, 110, 280);
    await expect.poll(async () => (await state(page)).scene.game.moves).toBe(2);
    let s = (await state(page)).scene.game;
    moves.push(s.cells.findIndex((c: number) => c === 2));
    await page.reload();
    await page.getByRole("button", { name: /Continue saved game/ }).click();
    await expect.poll(async () => (await state(page)).scene.ready).toBe(true);
    expect((await state(page)).scene.game.ai).toEqual(s.ai);
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: "Back to all games", exact: true })
      .click();
  }
  expect(moves[0]).toBe(moves[1]);
});
