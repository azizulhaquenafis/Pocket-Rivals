import {FIELD} from '../../core/ThemeManager';
import {clamp} from '../../shared/physics/FixedStep';
import type {Player} from '../../shared/contracts/GameResult';
import {constrainRink,validPuckPosition,reachablePuck,inMouth,GOAL_HALF,type Body} from './rink';
export interface Vec{x:number;y:number}
export class HockeyWorld {
 puck:Body={x:210,y:381,vx:75,vy:220,r:11};
 mallets:[Body,Body]=[{x:210,y:579,vx:0,vy:0,r:29},{x:210,y:183,vx:0,vy:0,r:29}];
 scores:[number,number]=[0,0];cooldown=1.35;done=false;readonly goalHalf=GOAL_HALF;
 recoveries=0;private invalidFor=0;
 constructor(private impact:(x:number,y:number)=>void=()=>{},private scored:(p:Player)=>void=()=>{}){}
 step(dt:number,targets:[Vec,Vec]){
  if(this.done)return;
  if(!Number.isFinite(this.puck.x+this.puck.y+this.puck.vx+this.puck.vy)){this.checkUnplayable(dt);return;}
  this.limitSpeed();
  const sub=dt/3;
  for(let n=0;n<3;n++){
   this.mallets.forEach((m,i)=>{
    const tx=clamp(targets[i].x,FIELD.left+m.r,FIELD.right-m.r),ty=clamp(targets[i].y,i===0?FIELD.middle+m.r:FIELD.top+m.r,i===0?FIELD.bottom-m.r:FIELD.middle-m.r);
    const dx=tx-m.x,dy=ty-m.y,d=Math.hypot(dx,dy),s=d?Math.min(1,1500*sub/d):0;
    m.vx=dx*s/sub;m.vy=dy*s/sub;m.x+=m.vx*sub;m.y+=m.vy*sub;constrainRink(m,false,0);
    m.y=clamp(m.y,i===0?FIELD.middle+m.r:FIELD.top+m.r,i===0?FIELD.bottom-m.r:FIELD.middle-m.r);
   });
   if(this.cooldown>0)continue;
   const p=this.puck;
   const damping=Math.exp(-.10*sub);p.vx*=damping;p.vy*=damping;this.limitSpeed();p.x+=p.vx*sub;p.y+=p.vy*sub;
   // Resolve swept small steps and project contacts in a consistent order.
   for(let iteration=0;iteration<3;iteration++){
    for(const m of this.mallets)this.malletContact(m,iteration===0);
    if(constrainRink(p,true)&&iteration===0)this.impact(p.x,p.y);
    this.posts(iteration===0);
   }
   this.solvePinch();this.limitSpeed();
   if(inMouth(p.x,p.r)&&p.y<FIELD.top-p.r){this.goal(1);break;}
   if(inMouth(p.x,p.r)&&p.y>FIELD.bottom+p.r){this.goal(2);break;}
  }
  if(this.cooldown>0)this.cooldown=Math.max(0,this.cooldown-dt);else this.checkUnplayable(dt);
 }
 private malletContact(m:Body,impulse:boolean){
  const p=this.puck,dx=p.x-m.x,dy=p.y-m.y,d=Math.hypot(dx,dy),r=p.r+m.r;
  if(d>=r)return;
  const nx=d>.0001?dx/d:0,ny=d>.0001?dy/d:(m.y>FIELD.middle?-1:1);
  p.x=m.x+nx*(r+.02);p.y=m.y+ny*(r+.02);
  const approach=(p.vx-m.vx)*nx+(p.vy-m.vy)*ny;
  if(impulse&&approach<0){p.vx-=1.90*approach*nx;p.vy-=1.90*approach*ny;this.impact(p.x,p.y);}
 }
 private posts(impulse:boolean){const p=this.puck;for(const y of [FIELD.top,FIELD.bottom])for(const x of [210-GOAL_HALF,210+GOAL_HALF]){
  const dx=p.x-x,dy=p.y-y,d=Math.hypot(dx,dy),r=p.r+5;if(d>=r)continue;
  const nx=d>.0001?dx/d:0,ny=d>.0001?dy/d:(y===FIELD.top?1:-1);p.x=x+nx*(r+.02);p.y=y+ny*(r+.02);
  const approach=p.vx*nx+p.vy*ny;if(impulse&&approach<0){p.vx-=1.96*approach*nx;p.vy-=1.96*approach*ny;this.impact(x,y);}
 }}
 private solvePinch(){
  const p=this.puck;
  for(const m of this.mallets){const r=m.r+p.r+.05;if(Math.hypot(p.x-m.x,p.y-m.y)>=r-.08)continue;
   let best=Infinity,bx=p.x,by=p.y;
   for(let i=0;i<64;i++){const angle=i*Math.PI/32,x=m.x+Math.cos(angle)*r,y=m.y+Math.sin(angle)*r;
    if(!validPuckPosition(x,y,p.r)||this.mallets.some(other=>other!==m&&Math.hypot(x-other.x,y-other.y)<other.r+p.r))continue;
    const d=(x-p.x)**2+(y-p.y)**2;if(d<best){best=d;bx=x;by=y;}}
   if(best<Infinity){p.x=bx;p.y=by;const nx=(p.x-m.x)/r,ny=(p.y-m.y)/r,dot=p.vx*nx+p.vy*ny;if(dot<0){p.vx-=dot*nx;p.vy-=dot*ny;}}
  }
 }
 private checkUnplayable(dt:number){
  const p=this.puck;
  const invalid=!validPuckPosition(p.x,p.y,p.r)||!reachablePuck(p.x,p.y,p.r);
  // A stationary reachable puck is a legitimate position. Never reset it for being slow.
  this.invalidFor=invalid?this.invalidFor+dt:0;
  if(this.invalidFor<.75)return;
  this.invalidFor=0;this.recoveries++;
  // Local nearest-point repair only; do not reset the rally or invent a goal.
  if(!Number.isFinite(p.x+p.y+p.vx+p.vy)){p.x=210;p.y=381;p.vx=0;p.vy=0;}
  constrainRink(p,true,0);this.solvePinch();
  if(!reachablePuck(p.x,p.y,p.r)){p.x=clamp(p.x,FIELD.left+45,FIELD.right-45);p.y=clamp(p.y,FIELD.top+45,FIELD.bottom-45);}
 }
 private limitSpeed(){const p=this.puck,s=Math.hypot(p.vx,p.vy);if(s>1100){p.vx*=1100/s;p.vy*=1100/s;}}
 private goal(player:Player){this.scores[player-1]++;this.done=this.scores[player-1]>=5;this.cooldown=1.1;this.invalidFor=0;Object.assign(this.puck,{x:210,y:381,vx:60,vy:player===1?-220:220});this.scored(player);}
}
