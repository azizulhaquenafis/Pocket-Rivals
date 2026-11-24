import {chromium} from 'playwright';
import {rename} from 'node:fs/promises';
const out=decodeURIComponent(new URL('./',import.meta.url).pathname);
const b=await chromium.launch({channel:'chrome'});
for(const [i,name]of ['Pocket Drift','Magnet Dash','Shadow Step'].entries()){
 const c=await b.newContext({viewport:{width:540,height:960},recordVideo:{dir:out,size:{width:540,height:960}}});const p=await c.newPage();await p.goto('http://127.0.0.1:5173/');await p.getByRole('button',{name:'1 Player Arcade',exact:true}).click();await p.getByRole('button',{name:`Play ${name}`,exact:true}).click();await p.getByRole('button',{name:'Medium',exact:true}).click();
 if(i===0){await p.keyboard.down('ArrowLeft');await p.waitForTimeout(330);await p.keyboard.up('ArrowLeft');}
 if(i===1)await p.keyboard.press('Space');if(i===2)await p.keyboard.down('ArrowRight');
 await p.waitForTimeout(4000);const v=p.video();await c.close();await rename(await v.path(),out+`capture-${i}.webm`);
}await b.close();
