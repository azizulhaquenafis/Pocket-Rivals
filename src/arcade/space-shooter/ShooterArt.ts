import type Phaser from "phaser";
import { theme } from "../../core/ThemeManager";
import { rounded, circle } from "../../shared/components/drawing";
import { POWERUPS, type PowerupKind } from "./Powerups";
import type { ShooterWorld } from "./ShooterWorld";
type G = Phaser.GameObjects.Graphics;
const ENEMY_COLORS = [
  0xe8a16f, 0x7bb9cf, 0x8e9d94, 0xa58bc0, 0xedc676, 0xa596be,
];
export function powerIcon(
  g: G,
  kind: PowerupKind,
  x: number,
  y: number,
  size = 1,
) {
  g.save();
  g.translateCanvas(x, y);
  g.scaleCanvas(size, size);
  g.lineStyle(2, theme.ink);
  if (kind === "spread")
    g.lineBetween(0, 7, 0, -7)
      .lineBetween(-3, 6, -8, -4)
      .lineBetween(3, 6, 8, -4);
  else if (kind === "rapid")
    g.fillStyle(theme.ink).fillPoints(
      [
        { x: 1, y: -9 },
        { x: -6, y: 1 },
        { x: 0, y: 1 },
        { x: -2, y: 9 },
        { x: 7, y: -2 },
        { x: 2, y: -2 },
      ],
      true,
    );
  else if (kind === "laser")
    g.lineBetween(-3, -8, -3, 8)
      .lineBetween(3, -8, 3, 8)
      .lineBetween(-6, -5, 6, -5);
  else if (kind === "drone")
    g.strokeTriangle(-5, -7, -10, 5, 0, 5).strokeTriangle(5, -7, 0, 5, 10, 5);
  else if (kind === "shield")
    g.strokePoints(
      [
        { x: -7, y: -7 },
        { x: 7, y: -7 },
        { x: 6, y: 3 },
        { x: 0, y: 9 },
        { x: -6, y: 3 },
      ],
      true,
    );
  else
    g.fillStyle(theme.ink)
      .fillCircle(-4, -3, 5)
      .fillCircle(4, -3, 5)
      .fillTriangle(-8, -1, 8, -1, 0, 9);
  g.restore();
}
export function drawShooter(
  g: G,
  w: ShooterWorld,
  age: number,
  alpha: number,
  firing: boolean,
) {
  g.clear();
  rounded(g, 24, 112, 372, 538, 20, 0xd8d4e6, 4);
  g.fillGradientStyle(0xe3dfec, 0xe3dfec, 0xc7c4dc, 0xc7c4dc).fillRoundedRect(
    28,
    116,
    364,
    530,
    17,
  );
  for (let i = 0; i < 35; i++) {
    const x = 38 + ((i * 137) % 345),
      y = 166 + ((i * 67 + age * 9) % 472);
    g.fillStyle(theme.ink, i % 3 === 0 ? 0.18 : 0.1).fillCircle(
      x,
      y,
      i % 3 === 0 ? 1.7 : 1,
    );
  }
  // Compact flight deck. The model owns all durations; bars freeze on pause.
  rounded(g, 37, 125, 59, 25, 8, theme.ink, 0);
  rounded(g, 103, 125, 170, 25, 8, 0xfff9ed, 1.5);
  if (w.rapid > 0)
    g.fillStyle(POWERUPS.rapid.color).fillRoundedRect(
      108,
      153,
      159 * Math.min(1, w.rapid / 14),
      3,
      1.5,
    );
  if (w.laser > 0)
    g.fillStyle(POWERUPS.laser.color).fillRoundedRect(
      108,
      158,
      159 * Math.min(1, w.laser / 16),
      3,
      1.5,
    );
  if (w.drone > 0) {
    powerIcon(g, "drone", 300, 138, 0.75);
    g.lineStyle(2, POWERUPS.drone.color).lineBetween(
      290,
      152,
      290 + 20 * Math.min(1, w.drone / 18),
      152,
    );
  }
  if (w.shield) {
    circle(g, 344, 138, 12, POWERUPS.shield.color, 1.5);
    powerIcon(g, "shield", 344, 138, 0.75);
  } else g.lineStyle(1, theme.ink, 0.25).strokeCircle(344, 138, 11);
  for (const e of w.enemies)
    if (e.alive) {
      const color =
        (e.hit ?? 0) > 0 ? theme.white : (ENEMY_COLORS[e.kind] ?? theme.orange);
      g.save();
      g.translateCanvas(e.x, e.y);
      if ((e.charge ?? 0) > 0) {
        const t = 1 - Math.min(1, e.charge! / (e.kind === 5 ? 0.55 : 0.38));
        g.lineStyle(2, 0xc7745b, 0.5 + t * 0.5).strokeCircle(0, 5, 17 + t * 5);
        g.fillStyle(0xffe1b0).fillCircle(0, 14, 3 + t * 2);
      }
      if (e.kind === 5) {
        rounded(g, -25, -15, 50, 30, 9, color, 3);
        g.lineStyle(4, theme.ink)
          .lineBetween(-17, 12, -17, 21)
          .lineBetween(0, 12, 0, 21)
          .lineBetween(17, 12, 17, 21);
        g.lineStyle(2, 0xe9dcfa).lineBetween(-18, -10, 18, -10);
      } else if (e.kind === 4) {
        g.fillStyle(color).fillRoundedRect(-14, -12, 28, 24, 6);
        g.lineStyle(3, theme.ink).strokeRoundedRect(-14, -12, 28, 24, 6);
        powerIcon(g, e.drop ?? "spread", 0, 0, 0.8);
      } else {
        if (e.kind === 1)
          g.fillStyle(color)
            .fillTriangle(-12, -3, -22, 9, -10, 7)
            .fillTriangle(12, -3, 22, 9, 10, 7);
        rounded(g, -14, -10, 28, 20, e.kind === 1 ? 9 : 4, color, 3);
        if (e.kind === 2)
          g.lineStyle(3, 0xd5e1cf)
            .lineBetween(-9, -6, 9, -6)
            .lineBetween(-9, 6, 9, 6);
        g.fillStyle(theme.ink).fillRoundedRect(-8, -3, 16, 6, 2);
        g.fillStyle(0xfff9e9).fillCircle(-4, 0, 1.4).fillCircle(4, 0, 1.4);
        if (e.kind === 3) g.lineStyle(5, theme.ink).lineBetween(0, 8, 0, 17);
        else
          g.lineStyle(2.5, theme.ink)
            .lineBetween(-9, 10, -13, 14)
            .lineBetween(9, 10, 13, 14);
      }
      if ((e.maxHp ?? e.hp) > 1) {
        const width = e.kind === 5 ? 42 : 24;
        g.lineStyle(3, theme.ink, 0.22).lineBetween(
          -width / 2,
          -21,
          width / 2,
          -21,
        );
        g.lineStyle(3, e.kind === 5 ? 0xfff4ce : 0x56687c).lineBetween(
          -width / 2,
          -21,
          -width / 2 + (width * e.hp) / (e.maxHp ?? e.hp),
          -21,
        );
      }
      g.restore();
    }
  for (const p of w.projectiles)
    if (p.active) {
      const x = p.previousX + (p.x - p.previousX) * alpha,
        y = p.previousY + (p.y - p.previousY) * alpha;
      if (p.laser) g.lineStyle(10, 0x8bd2e2, 0.18).lineBetween(x, y, x, y + 23);
      g.lineStyle(
        p.enemy ? 4 : p.laser ? 4 : 3.5,
        p.enemy ? 0xb96559 : p.laser ? 0x3b9fbd : 0xfffbeb,
      ).lineBetween(
        x,
        y,
        x - p.vx * 0.015,
        y + (p.enemy ? -8 : p.laser ? 23 : 10),
      );
    }
  for (const p of w.pickups)
    if (p.active) {
      const bob = Math.sin(p.age * 5) * 0.8;
      g.fillStyle(POWERUPS[p.kind].color, 0.2).fillCircle(p.x, p.y + bob, 18);
      rounded(
        g,
        p.x - 12,
        p.y - 12 + bob,
        24,
        24,
        8,
        POWERUPS[p.kind].color,
        2,
      );
      powerIcon(g, p.kind, p.x, p.y + bob, 0.9);
    }
  for (const b of w.bursts) {
    const t = b.age / 0.45,
      color = b.kind === "pickup" ? 0xffe4a4 : 0xfff6de;
    g.lineStyle(2, color, 1 - t).strokeCircle(
      b.x,
      b.y,
      3 + t * (b.kind === "kill" ? 22 : 13),
    );
    if (b.kind === "kill")
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        g.fillStyle(color, 1 - t).fillCircle(
          b.x + Math.cos(a) * t * 20,
          b.y + Math.sin(a) * t * 20,
          2 * (1 - t),
        );
      }
  }
  const x = w.player.x,
    y = w.player.y;
  if (w.drone > 0)
    for (const side of [-1, 1]) {
      const dx = Math.max(37, Math.min(383, x + side * 29));
      g.fillStyle(theme.blue).fillTriangle(
        dx,
        y - 6,
        dx - 8,
        y + 8,
        dx + 8,
        y + 8,
      );
      g.lineStyle(2, theme.ink).strokeTriangle(
        dx,
        y - 6,
        dx - 8,
        y + 8,
        dx + 8,
        y + 8,
      );
    }
  if (w.shield)
    g.lineStyle(2.5, POWERUPS.shield.color, 0.7).strokeCircle(x, y, 27);
  g.fillStyle(
    theme.orange,
    w.invulnerable > 0 ? 0.55 + 0.45 * Math.sin(age * 18) ** 2 : 1,
  ).fillTriangle(x, y - 18, x - 20, y + 14, x + 20, y + 14);
  g.lineStyle(3, theme.ink).strokeTriangle(
    x,
    y - 18,
    x - 20,
    y + 14,
    x + 20,
    y + 14,
  );
  rounded(g, x - 5, y - 4, 10, 14, 4, theme.blue, 2);
  if (w.weaponLevel > 0)
    g.lineStyle(3, theme.ink)
      .lineBetween(x - 10, y + 1, x - 10, y - 11)
      .lineBetween(x + 10, y + 1, x + 10, y - 11);
  if (firing && !w.transitioning)
    g.fillStyle(0xfff8d6).fillTriangle(
      x - 5,
      y + 17,
      x + 5,
      y + 17,
      x,
      y + 23 + Math.sin(age * 35) * 3,
    );
  g.lineStyle(4, theme.ink).strokeRoundedRect(24, 112, 372, 538, 20);
}
