import { ColorWorld } from "../../src/arcade/color-switch/Rules";

export const STEP = 1 / 120;
const TICKS_PER_CHOICE = 6;
const MAX_CHOICES = 260;

interface Choice {
  world: ColorWorld;
  tap: boolean;
  previous: Choice | null;
}

export function planCrossing(start: ColorWorld, margin = 0): boolean[] {
  class Rehearsal extends ColorWorld {
    obstacle(index = this.cleared) {
      const obstacle = super.obstacle(index);
      obstacle.windowWidth -= margin;
      return obstacle;
    }
  }
  const goal = start.cleared + 1;
  let choices: Choice[] = [{ world: start, tap: false, previous: null }];
  // Rehearse legal taps on a 50 ms grid, at most five taps per second.
  // Keep different speeds and altitudes so waiting for a window stays possible.
  for (let turn = 0; turn < MAX_CHOICES; turn++) {
    const next = new Map<string, Choice>();
    for (const previous of choices) {
      for (const tap of [false, true]) {
        if (tap && previous.world.vy < -116) continue;
        const world = Object.assign(
          new Rehearsal(start.difficulty),
          previous.world,
        );
        if (tap) world.hop();
        for (let tick = 0; tick < TICKS_PER_CHOICE; tick++) world.step(STEP);
        if (
          world.lives !== start.lives ||
          (margin && world.cleared > 0 && world.y + world.camera > 605)
        )
          continue;
        const choice = { world, tap, previous };
        if (world.cleared === goal) {
          const taps: boolean[] = [];
          for (
            let item: Choice | null = choice;
            item?.previous;
            item = item.previous
          )
            taps.push(item.tap);
          return taps.reverse();
        }
        const key = `${Math.round(world.y / 5)}:${Math.round(world.vy / 33)}`;
        if (!next.has(key)) next.set(key, choice);
      }
    }
    if (next.size === 0) break;
    choices = [...next.values()];
  }
  throw new Error(
    `No timed route found for ${start.difficulty} shape ${goal} at ${start.time.toFixed(2)}s`,
  );
}

export function replayCrossing(world: ColorWorld, taps: readonly boolean[]) {
  for (const tap of taps) {
    if (tap) world.hop();
    for (let tick = 0; tick < TICKS_PER_CHOICE; tick++) world.step(STEP);
  }
}
