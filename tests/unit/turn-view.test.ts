import { it, expect, vi } from "vitest";
import { TurnView, turnBackground } from "../../src/shared/components/TurnView";
it("turn view rotates module content, inverts input, blocks transition, and destroys owned objects", () => {
  const root = {
    add: vi.fn(),
    setRotation: vi.fn(),
    setAlpha: vi.fn(),
    destroy: vi.fn(),
  };
  const scene = { add: { container: vi.fn(() => root) } };
  const child = { x: 60, y: 541, setPosition: vi.fn() };
  const view = new TurnView(scene as any, [child as any]);
  expect(child.setPosition).toHaveBeenCalledWith(-150, 160);
  expect(view.point(60, 541)).toEqual({ x: 60, y: 541 });
  view.set(true);
  expect(view.ready).toBe(false);
  view.update(0.15);
  expect(view.rotation).toBe(Math.PI);
  view.update(0.15);
  expect(view.ready).toBe(true);
  expect(view.point(360, 221)).toEqual({ x: 60, y: 541 });
  view.set(false);
  view.update(0.3);
  expect(view.point(60, 541)).toEqual({ x: 60, y: 541 });
  expect(turnBackground(1)).not.toBe(turnBackground(2));
  view.destroy();
  expect(root.destroy).toHaveBeenCalledWith(true);
});
