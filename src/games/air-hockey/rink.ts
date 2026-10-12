import {FIELD} from '../../core/ThemeManager';
import {clamp} from '../../shared/physics/FixedStep';
export interface Body{x:number;y:number;vx:number;vy:number;r:number}
export const CORNER=44,GOAL_HALF=63;
export const inMouth=(x:number,r:number)=>Math.abs(x-210)<GOAL_HALF-r-5;
/** Outward normals remove only approaching velocity; separating contacts never bounce twice. */
function contact(b:Body,x:number,y:number,nx:number,ny:number,restitution:number){b.x=x;b.y=y;const approach=b.vx*nx+b.vy*ny;if(approach>0){b.vx-=(1+restitution)*approach*nx;b.vy-=(1+restitution)*approach*ny;}}
export function constrainRink(b:Body,goals:boolean,restitution=.96){
 let hit=false;
 const left=FIELD.left+b.r,right=FIELD.right-b.r,top=FIELD.top+b.r,bottom=FIELD.bottom-b.r;
 if(b.x<left){contact(b,left,b.y,-1,0,restitution);hit=true;}else if(b.x>right){contact(b,right,b.y,1,0,restitution);hit=true;}
 if(!(goals&&inMouth(b.x,b.r))){
  if(b.y<top){contact(b,b.x,top,0,-1,restitution);hit=true;}else if(b.y>bottom){contact(b,b.x,bottom,0,1,restitution);hit=true;}
 }
 // In the four corner quadrants, constrain to a circular arc, not two opposing rail projections.
 const cx=clamp(b.x,FIELD.left+CORNER,FIELD.right-CORNER),cy=clamp(b.y,FIELD.top+CORNER,FIELD.bottom-CORNER);
 if(b.x!==cx&&b.y!==cy){const dx=b.x-cx,dy=b.y-cy,d=Math.hypot(dx,dy),allowed=CORNER-b.r;if(d>allowed){contact(b,cx+dx/d*allowed,cy+dy/d*allowed,dx/d,dy/d,restitution);hit=true;}}
 return hit;
}
export function validPuckPosition(x:number,y:number,r:number){
 if(!Number.isFinite(x+y)||x<FIELD.left+r-.01||x>FIELD.right-r+.01)return false;
 if(inMouth(x,r))return y>=FIELD.top-r&&y<=FIELD.bottom+r;
 if(y<FIELD.top+r-.01||y>FIELD.bottom-r+.01)return false;
 const cx=clamp(x,FIELD.left+CORNER,FIELD.right-CORNER),cy=clamp(y,FIELD.top+CORNER,FIELD.bottom-CORNER);
 return x===cx||y===cy||Math.hypot(x-cx,y-cy)<=CORNER-r+.01;
}
export function reachablePuck(x:number,y:number,r:number){
 // Rounded mallet-center limits are checked by projecting the closest center.
 return [0,1].some(i=>{const m={x:clamp(x,FIELD.left+29,FIELD.right-29),y:clamp(y,i===0?FIELD.middle+29:FIELD.top+29,i===0?FIELD.bottom-29:FIELD.middle-29),vx:0,vy:0,r:29};constrainRink(m,false,0);return Math.hypot(x-m.x,y-m.y)<=29+r+.5;});
}
