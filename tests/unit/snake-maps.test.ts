import {it,expect} from 'vitest';
import {MAPS} from '../../src/arcade/snake/Maps';
import {SnakeWorld} from '../../src/arcade/snake/SnakeRules';
import {difficulties} from '../../src/games/mini-golf/ultimate/GolfRules';
import {obstacleBounds,touchesTrap,obstacleOutline} from '../../src/games/gravity-runner/ObstacleGeometry';
import type {Obstacle} from '../../src/games/gravity-runner/RunnerPhysics';
it('Golf labels are Medium Hard Impossible without changing original tuning',()=>{expect(difficulties.map(d=>d.name)).toEqual(['Medium','Hard','Impossible']);expect(difficulties.map(d=>d.factor)).toEqual([1.5,1.1,.75]);});
it('each snake garden is connected, has a clear spawn and never spawns food inside walls/body',()=>{
 for(const map of MAPS){const w=new SnakeWorld(()=>.5,map);const blocked=new Set(map.blocks.map(c=>`${c.x},${c.y}`)),seen=new Set(['8,11']),queue=[{x:8,y:11}];
  while(queue.length){const c=queue.shift()!;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=c.x+dx,y=c.y+dy,key=`${x},${y}`;if(x<0||x>=17||y<0||y>=20||seen.has(key)||blocked.has(key))continue;seen.add(key);queue.push({x,y});}}
  expect(seen.size).toBe(340-blocked.size);expect(w.body.every(c=>!blocked.has(`${c.x},${c.y}`))).toBe(true);
  for(let i=0;i<100;i++){w.spawnFood();expect(blocked.has(`${w.food!.x},${w.food!.y}`)).toBe(false);expect(w.body.some(c=>c.x===w.food!.x&&c.y===w.food!.y)).toBe(false);}
  if(map.blocks.length){const c=map.blocks[0];w.body=[{x:c.x-1,y:c.y}];w.direction='right';w.tick();expect(w.dead).toBe(true);}
 }
});
it('golden fruit and harvest rewards use legal cells and do not change speed from bonus points',()=>{
 const w=new SnakeWorld(()=>.5);w.eaten=3;w.food={x:9,y:11};w.tick();expect(w.eaten).toBe(4);expect(w.bonus).not.toBeNull();expect(w.bonus).not.toEqual(w.food);
 const interval=w.interval;w.bonus={x:10,y:11};w.tick();expect(w.score).toBe(40);expect(w.interval).toBe(interval);expect(w.bonus).toBeNull();
 w.eaten=7;w.food={x:11,y:11};w.tick();expect(w.score).toBe(90);expect(w.challenges).toBe(1);expect(w.target).toBe(16);
 w.bonus={x:0,y:0};w.bonusMoves=1;w.tick();expect(w.bonus).toBeNull();
});
it('all three snake speeds are distinct, deterministic at 30/60/144Hz and bounded',()=>{
 const intervals=[];for(const d of ['medium','hard','impossible'] as const){const states=[];for(const hz of [30,60,144]){const w=new SnakeWorld(()=>0,MAPS[0],d);for(let i=0;i<hz*.6;i++)w.update(1/hz);states.push(w.body[0]);}expect(states[0]).toEqual(states[1]);expect(states[1]).toEqual(states[2]);const w=new SnakeWorld(()=>0,MAPS[0],d);intervals.push(w.interval);w.eaten=1000;expect(w.interval).toBeGreaterThanOrEqual(.06);}expect(new Set(intervals).size).toBe(3);
});
it('moving trap hitboxes follow both axes and wall pistons warn before emerging',()=>{
 const o:Obstacle={x:100,width:100,side:-1,depth:50,kind:'ice-block',motion:'along',range:20,period:4,phase:0};
 const a=obstacleBounds(o,1),b=obstacleBounds(o,3);expect(a.start-b.start).toBeCloseTo(40);expect(a.start).toBeGreaterThanOrEqual(o.x);expect(a.end).toBeLessThanOrEqual(o.x+o.width);
 expect(touchesTrap(o,110,20,1)).toBe(false);expect(touchesTrap(o,110,20,3)).toBe(true);
 o.motion='across';o.side=0;o.depth=24;o.range=28;expect(obstacleBounds(o,1).low-obstacleBounds(o,3).low).toBeCloseTo(56);
 for(const t of [0,1,2,3]){const bounds=obstacleBounds(o,t),polygon=obstacleOutline(o,t);expect(Math.min(...polygon.map(p=>p.y))).toBe(bounds.low);expect(bounds.low).toBeGreaterThan(9);expect(bounds.high).toBeLessThan(161);}
 o.motion='piston';o.side=1;o.depth=64;expect(obstacleBounds(o,1).low).toBeCloseTo(106);expect(obstacleBounds(o,3).low).toBeGreaterThan(160);expect(obstacleBounds(o,3.4).warning).toBe(true);
});
it('100 seeded harvest routes per garden can complete the eight-fruit challenge with legal turns',()=>{
 for(const map of MAPS)for(let seed=0;seed<100;seed++){
  let s=seed;const w=new SnakeWorld(()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/2**32),map);
  for(let move=0;move<1000&&w.eaten<8;move++){
   const head=w.body[0],blocked=new Set([...map.blocks,...w.body.slice(0,-1)].map(c=>`${c.x},${c.y}`));
   let queue=[{...head,path:[] as ('up'|'right'|'down'|'left')[]}],seen=new Set([`${head.x},${head.y}`]);let path:('up'|'right'|'down'|'left')[]|undefined;
   for(const target of [w.food!,w.body.at(-1)!]){
    queue=[{...head,path:[]}];seen.clear();seen.add(`${head.x},${head.y}`);
   while(queue.length){const c=queue.shift()!;if(c.x===target.x&&c.y===target.y){path=c.path;break;}
    for(const [dir,dx,dy] of [['up',0,-1],['right',1,0],['down',0,1],['left',-1,0]] as const){const x=c.x+dx,y=c.y+dy,key=`${x},${y}`;if(x<0||x>=17||y<0||y>=20||blocked.has(key)||seen.has(key))continue;seen.add(key);queue.push({x,y,path:[...c.path,dir]});}}
   if(path?.length)break;
   }
   expect(path?.length??0,`${map.id} seed ${seed}`).toBeGreaterThan(0);w.steer(path![0]);w.tick();expect(w.dead).toBe(false);
  }
  expect(w.challenges,`${map.id} seed ${seed}`).toBe(1);expect(w.score).toBeGreaterThanOrEqual(120);
 }
});
