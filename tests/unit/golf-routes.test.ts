import {it,expect} from 'vitest';
import {courses} from '../../src/games/mini-golf/ultimate/courses';
import {GolfPhysics} from '../../src/games/mini-golf/ultimate/GolfPhysics';
import {golfSolutions} from '../fixtures/golf-solutions';
for(let course=0;course<4;course++)it(`completes ${courses[course].name} from its tee using legal shots`,()=>{
 const w=new GolfPhysics(courses[course],0,()=>.9);
 for(const [wait,vx,vy] of golfSolutions[course]){
  for(let i=0;i<wait*240;i++)w.tick(1/240);
  expect(w.shoot(vx,vy)).toBe(true);
  for(let i=0;i<240*12;i++){w.tick(1/240);if(w.stopped||w.status!=='playing')break;}
 }
 expect(w.status).toBe('won');expect(w.strokes).toBeLessThanOrEqual(w.limit);expect(w.recoveries).toBe(0);
});
