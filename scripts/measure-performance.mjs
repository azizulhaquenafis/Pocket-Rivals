import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:412,height:915},isMobile:true,hasTouch:true,deviceScaleFactor:1});
await page.goto('http://127.0.0.1:5173/?diagnostics');
await page.getByRole('button',{name:'1 Player Arcade',exact:true}).click();
await page.getByRole('button',{name:'Play Ultimate Golf',exact:true}).click();
await page.waitForTimeout(500);
const results=[];
async function tap(x,y){const r=await page.locator('canvas').boundingBox();await page.touchscreen.tap(r.x+x*r.width/420,r.y+y*r.height/760);}
for(let i=0;i<4;i++){
 await tap(210,204+i*94);await page.waitForTimeout(1500);
 const samples=[];for(let n=0;n<6;n++){await page.waitForTimeout(500);samples.push(await page.evaluate(()=>({diagnostics:window.__POCKET__.diagnostics,children:window.__POCKET__.scene.children,heap:performance.memory?.usedJSHeapSize})));}
 results.push({course:i+1,samples});await tap(81,659);
}
await writeFile('docs/performance-report.json',JSON.stringify({environment:'Headless desktop Chrome, mobile viewport 412×915, DPR 1, development build; not an Android hardware benchmark',measuredAt:new Date().toISOString(),results},null,2)+'\n');
console.log(results.map(r=>({course:r.course,fps:r.samples.map(s=>s.diagnostics.fps),frameMs:r.samples.at(-1).diagnostics.frameMs,init:r.samples.at(-1).diagnostics.initializations,children:r.samples.at(-1).children})));
await browser.close();
