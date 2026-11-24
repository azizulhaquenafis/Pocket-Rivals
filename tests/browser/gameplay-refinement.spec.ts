import { test, expect, type Page } from "@playwright/test";
import {
  COLORS,
  ColorWorld,
  crossing,
} from "../../src/arcade/color-switch/Rules";
import { planCrossing, replayCrossing } from "../helpers/color-switch-replay";
const game = (page: Page) =>
  page.evaluate(() => (window as any).__POCKET__.scene.game);
test("Spike players push, resist and release through ordinary two-player keyboard input", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/?aiSeed=77");
  await page
    .getByRole("button", { name: "Play Spike Attacks", exact: true })
    .click();
  await page.getByRole("radio", { name: /2 Players/ }).click();
  await page.getByRole("button", { name: /Let’s play/ }).click();
  await expect.poll(async () => (await game(page))?.players?.length).toBe(2);
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  const initial = (await game(page)).players;
  await page.keyboard.down("ArrowRight");
  await page.clock.runFor(800);
  const pushed = (await game(page)).players;
  expect(pushed[1].x).toBeGreaterThan(initial[1].x + 8);
  expect(pushed[1].x - pushed[0].x).toBeCloseTo(18, 1);
  await page.keyboard.down("KeyA");
  await page.clock.runFor(250);
  const resisted = (await game(page)).players;
  expect(Math.abs(resisted[0].x - pushed[0].x)).toBeLessThan(2);
  await page.keyboard.up("ArrowRight");
  await page.clock.runFor(150);
  expect((await game(page)).players[0].x).toBeLessThan(resisted[0].x - 6);
  await page.keyboard.up("KeyA");
  await page.keyboard.press("Escape");
  const paused = await game(page);
  await page.clock.runFor(500);
  expect(await game(page)).toEqual(paused);
  await page
    .getByRole("button", { name: "Back to all games", exact: true })
    .click();
  expect(
    await page.evaluate(() => (window as any).__POCKET__.scene.inputListeners),
  ).toBe(0);
});
test("Color Switch offers distinct tiers, single hops, steering and clean pause/exit", async ({
  page,
}) => {
  await page.clock.install();
  const widths: number[] = [];
  const speeds: number[] = [];
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const tier of ["Medium", "Hard", "Impossible"]) {
    await page.clock.resume();
    await page.goto("/");
    await page
      .getByRole("button", { name: "1 Player Arcade", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Play Color Switch", exact: true })
      .click();
    await page.getByRole("button", { name: tier, exact: true }).click();
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
    const initial = await game(page);
    expect(initial.difficulty).toBe(tier.toLowerCase());
    widths.push(initial.obstacle.windowWidth);
    await page.keyboard.down("ArrowRight");
    await page.clock.runFor(160);
    await page.keyboard.up("ArrowRight");
    const steered = await game(page);
    expect(steered.x).toBeGreaterThan(initial.x + 5);
    speeds.push(Math.abs(steered.obstacle.phase - initial.obstacle.phase));
    await page.keyboard.down("Space");
    await page.clock.runFor(160);
    expect((await game(page)).y).toBeLessThan(initial.floor - 20);
    await page.keyboard.down("Space"); // A repeated keydown still counts as the same press.
    await page.clock.runFor(290);
    expect((await game(page)).vy).toBeGreaterThan(0);
    await page.keyboard.press("Escape");
    const paused = await game(page);
    await page.clock.runFor(180);
    expect(await game(page)).toEqual(paused);
    await page.keyboard.up("Space");
    await page.getByRole("button", { name: /Keep playing/ }).click();
    await page.clock.runFor(350);
    expect((await game(page)).y).toBe(initial.floor);
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: "Back to all games", exact: true })
      .click();
    expect(
      await page.evaluate(
        () => (window as any).__POCKET__.scene.inputListeners,
      ),
    ).toBe(0);
  }
  expect(widths[0]).toBeGreaterThan(widths[1]);
  expect(widths[1]).toBeGreaterThan(widths[2]);
  expect(speeds[0]).toBeLessThan(speeds[1]);
  expect(speeds[1]).toBeLessThan(speeds[2]);
  expect(errors).toEqual([]);
});

for (const tier of ["medium", "hard", "impossible"] as const) {
  test(`Color Switch ${tier} waits inside, times both exits and resumes after a fall`, async ({
    page,
  }) => {
    await launchColorSwitch(page, tier[0].toUpperCase() + tier.slice(1));
    const box = (await page.locator("canvas").boundingBox())!;
    const tapBoard = () =>
      page.touchscreen.tap(box.x + box.width / 2, box.y + box.height * 0.55);
    const model = new ColorWorld(tier);

    let state = await game(page);
    let firstInside: number | undefined;
    let insideTime = 0;
    for (let i = 0; i < 2; i++) {
      Object.assign(model, {
        time: state.time,
        x: state.x,
        y: state.y,
        vy: state.vy,
        camera: state.camera,
      });
      const contour = model.obstacle();
      const taps = planCrossing(model, 18);
      let last = 0;
      for (let tick = 0; tick < taps.length; tick++) {
        if (!taps[tick]) continue;
        if (tick > last) await page.clock.runFor((tick - last) * 50);
        const beforeTap = await game(page);
        expect(
          beforeTap.lives,
          `${tier} shape ${i + 1}, tap at ${beforeTap.time.toFixed(2)}s`,
        ).toBe(3);
        if (
          i === 0 &&
          beforeTap.y > crossing(contour, false).y + 20 &&
          beforeTap.y < crossing(contour, true).y - 20
        ) {
          const tapTime: number = beforeTap.time;
          firstInside ??= tapTime;
          insideTime = tapTime - firstInside;
        }
        await tapBoard();
        last = tick;
      }
      await page.clock.runFor((taps.length - last) * 50);
      replayCrossing(model, taps);
      state = await game(page);
      if (state.cleared === i) {
        await page.clock.runFor(32);
        state = await game(page);
      }
      expect(state.lives, `${tier} shape ${i + 1}`).toBe(3);
      expect(state.cleared).toBe(i + 1);
      expect(state.color).toBe(i + 1);
      expect(state.score).toBe((i + 1) * 100);
    }
    expect(insideTime).toBeGreaterThan(0.3);
    expect(state.obstacle.shape).toBe("shutters");

    for (let tick = 0; tick < 100 && state.lives === 3; tick++) {
      await page.clock.runFor(16);
      state = await game(page);
    }
    expect(state.lives).toBe(2);
    expect(state.grace).toBeGreaterThan(0);
    const retry = state;
    await tapBoard();
    await page.clock.runFor(450);
    state = await game(page);
    expect(state.y).toBeLessThan(retry.y - 10);
    expect(state.score).toBe(200);
    expect(state.color).toBe(2);
    expect(state.lives).toBe(2);
  });
}

test("Color Switch touch drag keeps its aim after release and across later taps", async ({
  page,
}) => {
  await launchColorSwitch(page, "Medium");
  const box = (await page.locator("canvas").boundingBox())!;
  const cdp = await page.context().newCDPSession(page);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const offset = (32 * box.width) / 420;

  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ id: 1, x, y }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ id: 1, x: x + offset, y }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.clock.runFor(100);
  const released = await game(page);
  expect(released.x).toBeGreaterThan(213);
  await page.touchscreen.tap(x - offset * 2, y);
  await page.clock.runFor(380);
  const settled = await game(page);
  expect(settled.x).toBeGreaterThan(237);
  expect(settled.x).toBeLessThan(245);
  expect(settled.lives).toBe(3);
  await cdp.detach();
});

test("Color Switch colors travel around a fixed ring at the same speed", async ({
  page,
}) => {
  await launchColorSwitch(page, "Impossible");
  await page.clock.runFor(32);
  const before = await game(page);
  const colorsBefore = await sampleRing(page);
  let after = before;
  for (
    let tick = 0;
    tick < 30 && Math.abs(after.obstacle.phase - before.obstacle.phase) < 17;
    tick++
  ) {
    await page.clock.runFor(350);
    after = await game(page);
  }
  const colorsAfter = await sampleRing(page);
  const count = colorsBefore.length;
  const phaseShift = after.obstacle.phase - before.obstacle.phase;
  const shift = Math.round(
    (phaseShift * count) / (2 * Math.PI * before.obstacle.extent),
  );
  expect(Math.abs(shift)).toBeGreaterThan(8);
  // Some samples land on the antialiased seams between two painted bands.
  expect(colorsBefore.filter((color) => color >= 0).length).toBeGreaterThan(
    count * 0.96,
  );
  expect(colorsAfter.filter((color) => color >= 0).length).toBeGreaterThan(
    count * 0.96,
  );
  for (let color = 0; color < COLORS.length; color++) {
    const samples = colorsBefore.flatMap((value, i) =>
      value === color ? [i] : [],
    );
    expect(samples.length).toBeGreaterThan(25);
    const matching = samples.filter(
      (i) => colorsAfter[(i + shift + count) % count] === color,
    );
    expect(matching.length / samples.length).toBeGreaterThan(0.92);
  }
});

async function sampleRing(page: Page) {
  const box = (await page.locator("canvas").boundingBox())!;
  const png = (await page.screenshot({ scale: "css" })).toString("base64");
  return page.evaluate(
    async ({ png, box, colors }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${png}`;
      await image.decode();
      const canvas = new OffscreenCanvas(image.width, image.height);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(image, 0, 0);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      return Array.from({ length: 360 }, (_, i) => {
        const angle = (i * Math.PI) / 180 - Math.PI / 2;
        const x = Math.round(
          box.x + ((210 + Math.cos(angle) * 88) * box.width) / 420,
        );
        const y = Math.round(
          box.y + ((350 + Math.sin(angle) * 88) * box.height) / 760,
        );
        const index = (y * canvas.width + x) * 4;
        return colors.findIndex(
          (color) =>
            Math.abs(pixels[index] - (color >> 16)) < 24 &&
            Math.abs(pixels[index + 1] - ((color >> 8) & 255)) < 24 &&
            Math.abs(pixels[index + 2] - (color & 255)) < 24,
        );
      });
    },
    { png, box, colors: COLORS },
  );
}

async function launchColorSwitch(page: Page, tier: string) {
  await page.clock.install();
  await page.goto("/");
  await page
    .getByRole("button", { name: "1 Player Arcade", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Play Color Switch", exact: true })
    .click();
  const difficulty = page.getByRole("button", { name: tier, exact: true });
  await expect(difficulty).toBeVisible();
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 300));
  await difficulty.click({ force: true });
  expect((await game(page)).started).toBe(true);
  expect((await game(page)).time).toBe(0);
}

test("four redesigned previews load as lightweight local SVGs in production", async ({
  page,
}) => {
  await page.goto("http://127.0.0.1:4173/");
  for (const [section, names] of [
    ["2 Player Games", ["Lumberjack", "Fruit Duel"]],
    ["1 Player Arcade", ["Color Switch", "Pocket Climber"]],
  ] as const) {
    await page.getByRole("button", { name: section, exact: true }).click();
    for (const name of names) {
      const card = page.getByRole("button", {
        name: `Play ${name}`,
        exact: true,
      });
      await card.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          card
            .locator("img")
            .evaluate(
              (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
            ),
        )
        .toBe(true);
      expect(await card.locator("img").getAttribute("src")).toMatch(/\.svg$/);
      await card.screenshot({
        path: `/tmp/preview-${name.toLowerCase().replaceAll(" ", "-")}.png`,
      });
    }
  }
});
