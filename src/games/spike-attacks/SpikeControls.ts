export type Direction = { x: number; y: number };
export const KEY_CODES = [
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowLeft",
  "ArrowDown",
  "ArrowRight",
];
const ZERO = (): Direction => ({ x: 0, y: 0 });
export function keyboardDirection(
  keys: ReadonlySet<string>,
  player: 0 | 1,
  solo: boolean,
): Direction {
  const wasd = player === 0,
    arrows = player === 1 || (player === 0 && solo);
  return {
    x:
      Number((wasd && keys.has("KeyD")) || (arrows && keys.has("ArrowRight"))) -
      Number((wasd && keys.has("KeyA")) || (arrows && keys.has("ArrowLeft"))),
    y:
      Number((wasd && keys.has("KeyS")) || (arrows && keys.has("ArrowDown"))) -
      Number((wasd && keys.has("KeyW")) || (arrows && keys.has("ArrowUp"))),
  };
}
type Pad = Pick<Gamepad, "index" | "connected" | "axes" | "buttons">;
function direction(pad: Pad): Direction {
  const pressed = (i: number) => pad.buttons[i]?.pressed === true;
  const dx = Number(pressed(15)) - Number(pressed(14)),
    dy = Number(pressed(13)) - Number(pressed(12));
  if (dx || dy) return { x: dx, y: dy };
  const x = Number.isFinite(pad.axes[0]) ? pad.axes[0] : 0,
    y = Number.isFinite(pad.axes[1]) ? pad.axes[1] : 0;
  const length = Math.hypot(x, y);
  if (length < 0.2) return ZERO();
  const scale = Math.min(1, (length - 0.2) / 0.8) / length;
  return { x: x * scale, y: y * scale };
}
/** Poll inside the existing game update. Stable player slots, no listeners or extra loop. */
export class SpikeGamepads {
  private slots = new Map<number, 0 | 1>();
  private neutralRequired = new Set<number>();
  read(pads: readonly (Pad | null)[], solo: boolean): [Direction, Direction] {
    const output: [Direction, Direction] = [ZERO(), ZERO()];
    const connected = pads
      .filter((p): p is Pad => !!p?.connected)
      .sort((a, b) => a.index - b.index);
    for (const index of this.slots.keys())
      if (!connected.some((p) => p.index === index)) {
        this.slots.delete(index);
        this.neutralRequired.delete(index);
      }
    for (const pad of connected) {
      let slot = this.slots.get(pad.index);
      if (slot === undefined) {
        const occupied = [...this.slots.values()];
        slot = !occupied.includes(0)
          ? 0
          : !solo && !occupied.includes(1)
            ? 1
            : undefined;
        if (slot === undefined) continue;
        this.slots.set(pad.index, slot);
      }
      if (solo && slot === 1) continue;
      const d = direction(pad);
      if (this.neutralRequired.has(pad.index)) {
        if (!d.x && !d.y) this.neutralRequired.delete(pad.index);
        continue;
      }
      output[slot] = d;
    }
    return output;
  }
  poll(solo: boolean): [Direction, Direction] {
    try {
      return this.read(
        typeof navigator !== "undefined" && navigator.getGamepads
          ? [...navigator.getGamepads()]
          : [],
        solo,
      );
    } catch {
      return [ZERO(), ZERO()];
    }
  }
  pause() {
    for (const index of this.slots.keys()) this.neutralRequired.add(index);
  }
  dispose() {
    this.slots.clear();
    this.neutralRequired.clear();
  }
}
