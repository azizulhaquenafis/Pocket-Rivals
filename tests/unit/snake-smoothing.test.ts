import { it, expect } from "vitest";
import { SnakeWorld } from "../../src/arcade/snake/SnakeRules";
import { SnakeView } from "../../src/arcade/snake/SnakeView";

it("a stalled frame cannot fast-forward several cells, and invalid deltas stay safe", () => {
  const w = new SnakeWorld(() => 0);
  w.update(10);
  expect(w.body[0]).toEqual({ x: 8, y: 11 });
  expect(w.accumulator).toBe(0.05);
  for (const dt of [NaN, Infinity, -1]) w.update(dt);
  expect(w.accumulator).toBe(0.05);
  w.update(0.05);
  w.update(0.05);
  w.update(0.03);
  expect(w.body[0]).toEqual({ x: 9, y: 11 });
});
it("retained sprites are reused, interpolate movement and keep corners axis-aligned", () => {
  let allocations = 0,
    removed = 0,
    destroyed = 0;
  const images: any[] = [];
  const image = () => {
    allocations++;
    const i: any = {
      x: 0,
      y: 0,
      visible: true,
      rotation: 0,
      setOrigin() {
        return i;
      },
      setDisplaySize() {
        return i;
      },
      setTint() {
        return i;
      },
      setAlpha() {
        return i;
      },
      setVisible(v: boolean) {
        i.visible = v;
        return i;
      },
      setPosition(x: number, y: number) {
        i.x = x;
        i.y = y;
        return i;
      },
      setRotation(v: number) {
        i.rotation = v;
        return i;
      },
    };
    images.push(i);
    return i;
  };
  const g: any = {
    fillStyle() {
      return g;
    },
    fillCircle() {
      return g;
    },
    fillRect() {
      return g;
    },
    generateTexture() {},
    destroy() {},
  };
  const scene: any = {
    sys: { settings: { key: "test" } },
    make: { graphics: () => g },
    textures: {
      get: () => ({ add() {} }),
      remove() {
        removed++;
      },
    },
    add: {
      image,
      container: () => ({
        add() {},
        destroy() {
          destroyed++;
        },
      }),
    },
  };
  const v = new SnakeView(scene),
    w = new SnakeWorld(() => 0);
  w.steer("up");
  w.tick();
  w.accumulator = w.interval / 2;
  expect(v.update(w)).toEqual({ x: 210, y: 360 });
  const count = allocations;
  for (let i = 0; i < 120; i++) {
    w.accumulator = w.interval * (0.01 + (0.98 * i) / 120);
    v.update(w);
  }
  expect(allocations).toBe(count);
  for (const i of images.filter((i) => i.visible))
    expect(Math.abs(Math.sin(2 * i.rotation))).toBeLessThan(1e-8);
  v.destroy();
  expect(removed).toBe(1);
  expect(destroyed).toBe(3);
});
