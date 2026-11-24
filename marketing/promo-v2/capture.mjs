import {chromium} from 'playwright';import {writeFileSync} from 'node:fs';import {fileURLToPath} from 'node:url';
const out=fileURLToPath(new URL('./',import.meta.url));
const browser=await chromium.launch({channel:'chrome',args:['--autoplay-policy=no-user-gesture-required']});
for(const [id,name]of [['tower','Tower Stack'],['pour','Perfect Pour'],['glider','Paper Glider'],['pong','Pong']]){
 const page=await browser.newPage({viewport:{width:540,height:960},deviceScaleFactor:1});
 await page.addInitScript(()=>{const Original=window.AudioContext;window.AudioContext=class extends Original{constructor(...a){super(...a);window.__audio=this;window.__dest=this.createMediaStreamDestination();const connect=AudioNode.prototype.connect;if(!window.__hooked){window.__hooked=true;AudioNode.prototype.connect=function(dest,...rest){if(dest instanceof AudioDestinationNode){connect.call(this,window.__dest);}return connect.call(this,dest,...rest);};}}};});
 await page.goto('http://127.0.0.1:5173/');
 if(id!=='pong')await page.getByRole('button',{name:'1 Player Arcade',exact:true}).click();
 await page.getByRole('button',{name:`Play ${name}`,exact:true}).click();
 if(id==='pong'){await page.getByRole('radio',{name:/1 Player/}).click();await page.getByRole('button',{name:/Let’s play/}).click();}else await page.getByRole('button',{name:'Medium',exact:true}).click();
 await page.waitForTimeout(300);
 await page.evaluate(()=>{const canvas=document.querySelector('canvas');const stream=canvas.captureStream(30);for(const t of window.__dest.stream.getAudioTracks())stream.addTrack(t);window.__parts=[];window.__rec=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9,opus',videoBitsPerSecond:7000000});window.__rec.ondataavailable=e=>window.__parts.push(e.data);window.__rec.start();});
 const start=Date.now();let held=false, pourStart=0, pouredRound=0;
 while(Date.now()-start<8500){
 const s=await page.evaluate(()=>window.__POCKET__.scene.game);
 if(id==='tower'&&s.moving&&Math.abs(s.moving.x-s.top.x)<5)await page.keyboard.press('Space');
 if(id==='pour'){if(!held&&s.between===0&&s.round!==pouredRound){await page.keyboard.down('Space');held=true;pourStart=Date.now();}if(held&&Date.now()-pourStart>s.target*(3.1+(s.round%3)*.35)*1000){await page.keyboard.up('Space');held=false;pouredRound=s.round;}}
 if(id==='glider'){await page.keyboard.down('ArrowRight');await page.waitForTimeout(120);await page.keyboard.up('ArrowRight');await page.waitForTimeout(650);await page.keyboard.down('ArrowLeft');await page.waitForTimeout(140);await page.keyboard.up('ArrowLeft');}
 if(id==='pong'){const box=await page.locator('canvas').boundingBox();const x=s.ball?.x??210;await page.mouse.move(box.x+x/420*box.width,box.y+625/760*box.height);await page.mouse.down();}
 await page.waitForTimeout(20);
 }
 const data=await page.evaluate(async()=>{await new Promise(resolve=>{window.__rec.onstop=resolve;window.__rec.stop()});const b=new Blob(window.__parts,{type:'video/webm'});return Array.from(new Uint8Array(await b.arrayBuffer()));});writeFileSync(out+id+'.webm',Buffer.from(data));await page.close();
}await browser.close();
