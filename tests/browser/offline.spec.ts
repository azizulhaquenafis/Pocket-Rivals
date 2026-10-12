import { test, expect } from "@playwright/test";
test("packaged build reloads and lazy-loads all three games without a network", async ({
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
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Pick your play" }),
  ).toBeVisible();
  for (const name of ["Pong", "Air Hockey", "Tic-Tac-Toe"]) {
    await page
      .getByRole("button", { name: `Play ${name}`, exact: true })
      .click();
    await page.getByRole("button",{name:"Let’s play →"}).click();
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
  expect(errors).toEqual([]);
  expect(remote).toEqual([]);
  await expect(page.getByTestId("wins-one")).toHaveText("1");
});
