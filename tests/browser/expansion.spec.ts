import { test, expect, type Page } from "@playwright/test";
const state = (p: Page) => p.evaluate(() => (window as any).__POCKET__);
async function tap(p: Page, x: number, y: number) {
  const b = (await p.locator("canvas").boundingBox())!;
  await p.touchscreen.tap(
    b.x + (x / 420) * b.width,
    b.y + (y / 760) * b.height,
  );
}
async function open(p: Page, name: string, ai = false) {
  await p.goto("/?diagnostics");
  await p.getByRole("button", { name: `Play ${name}`, exact: true }).click();
  if (ai) {
    await p.getByRole("radio", { name: /1 Player/ }).click();
    await p.getByRole("radio", { name: "Impossible", exact: true }).click();
  }
  await p.getByRole("button", { name: /Let’s play/ }).click();
  await expect.poll(async () => (await state(p)).scene.ready).toBe(true);
}
test("Dots and Boxes completes a full local match, rematches and runs worker AI", async ({
  page,
}) => {
  await open(page, "Dots and Boxes");
  await page.screenshot({ path: "docs/dots-and-boxes.png" });
  for (let e = 0; e < 40; e++) {
    const i = e < 20 ? e : e - 20,
      x = e < 20 ? 60 + (i % 4) * 75 + 37.5 : 60 + (i % 5) * 75,
      y =
        e < 20
          ? 240 + Math.floor(i / 4) * 75
          : 240 + Math.floor(i / 5) * 75 + 37.5;
    await tap(page, x, y);
    await page.waitForTimeout(175);
  }
  await expect(
    page.getByRole("button", { name: "Rematch", exact: true }),
  ).toBeVisible();
  expect((await state(page)).saved.rounds).toBe(1);
  await page.getByRole("button", { name: "Rematch", exact: true }).click();
  await expect
    .poll(async () => (await state(page)).scene.game?.history.length)
    .toBe(0);
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Back to all games", exact: true })
    .click();
  expect((await state(page)).scene.inputListeners).toBe(0);
  await open(page, "Dots and Boxes", true);
  await tap(page, 97.5, 240);
  await expect
    .poll(async () => (await state(page)).scene.game?.history.length)
    .toBe(2);
  expect((await state(page)).scene.game.turn).toBe(1);
});
test("effects volume persists and no music control is presented", async ({
  page,
}) => {
  await page.goto("/?diagnostics");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const volume = page.getByRole("slider", { name: "Effects volume" });
  await volume.fill("35");
  await volume.dispatchEvent("input");
  expect(await page.getByText("35%", { exact: true }).textContent()).toBe(
    "35%",
  );
  expect(await page.getByRole("switch", { name: /Music/ }).count()).toBe(0);
  await page.reload();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(volume).toHaveValue("35");
});

test("Hammer Hit accepts simultaneous touch, exactly three strikes and reports the average", async ({
  page,
}) => {
  await open(page, "Hammer Hit");
  const cdp = await page.context().newCDPSession(page),
    b = (await page.locator("canvas").boundingBox())!;
  await page.waitForTimeout(800);
  for (let i = 0; i < 3; i++) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [
        { x: b.x + b.width / 2, y: b.y + (b.height * 270) / 760, id: 1 },
        { x: b.x + b.width / 2, y: b.y + (b.height * 490) / 760, id: 2 },
      ],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    if (i < 2) await page.waitForTimeout(1300);
  }
  await expect(
    page.getByRole("button", { name: "Rematch", exact: true }),
  ).toBeVisible();
  const s = (await state(page)).scene.game;
  expect(s.scores.map((a: number[]) => a.length)).toEqual([3, 3]);
  expect(s.averages).toEqual(s.totals.map((n: number) => n / 3));
  await cdp.detach();
  await open(page, "Hammer Hit", true);
  await expect
    .poll(async () => (await state(page)).scene.game.scores[1].length, {
      timeout: 8000,
    })
    .toBe(3);
});

test("Light Fingers false starts, pause and a complete first-to-five match", async ({
  page,
}) => {
  await open(page, "Light Fingers");
  for (let i = 0; i < 5; i++) {
    await expect
      .poll(async () => (await state(page)).scene.game.phase)
      .toBe("waiting");
    await tap(page, 210, 185);
    await expect
      .poll(async () => (await state(page)).scene.game.scores[0])
      .toBe(i + 1);
  }
  await expect(
    page.getByRole("button", { name: "Rematch", exact: true }),
  ).toBeVisible();
  expect((await state(page)).scene.game.winner).toBe(1);
  await open(page, "Light Fingers", true);
  await page.keyboard.press("Escape");
  const before = (await state(page)).scene.game;
  await page.waitForTimeout(200);
  expect((await state(page)).scene.game).toEqual(before);
  await page.getByRole("button", { name: /Keep playing/ }).click();
  await expect
    .poll(async () => (await state(page)).scene.game.scores[1], {
      timeout: 7000,
    })
    .toBe(1);
});

test("Fruit Duel completes ten legal target matches and AI responds after matching fruit", async ({
  page,
}) => {
  test.setTimeout(65000);
  await open(page, "Fruit Duel");
  for (let i = 0; i < 10; i++) {
    await expect
      .poll(
        async () => {
          const s = (await state(page)).scene.game;
          return s.phase === "active" && s.current === s.target;
        },
        { timeout: 6000, intervals: [30, 50, 50] },
      )
      .toBe(true);
    await tap(page, 210, 580);
    await expect
      .poll(async () => (await state(page)).scene.game.scores[0])
      .toBe(i + 1);
  }
  await expect(
    page.getByRole("button", { name: "Rematch", exact: true }),
  ).toBeVisible();
  await open(page, "Fruit Duel", true);
  await expect
    .poll(async () => (await state(page)).scene.game.scores[1], {
      timeout: 6000,
    })
    .toBe(1);
});

test('Math Quiz renders formulas, validates all mobile widths and completes a real ten-answer match',async({page})=>{
 test.setTimeout(60000);await page.goto('/?diagnostics');await page.getByRole('button',{name:'Play Math Quiz',exact:true}).click();await page.getByRole('button',{name:/University Challenge/}).click();await page.getByRole('button',{name:/Let’s play/}).click();await expect(page.locator('.quiz-overlay')).toBeVisible();await page.setViewportSize({width:320,height:568});await page.waitForTimeout(200);await page.evaluate(()=>document.fonts.ready);
 const bad=await page.evaluate(async()=>{const {renderMath}=await import('/src/games/math-quiz/MathUI.ts' as string);const {university}=await import('/src/games/math-quiz/questions/Bank.ts' as string);const host=document.createElement('div');host.style.cssText='position:absolute;width:338px;font-size:18px;left:0;top:0';document.body.append(host);const bad:string[]=[];for(const q of university){renderMath(q.questionLatex,host);const math=host.querySelector('.katex') as HTMLElement;if(math.offsetWidth>450)bad.push(q.id);}host.remove();return bad;});expect(bad).toEqual([]);
 await page.screenshot({path:'docs/math-quiz-mobile.png'});
 for(let i=0;i<10;i++){await expect.poll(async()=>(await state(page)).scene.game.phase).toBe('active');const q=(await state(page)).scene.game.question;await page.getByRole('button',{name:`Orange answer ${q.correctIndex+1}`,exact:true}).click();await expect.poll(async()=>(await state(page)).scene.game.scores[0]).toBe(i+1);}
 await expect(page.getByRole('button',{name:'Rematch',exact:true})).toBeVisible();await page.getByRole('button',{name:'Back to all games',exact:true}).click();expect(await page.locator('.quiz-overlay').count()).toBe(0);
 await open(page,'Math Quiz',true);await expect.poll(async()=>(await state(page)).scene.game.scores[1],{timeout:6000}).toBe(1);
});

test('Lumberjack real controls, seeded trees, three rounds and a result',async({page})=>{await open(page,'Lumberjack');for(let round=1;round<=3;round++){await expect.poll(async()=>(await state(page)).scene.game.round).toBe(round);await page.keyboard.press('KeyA');await expect.poll(async()=>(await state(page)).scene.game.players[0].score).toBe(1);if(round<3)await expect.poll(async()=>(await state(page)).scene.game.phase,{timeout:4000}).toBe('between');}await expect(page.getByRole('button',{name:'Rematch',exact:true})).toBeVisible();expect((await state(page)).scene.game.totals).toEqual([3,0]);await open(page,'Lumberjack',true);await expect.poll(async()=>(await state(page)).scene.game.players[1].score).toBeGreaterThan(2);});
