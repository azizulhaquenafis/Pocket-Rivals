import Phaser from "phaser";
import { theme } from "../../core/ThemeManager";

export class TimerRenderer {
  constructor(private scene: Phaser.Scene) {}

  drawStopwatch(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    r: number,
    isActiveTiming: boolean,
    pulseTime: number,
  ) {
    // 1. Crown and Loop at top
    g.fillStyle(0xd5dbdb);
    g.fillRoundedRect(cx - 14, cy - r - 22, 28, 16, 5);
    g.lineStyle(3, theme.ink);
    g.strokeRoundedRect(cx - 14, cy - r - 22, 28, 16, 5);

    // Loop
    g.lineStyle(3.5, theme.ink);
    g.strokeCircle(cx, cy - r - 26, 11);

    // 2. Stopwatch Outer Rim
    g.fillStyle(0xffffff);
    g.fillCircle(cx, cy, r);
    g.lineStyle(5, theme.ink);
    g.strokeCircle(cx, cy, r);

    // 3. Inner Dial Bezel
    g.fillStyle(0xfafafa);
    g.fillCircle(cx, cy, r - 12);
    g.lineStyle(2, 0xd0d3d4);
    g.strokeCircle(cx, cy, r - 12);

    // 4. Dial Ticks (12 main hour positions)
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      const isQuarter = i % 3 === 0;
      const innerR = r - (isQuarter ? 26 : 20);
      const outerR = r - 14;

      g.lineStyle(isQuarter ? 3 : 1.5, isQuarter ? theme.ink : 0x7f8c8d);
      g.lineBetween(
        cx + Math.sin(angle) * innerR,
        cy - Math.cos(angle) * innerR,
        cx + Math.sin(angle) * outerR,
        cy - Math.cos(angle) * outerR,
      );
    }

    // 5. Active state indicator (glowing pulse ring when timer is running invisibly)
    if (isActiveTiming) {
      const pulse = (Math.sin(pulseTime * 5) + 1) * 0.5; // 0..1
      const pulseR = 14 + pulse * 12;
      const alpha = 0.6 - pulse * 0.4;

      g.fillStyle(0xe74c3c, alpha);
      g.fillCircle(cx, cy, pulseR);

      g.fillStyle(0xe74c3c);
      g.fillCircle(cx, cy, 10);
      g.lineStyle(2, theme.ink);
      g.strokeCircle(cx, cy, 10);
    } else {
      // Static central hub pin
      g.fillStyle(0x34495e);
      g.fillCircle(cx, cy, 8);
      g.lineStyle(2, theme.ink);
      g.strokeCircle(cx, cy, 8);
    }
  }
}
