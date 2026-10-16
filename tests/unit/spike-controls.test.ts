import { it, expect } from "vitest";
import {
  keyboardDirection,
  SpikeGamepads,
} from "../../src/games/spike-attacks/SpikeControls";
function pad(index: number, x = 0, y = 0, dpad = -1) {
  return {
    index,
    connected: true,
    axes: [x, y],
    buttons: Array.from({ length: 16 }, (_, i) => ({
      pressed: i === dpad,
      value: i === dpad ? 1 : 0,
      touched: false,
    })),
  };
}
it("solo arrows and WASD both control Orange; local keyboards remain independent", () => {
  expect(keyboardDirection(new Set(["ArrowRight"]), 0, true)).toEqual({
    x: 1,
    y: 0,
  });
  expect(keyboardDirection(new Set(["KeyW"]), 0, true)).toEqual({
    x: 0,
    y: -1,
  });
  const both = new Set(["KeyD", "ArrowLeft"]);
  expect(keyboardDirection(both, 0, false)).toEqual({ x: 1, y: 0 });
  expect(keyboardDirection(both, 1, false)).toEqual({ x: -1, y: 0 });
  expect(keyboardDirection(new Set(["KeyA", "ArrowRight"]), 0, true)).toEqual({
    x: 0,
    y: 0,
  });
});
it("gamepads handle dead zones, D-pad and two stable player assignments", () => {
  const input = new SpikeGamepads();
  expect(input.read([pad(0, 0.1, -0.1)], false)[0]).toEqual({ x: 0, y: 0 });
  expect(input.read([pad(0, 1, 0), pad(2, -1, 0)], false)).toEqual([
    { x: 1, y: 0 },
    { x: -1, y: 0 },
  ]);
  // Disconnecting Orange must not steal Blue\'s controller assignment.
  expect(input.read([null, null, pad(2, 0, 0, 12)], false)).toEqual([
    { x: 0, y: 0 },
    { x: 0, y: -1 },
  ]);
  expect(input.read([pad(1, 1, 0), null, pad(2, -1, 0)], false)).toEqual([
    { x: 1, y: 0 },
    { x: -1, y: 0 },
  ]);
});
it("solo never assigns a controller to the AI and pause requires neutral before moving", () => {
  const input = new SpikeGamepads();
  expect(input.read([pad(0, 1, 0), pad(1, -1, 0)], true)).toEqual([
    { x: 1, y: 0 },
    { x: 0, y: 0 },
  ]);
  input.pause();
  expect(input.read([pad(0, 1, 0)], true)[0]).toEqual({ x: 0, y: 0 });
  input.read([pad(0)], true);
  expect(input.read([pad(0, 0, -1)], true)[0]).toEqual({ x: 0, y: -1 });
  input.dispose();
  expect(input.read([], false)).toEqual([
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ]);
});
