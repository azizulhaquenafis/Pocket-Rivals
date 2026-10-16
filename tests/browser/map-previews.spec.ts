import { test, expect } from "@playwright/test";
test("Spike map picker shows distinct previews without horizontal overflow on a small phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto("/?aiSeed=77");
  const spikeCard = page.getByRole("button", {
    name: "Play Spike Attacks",
    exact: true,
  });
  await spikeCard.scrollIntoViewIfNeeded();
  await spikeCard.screenshot({
    path: "docs/spike-attacks-polished-preview.png",
    animations: "disabled",
  });
  await spikeCard.click();
  await expect(page.locator(".map-preview")).toHaveCount(4);
  const previews = await page.locator(".map-preview").evaluateAll((nodes) =>
    nodes.map((n) => ({
      width: n.getBoundingClientRect().width,
      height: n.getBoundingClientRect().height,
      art: n.innerHTML,
    })),
  );
  expect(new Set(previews.map((p) => p.art)).size).toBe(4);
  expect(previews.every((p) => p.width >= 60 && p.height >= 60)).toBe(true);
  expect(
    await page
      .getByRole("dialog")
      .evaluate((n) => n.scrollWidth <= n.clientWidth + 1),
  ).toBe(true);
  await page.screenshot({
    path: "docs/spike-map-previews.png",
    animations: "disabled",
  });
  await page.getByRole("button", { name: /Crosswind/ }).click();
  await page.getByRole("radio", { name: /1 Player/ }).click();
  await page.getByRole("button", { name: /Let’s play/ }).click();
  await expect
    .poll(() => page.evaluate(() => (window as any).__POCKET__.scene.ready))
    .toBe(true);
  expect(
    await page.evaluate(() => (window as any).__POCKET__.scene.game.map),
  ).toBe("crosswind");
});
test("Golf shows four actual portrait course overviews and still launches Temple", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 1000 });
  await page.goto("/?aiSeed=123");
  await page
    .getByRole("button", { name: "Play Ultimate Golf", exact: true })
    .click();
  await page.getByRole("button", { name: /1 Player Casual/ }).click();
  await expect(page.locator(".golf-course-preview")).toHaveCount(4);
  const distinct = await page
    .locator(".golf-course-preview")
    .evaluateAll((nodes) => nodes.map((n) => n.innerHTML));
  expect(new Set(distinct).size).toBe(4);
  await page.screenshot({
    path: "docs/golf-course-previews.png",
    animations: "disabled",
  });
  await page.setViewportSize({ width: 360, height: 640 });
  await page
    .getByRole("button", { name: /Lost Temple/ })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: "docs/golf-course-previews-mobile.png" });
  await page.getByRole("button", { name: /Lost Temple/ }).click();
  await expect
    .poll(() =>
      page.evaluate(() => (window as any).__POCKET__.scene.game.course),
    )
    .toBe("temple");
});

test("Happy Birds retains the shared arena with a clean rounded presentation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto("/?aiSeed=77");
  const card = page.getByRole("button", {
    name: "Play Happy Birds",
    exact: true,
  });
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator(".card-art rect")).toHaveCount(0);
  await card.screenshot({
    path: "docs/happy-birds-simple-preview.png",
    animations: "disabled",
  });
  await page
    .getByRole("button", { name: "Play Happy Birds", exact: true })
    .click();
  await page.getByRole("radio", { name: /2 Players/ }).click();
  await page.getByRole("button", { name: /Let’s play/ }).click();
  await expect
    .poll(() => page.evaluate(() => (window as any).__POCKET__.scene.ready))
    .toBe(true);
  await page.screenshot({
    path: "docs/happy-birds-refined.png",
    animations: "disabled",
  });
});
