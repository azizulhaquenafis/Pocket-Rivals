import { describe, it, expect } from "vitest";
import {
  DotsBoard,
  boxes,
  edgeEnds,
  pickEdge,
} from "../../src/games/dots-and-boxes/Rules";
import { chooseEdge } from "../../src/games/dots-and-boxes/AI";
describe("Dots and Boxes", () => {
  it("maps every edge to a touch target and rejects blank space", () => {
    for (let i = 0; i < 40; i++) {
      const p = edgeEnds(i);
      expect(pickEdge((p.x + p.x2) / 2, (p.y + p.y2) / 2)).toBe(i);
    }
    expect(pickEdge(0, 0)).toBe(-1);
  });
  it("rejects illegal and duplicate edges, claims two adjacent boxes and retains the turn", () => {
    const b = new DotsBoard();
    for (const e of [0, 1, 4, 5, 20, 22]) expect(b.play(e)).toBe(0);
    const p = b.turn;
    expect(b.play(21)).toBe(2);
    expect(b.scores[p - 1]).toBe(2);
    expect(b.turn).toBe(p);
    expect(b.play(21)).toBe(-1);
    expect(b.play(40)).toBe(-1);
    expect(b.play(NaN)).toBe(-1);
  });
  it("finishes exactly once with all 16 boxes owned and restores legal histories", () => {
    const b = new DotsBoard();
    for (let e = 0; e < 40; e++) b.play(e);
    expect(b.scores[0] + b.scores[1]).toBe(16);
    expect(b.owners.every(Boolean)).toBe(true);
    expect(b.winner).not.toBeNull();
    expect(b.play(0)).toBe(-1);
    expect(DotsBoard.restore(b.save())).toEqual(b);
    expect(DotsBoard.restore({ history: [0, 0] }).history).toEqual([]);
  });
  it("all difficulties capture an available box without modifying the input", () => {
    for (const d of ["medium", "hard", "impossible"] as const) {
      const b = new DotsBoard();
      [0, 4, 20].forEach((e) => b.play(e));
      const save = b.save(),
        p = chooseEdge(b, d);
      expect(b.save()).toEqual(save);
      expect(p.edge).toBe(21);
      expect(p.milliseconds).toBeLessThan(500);
    }
  });
  it("Impossible finds an exact terminal endgame and returns a legal move", () => {
    const b = new DotsBoard();
    for (let e = 0; e < 33; e++) b.play(e);
    const result = chooseEdge(b, "impossible");
    expect(b.legal()).toContain(result.edge);
    expect(result.depth).toBe(7);
  });
  it("scores agree with owned box geometry through 100 reproducible full games", () => {
    let seed = 123;
    for (let game = 0; game < 100; game++) {
      const b = new DotsBoard();
      while (!b.winner) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const legal = b.legal();
        b.play(legal[seed % legal.length]);
        b.owners.forEach((p, i) => {
          if (p) expect(boxes[i].every((e) => b.edges[e])).toBe(true);
        });
      }
      expect(b.scores).toEqual([
        b.owners.filter((p) => p === 1).length,
        b.owners.filter((p) => p === 2).length,
      ]);
    }
  });
  it("supports 4x4, 5x5, and 6x6 board sizes with exact geometry and AI compatibility", () => {
    for (const size of [4, 5, 6] as const) {
      const b = new DotsBoard(size);
      const expectedBoxes = size * size;
      const expectedEdges = 2 * (size + 1) * size;
      expect(b.totalBoxes).toBe(expectedBoxes);
      expect(b.totalEdges).toBe(expectedEdges);
      expect(b.edges.length).toBe(expectedEdges);
      expect(b.owners.length).toBe(expectedBoxes);

      // Verify touch target mapping for every edge on this board size
      for (let i = 0; i < expectedEdges; i++) {
        const p = edgeEnds(i, size);
        expect(pickEdge((p.x + p.x2) / 2, (p.y + p.y2) / 2, size)).toBe(i);
      }

      // Play edges until the game finishes
      for (let e = 0; e < expectedEdges; e++) b.play(e);
      expect(b.scores[0] + b.scores[1]).toBe(expectedBoxes);
      expect(b.owners.every(Boolean)).toBe(true);
      expect(b.winner).not.toBeNull();

      // Serialization and restore preserve size
      const restored = DotsBoard.restore(b.save());
      expect(restored.size).toBe(size);
      expect(restored.totalBoxes).toBe(expectedBoxes);
      expect(restored.totalEdges).toBe(expectedEdges);
      expect(restored).toEqual(b);

      // AI plays legal moves on new board sizes
      const fresh = new DotsBoard(size);
      fresh.play(0);
      const move = chooseEdge(fresh, "medium");
      expect(fresh.legal()).toContain(move.edge);
    }
  });
});
