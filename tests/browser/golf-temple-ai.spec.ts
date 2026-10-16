import { test, expect } from "@playwright/test";
for (const difficulty of ["Medium", "Hard", "Impossible"])
  test(`Lost Temple ${difficulty} AI completes the actual worker-driven course`, async ({
    page,
  }) => {
    test.setTimeout(180000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/?aiSeed=123");
    await page
      .getByRole("button", { name: "Play Ultimate Golf", exact: true })
      .click();
    await page.getByRole("button", { name: /1 Player vs AI/ }).click();
    await page.getByRole("button", { name: difficulty, exact: true }).click();
    await page.getByRole("button", { name: /Lost Temple/ }).click();
    await page
      .getByRole("button", { name: "Start attempt", exact: true })
      .click();
    const opponent = () =>
      page.evaluate(
        () => (window as any).__POCKET__.scene.game.competition.opponent,
      );
    await expect
      .poll(
        async () => {
          const s = await opponent();
          return s.ball.x > 900 && s.ball.y < 920;
        },
        { timeout: 45000, intervals: [500, 1000] },
      )
      .toBe(true);
    await expect
      .poll(async () => (await opponent()).status, {
        timeout: 125000,
        intervals: [1000],
      })
      .toBe("won");
    const result = await opponent();
    expect(result.plates.slice(1)).toEqual([true, true]);
    expect(result.strokes).toBeLessThanOrEqual(result.limit);
    console.log(`${difficulty}: ${result.strokes} strokes, Temple completed`);
    await page.screenshot({
      path: `docs/temple-ai-${difficulty.toLowerCase()}.png`,
    });
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: "Back to all games", exact: true })
      .click();
    expect(errors).toEqual([]);
  });
