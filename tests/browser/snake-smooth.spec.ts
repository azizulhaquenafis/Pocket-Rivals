import {test,expect} from '@playwright/test';
for(const mobile of [true,false]) test(`Snake ${mobile?'touch':'desktop'} animation, immediate resume and cleanup`,async({browser})=>{
 const context=await browser.newContext({viewport:{width:mobile?390:1280,height:mobile?844:800},isMobile:mobile,hasTouch:mobile});
 const page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/');
 await page.getByRole('button',{name:'1 Player Arcade',exact:true}).click();
 await page.getByRole('button',{name:'Play Classic Snake',exact:true}).click();
 await page.getByRole('button',{name:'Sunlit Meadow',exact:true}).click();await page.locator('[data-start]').click();
 await page.waitForTimeout(800);
 await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:/Keep playing/})).toBeVisible();
 const state=()=>page.evaluate(()=>(window as any).__POCKET__.scene.game);
 const paused=await state();await page.waitForTimeout(200);expect(await state()).toEqual(paused);
 await page.getByRole('button',{name:/Keep playing/}).click();
 await page.keyboard.press('ArrowUp');
 await expect.poll(async()=>(await state()).direction,{timeout:500,intervals:[20]}).toBe('up');
 const metrics=await page.evaluate(()=>new Promise<{fps:number;p95:number}>(resolve=>{
  const frames:number[]=[];let last=performance.now(),i=0;
  const frame=(now:number)=>{frames.push(now-last);last=now;i++;
   const key=({25:'ArrowLeft',55:'ArrowDown',85:'ArrowRight'} as Record<number,string>)[i];
   if(key){window.dispatchEvent(new KeyboardEvent('keydown',{key,code:key,bubbles:true}));window.dispatchEvent(new KeyboardEvent('keyup',{key,code:key,bubbles:true}));}
   if(i<110)requestAnimationFrame(frame);else{const sorted=frames.slice(5).sort((a,b)=>a-b);resolve({fps:1000/(sorted.reduce((a,b)=>a+b,0)/sorted.length),p95:sorted[Math.floor(sorted.length*.95)]});}
  };requestAnimationFrame(frame);
 }));
 console.log(JSON.stringify({mobile,...metrics}));expect(metrics.p95).toBeLessThan(50);
 expect((await state()).dead).toBe(false);
 await page.screenshot({path:`test-results/snake-smooth-${mobile?'mobile':'desktop'}.png`});
 await page.keyboard.press('Escape');await page.getByRole('button',{name:'Back to all games',exact:true}).click();
 expect(await page.evaluate(()=>(window as any).__POCKET__.scene.inputListeners)).toBe(0);
 expect(errors).toEqual([]);await context.close();
});
