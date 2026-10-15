import {it,expect} from 'vitest';
import {StrikePhysics,ImpactRing} from '../../src/games/hammer-hit/StrikePhysics';
import {FixedStep} from '../../src/shared/physics/FixedStep';
it('puck has gravity, only a perfect strike contacts the bell, and all flights settle',()=>{
 for(let score=0;score<=100;score++){
  const p=new StrikePhysics(score);let min=602;
  for(let n=0;n<240;n++){p.step(1/120);min=Math.min(min,p.y);expect(p.y).toBeGreaterThanOrEqual(254);}
  expect(p.contacted).toBe(score===100);expect(p.settled).toBe(true);expect(p.y).toBe(602);
  if(score<100)expect(min).toBeCloseTo(602-score/100*348,0);
 }
});
it('ring impulse decays and fixed presentation agrees at 30/60/120 FPS',()=>{
 const states=[30,60,120].map(fps=>{const ring=new ImpactRing(),puck=new StrikePhysics(100),fixed=new FixedStep();let rang=false;
 for(let f=0;f<fps*4;f++)fixed.advance(1/fps,h=>{puck.step(h);if(puck.contacted&&!rang){ring.strike();rang=true;}ring.step(h);});
 expect(rang).toBe(true);expect(Math.abs(ring.angle)).toBeLessThan(.001);return [puck.y,ring.angle,ring.velocity];});
 expect(states[0]).toEqual(states[1]);expect(states[1]).toEqual(states[2]);
});
