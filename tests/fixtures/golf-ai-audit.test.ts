import { it, expect } from "vitest";
import { courses } from "../../src/games/mini-golf/ultimate/courses";
import { GolfPhysics } from "../../src/games/mini-golf/ultimate/GolfPhysics";
import { planShot } from "../../src/games/mini-golf/ultimate/ai/ShotPlanner";
for (let c = 0; c < 4; c++)
  it(`AI route audit ${c}`, () => {
    const w = new GolfPhysics(courses[c], 0, 123);
    let waypoint = 0;
    for (let turn = 0; turn < w.limit; turn++) {
      const p = planShot({
        state: w.exportState(),
        waypoint,
        difficulty: "impossible",
        delay: 0.65,
      });
      waypoint = p.waypoint;
      for (let i = 0; i < (0.65 + p.wait) * 240; i++) w.tick(1 / 240);
      if (!w.shootable) {
        for (let i = 0; i < 240 * 10; i++) {
          w.tick(1 / 240);
          if (w.shootable || w.status !== "playing") break;
        }
      }
      w.shoot(p.vx, p.vy);
      for (let i = 0; i < 240 * 12; i++) {
        w.tick(1 / 240);
        if (w.stopped || w.status !== "playing") break;
      }
      if (w.status !== "playing") break;
    }
    expect(w.status).toBe("won");
    expect(w.strokes).toBeLessThanOrEqual(w.limit);
  }, 30000);
