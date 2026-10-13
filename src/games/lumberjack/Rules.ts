export type Side=-1|1;
export const ROUND_SECONDS=20;
export function branches(seed:number,count=600){let s=seed>>>0,last=0;return Array.from({length:count},(_,i)=>{s=(Math.imul(s,1664525)+1013904223)>>>0;const value=i<2||last!==0?0:s%3-1;last=value;return value;});}
export class LumberMatch {
 pattern:number[];players=[{score:0,side:-1 as Side,alive:true,idle:0,cooldown:0},{score:0,side:1 as Side,alive:true,idle:0,cooldown:0}];totals:[number,number]=[0,0];round=1;phase:'playing'|'between'|'done'='playing';time=0;between=0;winner:1|2|null=null;
 constructor(readonly seed=12345){this.pattern=branches(seed);}
 limit(p:number){return Math.max(.32,1.5-this.players[p].score*.035);}
 safe(p:number,side:Side){const index=this.players[p].score;return this.pattern[index]!==side&&this.pattern[index+1]!==side;}
 chop(p:0|1,side:Side){const v=this.players[p];if(this.phase!=='playing'||!v.alive||v.cooldown>0)return null;v.side=side;v.cooldown=.085;if(!this.safe(p,side)){v.alive=false;return false;}v.score++;v.idle=0;return true;}
 update(dt:number){if(this.phase==='done')return;if(this.phase==='between'){this.between-=dt;if(this.between<=0){this.round++;this.time=0;this.pattern=branches(this.seed+this.round*7919);this.players.forEach(p=>{p.score=0;p.alive=true;p.idle=0;p.cooldown=0;});this.phase='playing';}return;}this.time+=dt;for(const p of this.players){p.cooldown=Math.max(0,p.cooldown-dt);if(p.alive){p.idle+=dt;if(p.idle>Math.max(.32,1.5-p.score*.035))p.alive=false;}}if(this.time>=ROUND_SECONDS)this.players.forEach(p=>p.alive=false);if(this.players.every(p=>!p.alive)){this.players.forEach((p,i)=>this.totals[i]+=p.score);if(this.round>=3&&this.totals[0]!==this.totals[1]){this.winner=this.totals[0]>this.totals[1]?1:2;this.phase='done';}else{this.phase='between';this.between=1.4;}}}
}
