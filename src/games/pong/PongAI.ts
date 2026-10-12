import type {AIController,Difficulty} from '../../shared/contracts/AIController';
import type {PongWorld} from './PongPhysics';
import {FIELD} from '../../core/ThemeManager';
import {clamp} from '../../shared/physics/FixedStep';
export function reflectedX(x:number,left:number,right:number){const width=right-left,phase=((x-left)%(2*width)+2*width)%(2*width);return left+(phase<=width?phase:2*width-phase);}
export class PongAI implements AIController<PongWorld,number>{
 private reaction=0;private target=210;private control=210;
 constructor(private difficulty:Difficulty,private random= Math.random){}
 reset(){this.reaction=0;this.target=this.control=210;}
 update(dt:number,w:PongWorld){
  const settings={medium:{delay:.20,error:48,speed:580},hard:{delay:.075,error:12,speed:1050},impossible:{delay:.018,error:0,speed:1750}}[this.difficulty];
  this.reaction-=dt;if(this.reaction<=0){this.reaction=settings.delay;const b=w.ball,p=w.paddles[1];
   const t=b.vy<0?Math.max(0,(p.y+16-b.y)/b.vy):0;
   this.target=b.vy<0?reflectedX(b.x+b.vx*t,FIELD.left+b.r,FIELD.right-b.r):210+(b.x-210)*.25;
   this.target+=(this.random()-.5)*settings.error*2;
   if(this.difficulty==='medium'&&this.random()<.12)this.target+=(this.random()-.5)*120;
   this.target=clamp(this.target,FIELD.left+44,FIELD.right-44);
  }
  this.control=w.paddles[1].x+clamp(this.target-w.paddles[1].x,-settings.speed*dt,settings.speed*dt);return this.control;
 }
}
