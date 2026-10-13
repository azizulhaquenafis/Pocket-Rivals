import { test, expect } from "@playwright/test";
test("packaged build reloads and lazy-loads all seven games and AI workers without a network", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const remote: string[] = [];
  page.on("request", (r) => {
    if (
      !r.url().startsWith("http://127.0.0.1:4173") &&
      !r.url().startsWith("data:")
    )
      remote.push(r.url());
  });
  await page.goto("http://127.0.0.1:4173/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page
    .getByRole("button", { name: "Save all games offline", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText(
    "All games saved. Ready to play offline.",
  );
  await page.getByRole("button", { name: "Close settings" }).click();
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Pick your play" }),
  ).toBeVisible();
  for (const name of [
    "Pong",
    "Air Hockey",
    "Tic-Tac-Toe",
    "Connect Four",
    "Mini Golf",
  ]) {
    await page
      .getByRole("button", { name: `Play ${name}`, exact: true })
      .click();
    await page.getByRole("button", { name: "Let’s play →" }).click();
    await page.waitForTimeout(700);
    await expect(page.locator("canvas")).toBeVisible();
    if (name === "Tic-Tac-Toe") {
      const box = (await page.locator("canvas").boundingBox())!;
      for (const i of [0, 3, 1, 4, 2])
        await page.touchscreen.tap(
          box.x + ((102 + (i % 3) * 108) / 420) * box.width,
          box.y + ((273 + Math.floor(i / 3) * 108) / 760) * box.height,
        );
      await expect(
        page.getByRole("heading", { name: "Orange takes it!" }),
      ).toBeVisible();
    } else {
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("heading", { name: "A little timeout?" }),
      ).toBeVisible();
    }
    await page.getByRole("button", { name: "Back to all games" }).click();
  }
  await page
    .getByRole("button", { name: "1 Player Arcade", exact: true })
    .click();
  for (const name of ["Classic Snake", "Star Patrol"]) {
    await page
      .getByRole("button", { name: `Play ${name}`, exact: true })
      .click();
    await page.waitForTimeout(500);
    await expect(page.locator("canvas")).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Back to all games" }).click();
  }
  await page
    .getByRole("button", { name: "2 Player Games", exact: true })
    .click();
  for (const name of ["Tic-Tac-Toe", "Connect Four", "Mini Golf"]) {
    await page
      .getByRole("button", { name: `Play ${name}`, exact: true })
      .click();
    if (name === "Tic-Tac-Toe")
      await page.getByRole("button", { name: /Ultimate —/ }).click();
    await page.getByRole("radio", { name: /1 Player/ }).click();
    await page.getByRole("radio", { name: "Impossible", exact: true }).click();
    await page.getByRole("button", { name: "Let’s play →" }).click();
    await page.waitForTimeout(400);
    const box = (await page.locator("canvas").boundingBox())!;
    const tap = async (x: number, y: number) =>
      page.touchscreen.tap(
        box.x + (x / 420) * box.width,
        box.y + (y / 760) * box.height,
      );
    if (name === "Tic-Tac-Toe") await tap(90, 271);
    if (name === "Connect Four") await tap(210, 260);
    if (name === "Mini Golf") {
      const cdp = await context.newCDPSession(page);
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [
          {
            id: 1,
            x: box.x + (120 / 420) * box.width,
            y: box.y + (540 / 760) * box.height,
          },
        ],
      });
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          {
            id: 1,
            x: box.x + (120 / 420) * box.width,
            y: box.y + (552 / 760) * box.height,
          },
        ],
      });
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await cdp.detach();
    }
    await page.waitForTimeout(1500);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Back to all games" }).click();
  }
  expect(errors).toEqual([]);
  expect(remote).toEqual([]);
  await expect(page.getByTestId("wins-one")).toHaveText("1");
});
