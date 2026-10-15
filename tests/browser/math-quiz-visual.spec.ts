import { test, expect } from '@playwright/test';

test('Math Quiz visual capture across viewports and formulas', async ({ page }) => {
  await page.goto('/?diagnostics');
  await page.getByRole('button', { name: 'Play Math Quiz', exact: true }).click();
  await page.getByRole('button', { name: /University Challenge/ }).click();
  await page.getByRole('button', { name: /Let’s play/ }).click();
  await expect(page.locator('.quiz-overlay')).toBeVisible();

  await expect.poll(async () => (await page.evaluate(() => (window as any).__POCKET__)).scene.ready).toBe(true);

  const formulasToTest = [
    { id: 'binom', latex: String.raw`\binom{7}{2}`, topic: 'Probability', options: ['14', '21', '42'] },
    { id: 'hard-limit', latex: String.raw`\lim_{x\to0}\frac{\sin x-x\cos x}{x^3}`, topic: 'Limits', options: [String.raw`\frac13`, String.raw`\frac16`, String.raw`\frac12`] },
    { id: 'integral-sym', latex: String.raw`\int_{-\pi}^{\pi}x^3\cos^2x\,dx`, topic: 'Integrals', options: ['0', String.raw`\frac{\pi^4}{2}`, String.raw`-\frac{\pi^4}{2}`] },
    { id: 'matrix', latex: String.raw`\det\begin{pmatrix}3&1\\4&1\end{pmatrix}`, topic: 'Matrices', options: ['-1', '1', '7'] },
    { id: 'summation', latex: String.raw`\sum_{n=1}^\infty\left(\frac1{4}\right)^n`, topic: 'Algebra', options: [String.raw`\frac13`, String.raw`\frac14`, String.raw`\frac43`] },
    { id: 'log-chain', latex: String.raw`\left.\frac{d}{dx}\ln(\sin x)\right|_{x=\frac\pi4}`, topic: 'Derivatives', options: ['1', String.raw`\sqrt2`, String.raw`\frac12`] },
  ];

  // Test across each formula
  for (const item of formulasToTest) {
    await page.evaluate(async (data) => {
      const { renderMath } = await import('/src/games/math-quiz/MathUI.ts' as string);
      document.querySelectorAll('.quiz-topic').forEach((t) => {
        t.textContent = data.topic;
      });
      document.querySelectorAll('.quiz-formula').forEach((n) => renderMath(data.latex, n as HTMLElement));
      document.querySelectorAll('button[data-player]').forEach((b) => {
        const idx = Number((b as HTMLElement).dataset.answer);
        renderMath(data.options[idx], b as HTMLElement);
      });
      const middleSpan = document.querySelector('.quiz-middle span');
      if (middleSpan) middleSpan.textContent = `${data.topic} · FIRST TO 10`;
      const explain = document.querySelector('.quiz-explanation') as HTMLElement;
      if (explain) explain.replaceChildren();
    }, item);

    await page.waitForTimeout(50);
    await page.screenshot({ path: `test-results/math-quiz-formula-${item.id}.png` });
  }

  // Test binomial choose-pair across all 4 target viewports
  const viewports = [
    { width: 320, height: 568, name: '320x568' },
    { width: 375, height: 667, name: '375x667' },
    { width: 390, height: 844, name: '390x844' },
    { width: 1280, height: 720, name: 'desktop' },
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(200);
    // trigger resize
    await page.evaluate(() => {
      window.dispatchEvent(new Event('resize'));
    });
    await page.waitForTimeout(100);
    await page.screenshot({ path: `test-results/math-quiz-${vp.name}-binom.png` });
  }
});
