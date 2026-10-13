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
  await expect.poll(async () => (await state(p)).scene.ready).toBe(true);
  await p.waitForTimeout(300);
}
async function ultimateTap(p: Page, index: number) {
  const b = Math.floor(index / 9),
    c = index % 9;
  await tap(
    p,
    33 + (b % 3) * 120 + ((c % 3) + 0.5) * 38,
    214 + Math.floor(b / 3) * 120 + (Math.floor(c / 3) + 0.5) * 38,
  );
}
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Pick your play" }),
  ).toBeVisible();
});
test("game setup preserves branding, variant selection and an interactive routing tutorial", async ({
  page,
}) => {
  await expect(
    page.getByRole("button", { name: "Play Pong", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Play Tic-Tac-Toe" }).click();
  await page.getByRole("button", { name: /Ultimate —/ }).click();
  await page.getByRole("radio", { name: /1 Player/ }).click();
  await page.getByRole("radio", { name: "Hard", exact: true }).click();
  await page.screenshot({ path: "docs/setup-ai.png" });
  await page.getByRole("button", { name: "How to play Ultimate" }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Try cell 1", exact: true }).click();
  await page.screenshot({ path: "docs/ultimate-tutorial.png" });
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Got it. Let’s play." }).click();
  await expect(
    page.getByRole("radio", { name: "Hard", exact: true }),
  ).toHaveAttribute("aria-checked", "true");
});
for (const name of ["Pong", "Air Hockey"])
  test(`${name} AI moves through the physical controls`, async ({ page }) => {
    await launch(page, name, true);
    const s = await state(page);
    expect(s.scene.options).toMatchObject({
      mode: "ai",
      difficulty: "impossible",
    });
    await expect
      .poll(
        async () => {
          const current = (await state(page)).scene.game;
          const pieces = name === "Pong" ? current.paddles : current.mallets;
          return Math.hypot(
            pieces[1].x - 210,
            pieces[1].y - (name === "Pong" ? 154 : 183),
          );
        },
        { timeout: 10000 },
      )
      .toBeGreaterThan(1);
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("heading", { name: "A little timeout?" }),
    ).toBeVisible();
  });
test("Classic AI takes only its own turn and survives rematch setup", async ({
  page,
}) => {
  await launch(page, "Tic-Tac-Toe", true, "Classic");
  await tap(page, 102, 273);
  await tap(page, 210, 273);
  expect((await state(page)).scene.game.cells.filter(Boolean)).toHaveLength(1);
  await expect
    .poll(
      async () => (await state(page)).scene.game.cells.filter(Boolean).length,
    )
    .toBe(2);
  expect((await state(page)).scene.game.turn).toBe(1);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Start a fresh match" }).click();
  await expect
    .poll(
      async () => (await state(page)).scene.game?.cells.filter(Boolean).length,
    )
    .toBe(0);
  expect((await state(page)).scene.options.mode).toBe("ai");
});
test("Ultimate worker plays legal routed moves and restores a saved match", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await launch(page, "Tic-Tac-Toe", true, "Ultimate");
  await ultimateTap(page, 4);
  await expect.poll(async () => (await state(page)).scene.game.moves).toBe(2);
  let s = (await state(page)).scene.game;
  expect(s.cells.slice(36, 45).filter(Boolean)).toHaveLength(1);
  await page.screenshot({ path: "docs/ultimate.png" });
  await page.reload();
  await page.getByRole("button", { name: /Continue saved game/ }).click();
  await expect.poll(async () => (await state(page)).scene.ready).toBe(true);
  expect((await state(page)).scene.game.cells).toEqual(s.cells);
  expect((await state(page)).scene.options.variant).toBe("ultimate");
  const b = s.forced ?? 0;
  const move = s.cells.slice(b * 9, b * 9 + 9).findIndex((c: unknown) => !c);
  await page.waitForTimeout(300);
  await ultimateTap(page, b * 9 + move);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  expect((await state(page)).scene.game.pending).toBe(false);
  await page.getByRole("button", { name: /Keep playing/ }).click();
  await expect.poll(async () => (await state(page)).scene.game.moves).toBe(4);
  expect(errors).toEqual([]);
});
test("Ultimate local play rejects illegal boards, provides focus view, and completes a full match", async ({
  page,
}) => {
  test.setTimeout(45000);
  await launch(page, "Tic-Tac-Toe", false, "Ultimate");
  await ultimateTap(page, 76);
  expect((await state(page)).scene.game.forced).toBe(4);
  await ultimateTap(page, 0);
  expect((await state(page)).scene.game.moves).toBe(1);
  await tap(page, 210, 610);
  expect((await state(page)).scene.game.focused).toBe(true);
  await page.screenshot({ path: "docs/ultimate-focus.png" });
  await tap(page, 210, 610);
  for (let n = 0; n < 81; n++) {
    const s = (await state(page)).scene.game;
    if (s.winner) break;
    const legal = s.cells.flatMap((c: unknown, i: number) =>
      !c &&
      !s.boards[Math.floor(i / 9)] &&
      (s.forced === null || Math.floor(i / 9) === s.forced)
        ? [i]
        : [],
    );
    expect(legal.length).toBeGreaterThan(0);
    await ultimateTap(page, legal[(n * 17) % legal.length]);
  }
  await expect(page.getByRole("button", { name: /Rematch/ })).toBeVisible();
  expect((await state(page)).saved.rounds).toBe(1);
});
test("two-round tournament persists progress, scores a draw and crowns a champion", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Tournament", exact: true }).click();
  await page.getByLabel("Number of rounds").selectOption("2");
  await page.getByRole("button", { name: "Choose games" }).click();
  await page
    .getByRole("checkbox", { name: "○ Tic-Tac-Toe · Classic", exact: true })
    .click();
  await page.getByRole("button", { name: "Start tournament →" }).click();
  await page.getByRole("button", { name: "Play next round →" }).click();
  await expect.poll(async () => (await state(page)).scene.ready).toBe(true);
  await page.waitForTimeout(300);
  for (const i of [0, 3, 1, 4, 2])
    await tap(page, 102 + (i % 3) * 108, 273 + Math.floor(i / 3) * 108);
  await expect(
    page.getByRole("heading", { name: "Orange wins the round." }),
  ).toBeVisible();
  expect((await state(page)).tournament.points).toEqual([1, 0]);
  await page.getByRole("button", { name: "Save & return to menu" }).click();
  await page.reload();
  await page.getByRole("button", { name: /Resume tournament/ }).click();
  await page.getByRole("button", { name: "Play next round →" }).click();
  await expect.poll(async () => (await state(page)).scene.ready).toBe(true);
  await page.waitForTimeout(300);
  for (const i of [0, 1, 2, 4, 3, 5, 7, 6, 8])
    await tap(page, 102 + (i % 3) * 108, 273 + Math.floor(i / 3) * 108);
  await expect(
    page.getByRole("heading", { name: "Orange is the champion!" }),
  ).toBeVisible();
  expect((await state(page)).tournament.points).toEqual([1.5, 0.5]);
  await page.waitForTimeout(300);
  await page.screenshot({ path: "docs/tournament-champion.png" });
  const id = (await state(page)).tournament.id;
  await page.getByRole("button", { name: "Tournament rematch →" }).click();
  expect((await state(page)).tournament.id).not.toBe(id);
  expect((await state(page)).tournament.points).toEqual([0, 0]);
});
test("AI tournament includes every eligible game and resumes an interrupted Ultimate round", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Tournament", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /1 Player/ })
    .click();
  await page.getByRole("radio", { name: "Hard", exact: true }).click();
  await page.getByLabel("Number of rounds").selectOption("1");
  await page.getByRole("button", { name: "Choose games" }).click();
  await expect(page.getByRole("checkbox")).toHaveCount(5);
  await page
    .getByRole("checkbox", { name: "○ Tic-Tac-Toe · Ultimate", exact: true })
    .click();
  await page.getByRole("button", { name: "Start tournament →" }).click();
  await page.getByRole("button", { name: "Play next round →" }).click();
  await expect.poll(async () => (await state(page)).scene.ready).toBe(true);
  await page.waitForTimeout(300);
  await ultimateTap(page, 4);
  await expect.poll(async () => (await state(page)).scene.game.moves).toBe(2);
  const s = await state(page);
  await page.reload();
  await page.getByRole("button", { name: /Resume tournament/ }).click();
  await page.getByRole("button", { name: "Resume round →" }).click();
  await expect.poll(async () => (await state(page)).scene.ready).toBe(true);
  expect((await state(page)).scene.game.cells).toEqual(s.scene.game.cells);
  expect((await state(page)).tournament.token).toBe(s.tournament.token);
});
