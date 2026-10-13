import { p, r, outer, type Course } from "./types";
const lane = (1920 - 196) / 6,
  x = (i: number) => 28 + i * (lane + 28),
  c = (i: number) => x(i) + lane / 2;
export const foundry: Course = {
  id: "foundry",
  name: "Foundry",
  subtitle: "Belts, beams & molten trouble",
  tip: "Follow the six winding lanes. Belts push, oil slides, and the red gates pulse.",
  baseLimit: 18,
  color: 0xf1c879,
  start: p(c(0), 982),
  hole: p(c(5), 942),
  walls: [
    ...outer(),
    ...Array.from({ length: 5 }, (_, i) =>
      r(x(i) + lane, i % 2 === 0 ? 328 : 98, 28, 724),
    ),
    r(c(0) - 68, 819, 46, 46),
    r(x(1), 598, 150, 18),
    r(x(1) + lane - 150, 738, 150, 18),
  ],
  circles: [
    { ...p(c(0) + 55, 692), r: 26 },
    { ...p(c(5) - 75, 862), r: 26 },
    { ...p(c(5) + 75, 862), r: 26 },
  ],
  movers: [
    {
      from: p(x(2) + 42, 722),
      to: p(x(2) + lane - 152, 722),
      seconds: (lane - 194) / 110,
      w: 110,
      h: 18,
    },
    {
      from: p(x(5) + 42, 398),
      to: p(x(5) + lane - 152, 398),
      seconds: (lane - 194) / 110,
      w: 110,
      h: 18,
    },
    {
      from: p(x(5) + lane - 152, 538),
      to: p(x(5) + 42, 538),
      seconds: (lane - 194) / 110,
      w: 110,
      h: 18,
    },
  ],
  surfaces: [
    { ...r(x(0), 428, lane, 64), kind: "belt", push: p(0, 750) },
    { ...r(x(3), 348, lane, 64), kind: "belt", push: p(0, -750) },
  ],
  fields: [{ ...p(c(3), 818), r: 170, strength: 450, core: 22 }],
  fans: [{ ...p(c(2), 478), length: 190, hub: 16, spin: 120 }],
  lasers: [{ ...r(x(4), 354, lane, 8), phase: 0 }],
  lava: [
    { ...p(c(4) - 55, 722), r: 38 },
    { ...p(c(4) + 55, 498), r: 38 },
    { ...p(c(5), 752), r: 38 },
  ],
  diamond: { ...p(c(1), 428), r: 34 },
  piston: { ...r(x(3), 533, 30, 70), extension: lane - 72 },
};
export const oil = { ...p(c(1), 882), r: 70 };
