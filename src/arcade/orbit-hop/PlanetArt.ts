import type Phaser from "phaser";
import type { Planet } from "./Rules";
import { PLANET_CLASSES, planetSpec } from "./Planets";

/** Handcrafted vector rendering for all 25 planet types and density-coded gravity halos. */
export function drawPlanetHalo(
  g: Phaser.GameObjects.Graphics,
  p: Planet,
  px: number,
  y: number,
  field: number,
  next: boolean,
  age: number,
) {
  const cls = PLANET_CLASSES[p.kind ?? "terran"];
  const heavy = p.kind === "dense" || p.kind === "super";
  const feather = p.kind === "feather";

  // The outer boundary is the exact attraction range, never a decorative hitbox.
  const fillAlpha = feather
    ? next
      ? 0.08
      : 0.05
    : heavy
      ? next
        ? 0.16
        : 0.11
      : next
        ? 0.13
        : 0.08;
  g.fillStyle(next ? 0xffffff : cls.halo, fillAlpha).fillCircle(px, y, field);
  g.lineStyle(
    heavy ? 2 : 1.5,
    cls.halo,
    feather ? (next ? 0.22 : 0.11) : next ? 0.36 : 0.18,
  ).strokeCircle(px, y, field);

  // Inner concentric ring and inward pulse telegraph heavy density at a glance.
  if (heavy) {
    const innerR = p.r + (field - p.r) * 0.56;
    g.lineStyle(1.4, cls.halo, next ? 0.26 : 0.14).strokeCircle(px, y, innerR);
    const pulse = (age * (p.kind === "super" ? 0.72 : 0.85) + p.id * 0.37) % 1;
    const pr = field - pulse * (field - p.r - 10);
    const pa = Math.sin(pulse * Math.PI) * (next ? 0.34 : 0.18);
    g.lineStyle(1.8, cls.halo, pa).strokeCircle(px, y, pr);
  } else if (p.kind === "giant") {
    const midR = p.r + (field - p.r) * 0.68;
    g.lineStyle(1.1, 0xffffff, next ? 0.28 : 0.14).strokeCircle(px, y, midR);
  }

  g.lineStyle(1, 0xffffff, 0.28).strokeCircle(px, y, p.r + 8);

  if (next) {
    const pips = heavy ? 10 : feather ? 6 : 8;
    const spin = heavy ? 0.26 : p.kind === "giant" ? 0.16 : 0.12;
    for (let n = 0; n < pips; n++) {
      const a = (n * Math.PI * 2) / pips + age * spin;
      g.fillStyle(heavy ? cls.halo : 0xffffff, heavy ? 0.65 : 0.62).fillCircle(
        px + Math.cos(a) * field,
        y + Math.sin(a) * field,
        heavy ? 2 : 1.5,
      );
    }
  }
}

export function drawPlanetBody(
  g: Phaser.GameObjects.Graphics,
  p: Planet,
  px: number,
  y: number,
  age: number,
) {
  const spec = planetSpec(p.type);
  const r = p.r;

  // Soft ground-style drop shadow keeping Pocket Rivals paper depth.
  g.fillStyle(0x242b32, 0.1).fillEllipse(px + 4, y + r + 6, r * 1.9, 12);

  // Back half of planetary rings (drawn behind sphere).
  if (spec.ring !== undefined) {
    const rw = spec.pattern === "heavy-ring" ? r * 2.55 : r * 2.95;
    const rh = spec.pattern === "frost-ring" ? r * 0.72 : r * 0.6;
    g.lineStyle(spec.pattern === "gilded" ? 4.5 : 3.4, spec.ring, 0.78).strokeEllipse(
      px,
      y + 2,
      rw,
      rh,
    );
    if (spec.pattern === "gilded") {
      g.lineStyle(2, 0xfff2c2, 0.75).strokeEllipse(px, y + 2, rw * 0.84, rh * 0.78);
    }
  }

  // Base planet sphere fill (outline drawn after surface features so features never bleed).
  g.fillStyle(spec.color).fillCircle(px, y, r);

  // Surface texture per planet archetype.
  switch (spec.pattern) {
    case "craters":
      g.fillStyle(spec.accent, 0.75)
        .fillCircle(px - r * 0.34, y + r * 0.18, r * 0.24)
        .fillCircle(px + r * 0.3, y - r * 0.24, r * 0.18)
        .fillCircle(px + r * 0.1, y + r * 0.42, r * 0.14);
      break;
    case "clouds":
      g.fillStyle(spec.accent, 0.65)
        .fillEllipse(px - r * 0.22, y - r * 0.15, r * 0.9, r * 0.38)
        .fillEllipse(px + r * 0.25, y + r * 0.28, r * 0.75, r * 0.32);
      break;
    case "icy":
      g.lineStyle(2.2, spec.accent, 0.75)
        .lineBetween(px - r * 0.5, y - r * 0.2, px + r * 0.3, y - r * 0.5)
        .lineBetween(px - r * 0.3, y + r * 0.4, px + r * 0.5, y + r * 0.05);
      break;
    case "speckled":
      g.fillStyle(spec.accent, 0.65);
      for (const [dx, dy, s] of [
        [-0.36, -0.1, 0.13],
        [0.12, -0.35, 0.11],
        [0.32, 0.22, 0.16],
        [-0.14, 0.38, 0.12],
      ])
        g.fillCircle(px + r * dx, y + r * dy, r * s);
      break;
    case "moss":
      g.fillStyle(spec.accent, 0.72)
        .fillEllipse(px - r * 0.26, y - r * 0.3, r * 0.68, r * 0.42)
        .fillEllipse(px + r * 0.32, y + r * 0.24, r * 0.62, r * 0.42);
      break;
    case "continents":
      g.fillStyle(spec.accent, 0.92)
        .fillEllipse(px - r * 0.22, y - r * 0.18, r * 0.78, r * 0.52)
        .fillEllipse(px + r * 0.28, y + r * 0.26, r * 0.64, r * 0.44);
      break;
    case "canyons":
      g.fillStyle(spec.accent, 0.85).fillEllipse(px, y - r * 0.68, r * 0.95, r * 0.34);
      g.lineStyle(2.4, 0x9b4d34, 0.55)
        .lineBetween(px - r * 0.55, y + r * 0.08, px + r * 0.42, y - r * 0.04)
        .lineBetween(px - r * 0.3, y + r * 0.36, px + r * 0.5, y + r * 0.26);
      break;
    case "waves":
      g.lineStyle(2.4, spec.accent, 0.72)
        .lineBetween(px - r * 0.64, y - r * 0.18, px + r * 0.52, y - r * 0.18)
        .lineBetween(px - r * 0.48, y + r * 0.22, px + r * 0.66, y + r * 0.22);
      break;
    case "ribbons":
      g.lineStyle(3, spec.accent, 0.6)
        .lineBetween(px - r * 0.6, y - r * 0.28, px + r * 0.6, y - r * 0.12)
        .lineBetween(px - r * 0.55, y + r * 0.28, px + r * 0.55, y + r * 0.12);
      break;
    case "mesas":
      g.fillStyle(spec.accent, 0.52)
        .fillRoundedRect(px - r * 0.66, y - r * 0.18, r * 1.32, r * 0.22, 4)
        .fillRoundedRect(px - r * 0.48, y + r * 0.22, r * 0.96, r * 0.2, 4);
      break;
    case "ringed":
    case "frost-ring":
      g.lineStyle(2.8, spec.accent, 0.62)
        .lineBetween(px - r * 0.7, y - r * 0.24, px + r * 0.7, y - r * 0.24)
        .lineBetween(px - r * 0.66, y + r * 0.26, px + r * 0.66, y + r * 0.26);
      break;
    case "storm":
      g.fillStyle(spec.accent, 0.55)
        .fillRect(px - r * 0.76, y - r * 0.36, r * 1.52, r * 0.2)
        .fillRect(px - r * 0.74, y + r * 0.16, r * 1.48, r * 0.18);
      g.fillStyle(0xd86545, 0.85).fillEllipse(px + r * 0.24, y + r * 0.02, r * 0.48, r * 0.28);
      break;
    case "cirrus":
      g.lineStyle(2.8, spec.accent, 0.65)
        .lineBetween(px - r * 0.68, y - r * 0.28, px + r * 0.45, y - r * 0.28)
        .lineBetween(px - r * 0.4, y + r * 0.04, px + r * 0.72, y + r * 0.04)
        .lineBetween(px - r * 0.58, y + r * 0.36, px + r * 0.38, y + r * 0.36);
      break;
    case "swirl":
      g.lineStyle(2.8, spec.accent, 0.68).strokeEllipse(px, y, r * 1.24, r * 0.58);
      g.fillStyle(spec.accent, 0.55).fillCircle(px, y, r * 0.22);
      break;
    case "metallic":
      g.lineStyle(2.8, spec.accent, 0.65)
        .lineBetween(px - r * 0.46, y - r * 0.5, px + r * 0.46, y + r * 0.5);
      g.lineStyle(2, 0x242b32, 0.35).strokeCircle(px, y, r * 0.54);
      break;
    case "glossy":
      g.fillStyle(spec.accent, 0.32).fillEllipse(px - r * 0.24, y - r * 0.32, r * 0.66, r * 0.34);
      g.lineStyle(2, spec.accent, 0.5).strokeCircle(px, y, r * 0.68);
      break;
    case "heavy-ring":
      g.lineStyle(2.4, spec.accent, 0.55).strokeCircle(px, y, r * 0.48);
      break;
    case "magnetic": {
      const shimmer = 0.55 + Math.sin(age * 4 + p.id) * 0.2;
      g.lineStyle(2.4, spec.accent, shimmer)
        .strokeEllipse(px, y - r * 0.42, r * 0.85, r * 0.28)
        .strokeEllipse(px, y + r * 0.42, r * 0.85, r * 0.28);
      break;
    }
    case "banded-steel":
      g.fillStyle(spec.accent, 0.5).fillRect(px - r * 0.78, y - r * 0.14, r * 1.56, r * 0.28);
      g.fillStyle(0x242b32, 0.45)
        .fillCircle(px - r * 0.42, y, 2)
        .fillCircle(px, y, 2)
        .fillCircle(px + r * 0.42, y, 2);
      break;
    case "lava":
      g.lineStyle(2.8, spec.accent, 0.95)
        .lineBetween(px - r * 0.52, y - r * 0.28, px + r * 0.08, y + r * 0.04)
        .lineBetween(px + r * 0.08, y + r * 0.04, px + r * 0.54, y - r * 0.18)
        .lineBetween(px + r * 0.08, y + r * 0.04, px - r * 0.18, y + r * 0.56);
      g.fillStyle(0xffda8a, 0.9).fillCircle(px + r * 0.08, y + r * 0.04, r * 0.15);
      break;
    case "crystal":
      g.lineStyle(2.2, spec.accent, 0.88)
        .lineBetween(px, y - r * 0.74, px + r * 0.52, y)
        .lineBetween(px + r * 0.52, y, px, y + r * 0.74)
        .lineBetween(px, y + r * 0.74, px - r * 0.52, y)
        .lineBetween(px - r * 0.52, y, px, y - r * 0.74);
      break;
    case "atlas":
      g.fillStyle(spec.accent, 0.9)
        .fillEllipse(px - r * 0.26, y - r * 0.14, r * 0.72, r * 0.58)
        .fillEllipse(px + r * 0.34, y + r * 0.22, r * 0.56, r * 0.4);
      g.lineStyle(2, 0xffffff, 0.45).strokeCircle(px, y, r * 0.78);
      break;
    case "gilded":
      g.lineStyle(2.6, spec.accent, 0.8)
        .lineBetween(px - r * 0.68, y - r * 0.12, px + r * 0.68, y - r * 0.12)
        .lineBetween(px - r * 0.62, y + r * 0.22, px + r * 0.62, y + r * 0.22);
      break;
    case "geode":
      g.fillStyle(spec.accent, 0.72)
        .fillTriangle(
          px - r * 0.34,
          y + r * 0.18,
          px - r * 0.05,
          y - r * 0.42,
          px + r * 0.24,
          y + r * 0.18,
        );
      g.fillStyle(0xffffff, 0.7).fillCircle(px + r * 0.28, y - r * 0.18, r * 0.14);
      break;
  }

  // Soft Pocket Rivals gloss & shading + crisp #242b32 outer stroke.
  g.fillStyle(0xffffff, 0.24).fillCircle(px - r * 0.3, y - r * 0.3, r * 0.28);
  g.fillStyle(0x242b32, 0.12).fillCircle(px + r * 0.34, y + r * 0.26, r * 0.2);
  g.lineStyle(3, 0x242b32).strokeCircle(px, y, r);

  // Front lip of planetary rings overlapping the lower belly of the planet.
  if (spec.ring !== undefined) {
    const rw = (spec.pattern === "heavy-ring" ? r * 2.55 : r * 2.95) * 0.5;
    const rh = (spec.pattern === "frost-ring" ? r * 0.72 : r * 0.6) * 0.5;
    g.lineStyle(spec.pattern === "gilded" ? 4.4 : 3.4, spec.ring, 0.9);
    g.beginPath();
    for (let i = 0; i <= 16; i++) {
      const a = (i / 16) * Math.PI;
      const rx = px + Math.cos(a) * rw;
      const ry = y + 2 + Math.sin(a) * rh;
      if (i === 0) g.moveTo(rx, ry);
      else g.lineTo(rx, ry);
    }
    g.strokePath();
  }
}
