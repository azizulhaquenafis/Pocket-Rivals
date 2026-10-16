import { test, expect, type Page } from "@playwright/test";
const state = (page: Page) =>
  page.evaluate(() => (window as any).__POCKET__.scene);
async function launch(page: Page, name: string, map?: string, ai?: string) {
  await page.goto("/?aiSeed=77");
  await page.getByRole("button", { name: `Play ${name}`, exact: true }).click();
  if (map) await page.getByRole("button", { name: new RegExp(map) }).click();
  await page
    .getByRole("radio", { name: ai ? /1 Player/ : /2 Players/ })
    .click();
  if (ai) await page.getByRole("radio", { name: ai, exact: true }).click();
  await page.getByRole("button", { name: /Let’s play/ }).click();
  await expect.poll(async () => (await state(page)).ready).toBe(true);
}
test("Happy Birds Space and arrows flap separate birds; pause blocks input", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.clock.install();
  await launch(page, "Happy Birds");
  await page.clock.runFor(1150);
  expect((await state(page)).game.between).toBe(0);
  await page.keyboard.press("Space");
  let s = (await state(page)).game;
  expect(s.players.map((p: any) => p.flapSerial)).toEqual([1, 0]);
  await page.keyboard.press("ArrowUp");
  s = (await state(page)).game;
  expect(s.players.map((p: any) => p.flapSerial)).toEqual([1, 1]);
  await page.clock.runFor(170);
  await page.keyboard.press("ArrowRight");
  expect((await state(page)).game.players[1].flapSerial).toBe(2);
  await page.screenshot({ path: "docs/happy-birds-keyboard.png" });
  await page.keyboard.press("Escape");
  await expect.poll(async () => (await state(page)).paused).toBe(true);
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  const paused = (await state(page)).game;
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowDown");
  await page.clock.runFor(500);
  expect((await state(page)).game).toEqual(paused);
  await page
    .getByRole("button", { name: "Back to all games", exact: true })
    .click();
  expect((await state(page)).inputListeners).toBe(0);
  expect(errors).toEqual([]);
});
for (const [name, id] of [
  ["Icy Heights", "ice"],
  ["Green Valley", "green"],
  ["Blue Lagoon", "blue"],
  ["Violet Night", "purple"],
])
  test(`Gravity Runner ${name} loads, has no clock, pauses and cleans up`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize({ width: 360, height: 640 });
    await launch(page, "Gravity Runner", name, "Hard");
    const s = (await state(page)).game;
    expect(s.map).toBe(id);
    expect(s.remaining).toBeUndefined();
    expect(s.obstacles.some((o: any) => o.kind === "platform")).toBe(true);
    await page.waitForTimeout(250);
    expect((await state(page)).game.speed).toBe(120); // Eight-second warm-up.
    await page.screenshot({ path: `docs/gravity-${id}.png` });
    await page.keyboard.press("Escape");
    const paused = (await state(page)).game;
    await page.waitForTimeout(150);
    expect((await state(page)).game).toEqual(paused);
    await page.getByRole("button", { name: /Keep playing/ }).click();
    await page.setViewportSize({ width: 900, height: 500 });
    await page.waitForTimeout(100);
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: "Back to all games", exact: true })
      .click();
    expect((await state(page)).inputListeners).toBe(0);
    expect(errors).toEqual([]);
  });
test("Gravity map previews are distinct and fit a small phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Play Gravity Runner", exact: true })
    .click();
  await expect(page.locator(".map-preview")).toHaveCount(5);
  expect(
    new Set(
      await page
        .locator(".map-preview")
        .evaluateAll((nodes) => nodes.map((n) => n.innerHTML)),
    ).size,
  ).toBe(5);
  expect(
    await page
      .getByRole("dialog")
      .evaluate((n) => n.scrollWidth <= n.clientWidth + 1),
  ).toBe(true);
  await page.screenshot({
    path: "docs/gravity-map-previews.png",
    animations: "disabled",
  });
});
test("both runners can land on the middle rail while both outside walls are missing", async ({
  page,
}) => {
  await page.clock.install();
  await launch(page, "Gravity Runner", "Blue Lagoon", "Hard");
  const initial = (await state(page)).game;
  const gap = initial.gaps.find((g: any) =>
    initial.gaps.some(
      (other: any) => other !== g && other.x === g.x && other.side !== g.side,
    ),
  );
  const rail = initial.obstacles.find(
    (o: any) =>
      o.kind === "platform" && o.x < gap.x && o.x + o.width > gap.x + gap.width,
  );
  for (let i = 0; i < 1200; i++) {
    const s = (await state(page)).game;
    expect(s.round).toBe(1);
    if (s.distance > rail.x + 290) break;
    if (
      s.players[0].gravity !== s.players[1].gravity &&
      s.players[0].cooldown === 0
    )
      await page.keyboard.press("Space");
    await page.clock.runFor(40);
  }
  const s = (await state(page)).game;
  expect(s.distance).toBeGreaterThan(rail.x + 290);
  expect(
    s.gaps.filter((g: any) => g.x < s.distance && g.x + g.width > s.distance),
  ).toHaveLength(2);
  expect(
    s.players.every((p: any) => p.alive && p.y > 50 && p.y < 120 && p.vy === 0),
  ).toBe(true);
  await page.screenshot({
    path: "docs/gravity-middle-rail.png",
    animations: "disabled",
  });
});
