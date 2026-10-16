/** Run against a development server; never enables production telemetry. */
import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const url = process.env.POCKET_QA_URL ?? "http://127.0.0.1:5173";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
try {
  const page = await browser.newPage({
    viewport: { width: 412, height: 915 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${url}/?diagnostics&aiSeed=77`);
  for (const name of [
    "Gravity Runner",
    "Happy Birds",
    "Spike Attacks",
  ]) {
    await page
      .getByRole("button", { name: `Play ${name}`, exact: true })
      .click();
    await page.getByRole("radio", { name: /1 Player/ }).click();
    await page.getByRole("radio", { name: "Impossible", exact: true }).click();
    await page.getByRole("button", { name: /Let’s play/ }).click();
    await page.waitForFunction(() => window.__POCKET__?.scene.ready);
    await page.waitForTimeout(700);
    const samples = [];
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(500);
      samples.push(
        await page.evaluate(() => ({
          diagnostics: window.__POCKET__.diagnostics,
          children: window.__POCKET__.scene.children,
          heap: performance.memory?.usedJSHeapSize ?? null,
        })),
      );
    }
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: "Back to all games", exact: true })
      .click();
    const cleanup = await page.evaluate(() => window.__POCKET__.scene);
    if (cleanup.inputListeners !== 0)
      throw new Error(`${name}: leaked host input`);
    results.push({ name, samples, cleanup });
  }
  if (errors.length) throw new Error(errors.join("\n"));
  const report = {
    environment:
      "Headless desktop Chrome, 412×915 touch viewport, DPR 1, development build. Short diagnostic samples, not Android hardware or long-session certification.",
    measuredAt: new Date().toISOString(),
    results,
  };
  await writeFile(
    "docs/expansion-performance.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    JSON.stringify(
      results.map(({ name, samples, cleanup }) => ({
        name,
        fps: samples.map((s) => Math.round(s.diagnostics.fps)),
        finalFrameMs: samples.at(-1).diagnostics.frameMs,
        children: samples.map((s) => s.children),
        inputListenersAfterExit: cleanup.inputListeners,
      })),
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
