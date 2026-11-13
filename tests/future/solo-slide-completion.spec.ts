import { test, expect, type Page } from "@playwright/test";
async function launch(page: Page, name: string) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "1 Player Arcade", exact: true })
    .click();
  await page.getByRole("button", { name: `Play ${name}`, exact: true }).click();
  await page.waitForFunction(() => (window as any).__POCKET__.scene.ready);
}
const state = (page: Page) =>
  page.evaluate(() => (window as any).__POCKET__.scene.game);
async function point(page: Page, x: number, y: number) {
  const b = (await page.locator("canvas").boundingBox())!;
  return { x: b.x + (x * b.width) / 420, y: b.y + (y * b.height) / 760 };
}
test("Slide Escape: solve all eight puzzles through real pointer moves and finish", async ({
  page,
}) => {
  test.setTimeout(120000);
  await launch(page, "Slide Escape");
  for (let level = 0; level < 8; level++) {
    const plan = await page.evaluate(async () => {
      const { canMove, apply } = await import(
        "/src/arcade/slide-escape/Rules.ts" as string
      );
      const start = (window as any).__POCKET__.scene.game.pieces;
      const key = (p: any[]) => p.map((p) => (p.vertical ? p.y : p.x)).join("");
      const queue = [{ pieces: start, path: [] as { i: number; d: number }[] }],
        seen = new Set([key(start)]);
      for (let at = 0; at < queue.length && at < 40000; at++) {
        const { pieces, path } = queue[at];
        if (pieces[0].x === 4) return path;
        for (let i = 0; i < pieces.length; i++)
          for (let d = -5; d <= 5; d++)
            if (d && canMove(pieces, i, d)) {
              const next = pieces.map((p: any) => ({ ...p }));
              apply(next, i, d);
              const k = key(next);
              if (seen.has(k)) continue;
              seen.add(k);
              queue.push({ pieces: next, path: [...path, { i, d }] });
            }
      }
      throw Error("No bounded solution");
    });
    for (const move of plan) {
      const w = await state(page),
        p = w.pieces[move.i];
      const a = await point(
          page,
          48 + (p.x + 0.5) * 54,
          190 + (p.y + 0.5) * 54,
        ),
        b = await point(
          page,
          48 + (p.x + 0.5 + (p.vertical ? 0 : move.d)) * 54,
          190 + (p.y + 0.5 + (p.vertical ? move.d : 0)) * 54,
        );
      await page.mouse.move(a.x, a.y);
      await page.mouse.down();
      await page.mouse.move(b.x, b.y, { steps: 4 });
      await page.mouse.up();
    }
    expect((await state(page)).cleared).toBe(true);
    const next = await point(page, 210, 590);
    await page.mouse.click(next.x, next.y);
  }
  await expect(
    page.getByRole("button", { name: "Play again →" }),
  ).toBeVisible();
  expect((await state(page)).score).toBeGreaterThan(1000);
  await page.getByRole("button", { name: "Play again →" }).click();
  await expect.poll(async () => (await state(page)).level).toBe(0);
});
