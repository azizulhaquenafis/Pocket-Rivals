import { test, expect } from "@playwright/test";

test("production Star Patrol launches with mobile and desktop controls", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:4173/");
  await page
    .getByRole("button", { name: "1 Player Arcade", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Play Star Patrol", exact: true })
    .click();
  await expect(page.locator("canvas")).toBeVisible();
  await page.waitForTimeout(900);
  const box = (await page.locator("canvas").boundingBox())!;
  const cdp = await context.newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { id: 1, x: box.x + box.width / 2, y: box.y + box.height * 0.79 },
    ],
  });
  await page.waitForTimeout(400);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.keyboard.down("Space");
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(300);
  await page.keyboard.up("ArrowRight");
  await page.keyboard.up("Space");
  await page.screenshot({ path: "docs/star-patrol-desktop.png" });
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: /Keep playing/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Back to all games", exact: true })
    .click();
  await expect(page.locator("canvas")).not.toBeVisible();
  expect(errors).toEqual([]);
});

test("Star Patrol earns real loot, advances levels and freezes gear on pause", async ({
  page,
  context,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?aiSeed=42");
  await page
    .getByRole("button", { name: "1 Player Arcade", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Play Star Patrol", exact: true })
    .click();
  const snapshot = () => page.evaluate(() => (window as any).__POCKET__);
  await expect.poll(async () => (await snapshot()).state).toBe("playing");
  await page.clock.install();
  const box = (await page.locator("canvas").boundingBox())!;
  const cdp = await context.newCDPSession(page);
  const point = (x: number) => ({
    id: 1,
    x: box.x + (x / 420) * box.width,
    y: box.y + (600 / 760) * box.height,
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [point(210)],
  });
  let earned = false,
    advanced = false,
    sawDrop = false;
  for (let i = 0; i < 420; i++) {
    const w = (await snapshot()).scene.game;
    earned ||= w.pickupSerial > 0;
    advanced ||= w.wave > 1;
    sawDrop ||= w.pickups.length > 0;
    if (w.dead || (earned && advanced)) break;
    const loot = [...w.pickups].sort((a: any, b: any) => b.y - a.y)[0];
    // Exercise normal touch input; no game state or scoring is modified.
    const enemy =
      w.enemies.find((e: any) => e.kind === 4) ??
      [...w.enemies].sort((a: any, b: any) => b.y - a.y)[0];
    const desired = loot ? loot.x : enemy ? enemy.x : 210;
    // Dodge projected enemy fire using the same legal touch steering as a player.
    let target = desired,
      best = Infinity;
    for (let x = 44; x <= 376; x += 8) {
      let cost = Math.abs(x - desired) * 0.2 + Math.abs(x - w.player.x) * 0.02;
      for (const p of w.projectiles.filter((p: any) => p.enemy)) {
        const time = (w.player.y - p.y) / p.vy;
        if (time < 0 || time > 1.2) continue;
        const reach =
          w.player.x +
          Math.max(-370 * time, Math.min(370 * time, x - w.player.x));
        cost += Math.max(0, 36 - Math.abs(reach - (p.x + p.vx * time))) * 25;
      }
      if (cost < best) {
        best = cost;
        target = x;
      }
    }
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [point(target)],
    });
    await page.clock.runFor(250);
  }
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  const w = (await snapshot()).scene.game;
  expect(sawDrop).toBe(true);
  expect(earned).toBe(true);
  expect(advanced).toBe(true);
  expect(w.dead).toBe(false);
  expect(w.poolSize).toBe(80);
  expect(w.kills).toBeGreaterThanOrEqual(12);
  expect(w.gear).toEqual({
    level: 0,
    rapid: 0,
    laser: 0,
    drone: 0,
    shield: false,
  });
  await page.screenshot({ path: "docs/star-patrol-upgraded.png" });
  await page.keyboard.press("Escape");
  const paused = (await snapshot()).scene.game;
  await page.clock.runFor(3000);
  expect((await snapshot()).scene.game).toEqual(paused);
  await page.getByRole("button", { name: /Keep playing/ }).click();
  await page.clock.runFor(500);
  expect((await snapshot()).scene.game.elapsed).toBeGreaterThan(paused.elapsed);
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Back to all games", exact: true })
    .click();
  expect((await snapshot()).scene.inputListeners).toBe(0);
  await expect(page.locator("canvas")).not.toBeVisible();
  expect((await snapshot()).saved.rounds).toBe(0);
  expect(errors).toEqual([]);
});
