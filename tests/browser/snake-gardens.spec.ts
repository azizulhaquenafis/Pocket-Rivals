import {test,expect,type Page} from '@playwright/test';
const state=(p:Page)=>p.evaluate(()=>(window as any).__POCKET__);
async function enter(p:Page){await p.goto('/');await p.getByRole('button',{name:'1 Player Arcade',exact:true}).click();await p.getByRole('button',{name:'Play Classic Snake',exact:true}).click();await expect(p.locator('.snake-setup-panel')).toBeVisible();}
for(const [map,id,tier] of [['Sunlit Meadow','meadow','Medium'],['Violet Ruins','ruins','Hard'],['Blue Lagoon','lagoon','Impossible']])
test(`${map}: setup, controls, pause and cleanup`,async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:360,height:640});await enter(page);
 expect(await page.locator('.snake-setup-panel').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 await page.getByRole('button',{name:map,exact:true}).click();await page.getByRole('radio',{name:tier,exact:true}).click();
 await page.screenshot({path:`docs/snake-${id}-setup.png`});await page.locator('[data-start]').click();
 await expect.poll(async()=>(await state(page)).scene.game.started).toBe(true);
 expect((await state(page)).scene.game.map).toBe(id);
 expect((await state(page)).scene.game.difficulty).toBe(tier.toLowerCase());
 await page.keyboard.press('ArrowUp');await expect.poll(async()=>(await state(page)).scene.game.direction).toBe('up');
 // Verify swiping outside the play grid (and outside the canvas on desktop) steers the snake
 const box=(await page.locator('canvas').boundingBox())!;
 const cdp=await page.context().newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:3,x:box.x+(210/420)*box.width,y:box.y+(710/760)*box.height}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:3,x:box.x+(270/420)*box.width,y:box.y+(710/760)*box.height}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await cdp.detach();
 await expect.poll(async()=>(await state(page)).scene.game.direction).toBe('right');
 await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:/Keep playing/})).toBeVisible();const paused=(await state(page)).scene.game;
 await page.waitForTimeout(150);expect((await state(page)).scene.game).toEqual(paused);
 await page.getByRole('button',{name:/Keep playing/}).click();await page.screenshot({path:`docs/snake-${id}.png`});
 await page.keyboard.press('Escape');await page.getByRole('button',{name:'Back to all games',exact:true}).click();
 await expect(page.locator('.snake-setup')).toHaveCount(0);expect((await state(page)).scene.inputListeners).toBe(0);expect(errors).toEqual([]);
});
test('Gravity has no map picker, warms only its selected module and starts smoothly',async({page})=>{
 await page.goto('/?aiSeed=3&diagnostics');await page.getByRole('button',{name:'Play Gravity Runner',exact:true}).click();
 await expect(page.locator('.variant-choices')).toHaveCount(0);
 await page.getByRole('radio',{name:/1 Player/}).click();await page.getByRole('radio',{name:'Impossible',exact:true}).click();
 await page.waitForTimeout(200);
 await page.getByRole('button',{name:/Let’s play/}).click();await expect.poll(async()=>(await state(page)).scene.ready).toBe(true);
 expect((await state(page)).scene.game.map).toBe('blue');
 await page.waitForTimeout(500);expect((await state(page)).scene.game.distance).toBeGreaterThan(20);
 expect((await state(page)).diagnostics.initializations['gravity-runner']).toBeLessThan(500);
});
test('shared tiers, Penfight and casual Golf all use Medium/Hard/Impossible symmetrically',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Play Penfight',exact:true}).click();await page.getByRole('radio',{name:/1 Player/}).click();
 for(const name of ['Medium','Hard','Impossible'])await expect(page.getByRole('radio',{name,exact:true})).toBeVisible();
 await expect(page.getByRole('radio',{name:'Easy',exact:true})).toHaveCount(0);
 await page.goto('/');await page.getByRole('button',{name:'Play Ultimate Golf',exact:true}).click();await page.getByRole('button',{name:/1 Player Casual/}).click();
 for(const name of ['Medium','Hard','Impossible'])await expect(page.getByRole('button',{name,exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Easy',exact:true})).toHaveCount(0);
});
test('moving mechanisms render continuously while both players take legal flips',async({page})=>{
 await page.goto('/');
 const seed=await page.evaluate(async()=>{const {GravityMatch}=await import('/src/games/gravity-runner/Rules.ts' as string);for(let s=0;s<100;s++)if(new GravityMatch(s).patterns[0]==='movers')return s;throw Error('No moving opening');});
 await page.goto(`/?aiSeed=${seed}`);await page.clock.install();await page.getByRole('button',{name:'Play Gravity Runner',exact:true}).click();await page.getByRole('radio',{name:/1 Player/}).click();await page.getByRole('radio',{name:'Impossible',exact:true}).click();await page.getByRole('button',{name:/Let’s play/}).click();await expect.poll(async()=>(await state(page)).scene.ready).toBe(true);
 await page.screenshot({path:'docs/gravity-moving-slider.png'});
 const target=(await state(page)).scene.game.obstacles.filter((o:any)=>o.motion)[2].x-190;
 for(let i=0;i<350;i++){
  const m=(await state(page)).scene.game;expect(m.round).toBe(1);if(m.distance>target)break;
  if(m.players[0].gravity!==m.players[1].gravity&&m.players[0].cooldown===0)await page.keyboard.press('Space');
  await page.clock.runFor(40);
 }
 const m=(await state(page)).scene.game;expect(m.distance).toBeGreaterThan(target);expect(m.players.every((p:any)=>p.alive)).toBe(true);
 await page.screenshot({path:'docs/gravity-moving-piston.png'});
});
