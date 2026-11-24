import {test,expect} from '@playwright/test';
for(const [width,height]of [[944,1502],[1366,768],[600,1400]])test(`portrait frame ${width}×${height}`,async({page})=>{
 await page.setViewportSize({width,height});await page.goto('/');const frame=(await page.locator('#app').boundingBox())!;expect(frame.width/frame.height).toBeCloseTo(9/16,2);expect(frame.x).toBeGreaterThanOrEqual(7);expect(frame.y).toBeGreaterThanOrEqual(7);
 await page.getByRole('button',{name:'Play Air Hockey',exact:true}).click();await page.getByRole('button',{name:/Let’s play/}).click();await expect.poll(()=>page.evaluate(()=>(window as any).__POCKET__.scene.ready)).toBe(true);await page.waitForTimeout(300);const canvas=(await page.locator('canvas').boundingBox())!;expect(canvas.height/frame.height).toBeGreaterThan(.94);expect(canvas.width/frame.width).toBeGreaterThan(.94);await page.screenshot({path:`/tmp/portrait-frame-${width}.png`});
});
