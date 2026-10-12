import type {AIController,Difficulty} from '../../shared/contracts/AIController';
import type {HockeyWorld,Vec} from './AirHockeyPhysics';
import {clamp} from '../../shared/physics/FixedStep';
import {FIELD} from '../../core/ThemeManager';
function reflect(x:number){const width=350,phase=((x-35)%(2*width)+2*width)%(2*width);return 35+(phase<=width?phase:2*width-phase);}
export class AirHockeyAI implements AIController<HockeyWorld,Vec>{
 private reaction=0;private target:Vec={x:210,y:180};
 constructor(private difficulty:Difficulty,private random=Math.random){}
 reset(){this.reaction=0;this.target={x:210,y:180};}
 update(dt:number,w:HockeyWorld){
  const cfg={medium:{delay:.19,error:24,speed:530},hard:{delay:.065,error:7,speed:1050},impossible:{delay:.02,error:0,speed:1450}}[this.difficulty];
  const p=w.puck,m=w.mallets[1];this.reaction-=dt;
  if(this.reaction<=0){this.reaction=cfg.delay;
   if(p.vy<-60&&p.y<480){const t=Math.max(0,(155-p.y)/p.vy);this.target={x:reflect(p.x+p.vx*t),y:155};}
   else if(p.y<FIELD.middle+10){
    // Approach behind the puck, then drive downfield; route around it when caught in front.
    if(m.y>p.y-22){const side=m.x<p.x?-1:1;this.target={x:p.x+side*65,y:Math.max(143,p.y-58)};}
    else this.target={x:p.x+(p.x-210)*.13,y:Math.min(352,p.y+34)};
   }else this.target={x:210+(p.x-210)*.35,y:180};
   this.target.x+=(this.random()-.5)*cfg.error*2;
   this.target.x=clamp(this.target.x,53,367);this.target.y=clamp(this.target.y,141,352);
  }
  const dx=this.target.x-m.x,dy=this.target.y-m.y,d=Math.hypot(dx,dy),s=d?Math.min(1,cfg.speed*dt/d):0;return{x:m.x+dx*s,y:m.y+dy*s};
 }
}
