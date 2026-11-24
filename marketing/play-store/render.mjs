import { chromium } from 'playwright';
import {readFileSync,writeFileSync} from 'node:fs';
const out=decodeURIComponent(new URL('./',import.meta.url).pathname);
const root=decodeURIComponent(new URL('../../',import.meta.url).pathname);
const font=readFileSync(root+'node_modules/@fontsource/fredoka/files/fredoka-latin-600-normal.woff2').toString('base64');
const art=p=>readFileSync(root+'src/'+p+'/assets/preview.svg','utf8');
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
const scenes=[
 ['Small games.','Big rivalries.','POCKET RIVALS','games/pong','games/air-hockey','#d7e8c5'],
 ['Your friend.','Your rival.','TWO PLAYERS · ONE DEVICE','games/tic-tac-toe','games/penfight','#f1d4c0'],
 ['Find your','next challenge.','SOLO ARCADE','arcade/orbit-hop','arcade/paper-glider','#d4e9ed'],
 ['A little skill.','One more go.','MEDIUM · HARD · IMPOSSIBLE','arcade/pocket-drift','arcade/shadow-step','#e0d7ed'],
 ['Pick your play.','Make it yours.','POCKET RIVALS','games/mini-golf','games/happy-birds','#f4eddb']
];
function html(s,w,h){const wide=w>h;return `<style>@font-face{font-family:F;src:url(data:font/woff2;base64,${font})}*{box-sizing:border-box}body{margin:0;background:${s[5]};color:#242b32;font-family:F;overflow:hidden}.root{width:${w}px;height:${h}px;position:relative;padding:${wide?50:85}px}.brand{font-size:${wide?22:34}px;letter-spacing:5px}.title{font-size:${wide?74:112}px;line-height:1.02;letter-spacing:-3px;margin-top:${wide?38:90}px;position:relative;z-index:2}.tag{font-size:${wide?16:27}px;letter-spacing:3px;margin-top:35px}.art{position:absolute;width:${wide?330:640}px;height:${wide?330:640}px;right:${wide?-10:20}px;top:${wide?40:570}px;transform:rotate(9deg)}.art.second{width:${wide?220:470}px;height:${wide?220:470}px;right:${wide?185:490}px;top:${wide?250:1080}px;transform:rotate(-12deg)}svg{width:100%;height:100%}.foot{position:absolute;bottom:${wide?24:95}px;font-size:${wide?15:31}px;letter-spacing:1px}.orb{position:absolute;width:420px;height:420px;border-radius:50%;background:#ffffff35;right:-150px;bottom:100px}</style><div class=root><div class=orb></div><div class=brand>POCKET RIVALS</div><div class=title>${s[0]}<br>${s[1]}</div><div class=tag>${s[2]}</div><div class=art>${art(s[3])}</div><div class="art second">${art(s[4])}</div><div class=foot>Little games. Shared moments.</div></div>`;}
for(let i=0;i<scenes.length;i++){await page.setContent(html(scenes[i],1080,1920));await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:out+`illustration-${i+1}.png`});}
await page.setViewportSize({width:1024,height:500});await page.setContent(html(scenes[0],1024,500));await page.screenshot({path:out+'feature-graphic.png'});
// Actual gameplay screenshots, separate from illustrated campaign artwork.
await page.setViewportSize({width:540,height:960});
for(const name of ['Pocket Drift','Shadow Step','Magnet Dash']){await page.goto('http://127.0.0.1:5173/');await page.getByRole('button',{name:'1 Player Arcade',exact:true}).click();await page.getByRole('button',{name:`Play ${name}`,exact:true}).click();await page.getByRole('button',{name:'Medium',exact:true}).click();await page.waitForTimeout(700);await page.screenshot({path:out+`gameplay-${name.toLowerCase().replaceAll(' ','-')}.png`});}
for(const [width,height]of [[944,1502],[1366,768],[390,844]]){await page.setViewportSize({width,height});await page.goto('http://127.0.0.1:5173/');const b=await page.locator('#app').boundingBox();if(width>=560&&Math.abs(b.y-8)>2)throw Error('Outer margin regression '+JSON.stringify(b));await page.screenshot({path:out+`layout-${width}.png`});}
await browser.close();
