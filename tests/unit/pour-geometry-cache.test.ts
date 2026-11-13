import { it, expect } from "vitest";
import { PourWorld } from "../../src/arcade/perfect-pour/Rules";
it("cached profiles preserve every vessel volume and fractional water height", () => {
  const w = new PourWorld();
  for (let round = 1; round <= 10; round++) {
    w.round = round;
    let area = 0;
    for (let h = 0; h < 270; h++) {
      const width = w.width(h + 0.5);
      expect(w.heightFor(area + width * 0.37)).toBeCloseTo(h + 0.37, 8);
      area += width;
    }
    expect(w.capacity).toBe(area);
    expect(w.heightFor(area + 1)).toBe(270);
  }
});
