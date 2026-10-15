import Phaser from "phaser";
import { TUBE_HEIGHT } from "./Geometry";
import { theme } from "../../core/ThemeManager";
import { formatPercent } from "./WaterGuessRules";

export const TUBE = {
  cx: 210,
  yTop: 155, // 100.00% level
  yBottom: 465, // 0.00% level
  width: 82,
  innerHalfW: 36,
  height: TUBE_HEIGHT, // usable height: 465 - 155 = 310
};

export class WaterRenderer {
  constructor(private scene: Phaser.Scene) {}

  drawTube(
    g: Phaser.GameObjects.Graphics,
    currentWaterLevelHundredths: number, // 0..10000
    animTime: number,
    revealed: boolean,
    actualHundredths: number,
    guess0Hundredths: number | null,
    guess1Hundredths: number | null,
  ) {
    const { cx, yTop, yBottom, innerHalfW, height } = TUBE;

    // 1. Tube background (light glass tint)
    g.fillStyle(0xeaf4fc, 0.85);
    g.fillRoundedRect(
      cx - innerHalfW,
      yTop - 12,
      innerHalfW * 2,
      height + 24,
      18,
    );

    // 2. Graduation reference tick marks on the right side
    g.lineStyle(2, 0x95a5a6, 0.7);
    const ticks = [
      { pct: 0.25, label: "25%" },
      { pct: 0.5, label: "50%" },
      { pct: 0.75, label: "75%" },
    ];
    for (const t of ticks) {
      const y = yBottom - t.pct * height;
      g.lineBetween(cx + innerHalfW - 14, y, cx + innerHalfW - 2, y);
    }
    // Subtle 10% micro-ticks
    g.lineStyle(1, 0xbdc3c7, 0.4);
    for (let p = 0.1; p < 1.0; p += 0.1) {
      if (
        Math.abs(p - 0.25) < 0.01 ||
        Math.abs(p - 0.5) < 0.01 ||
        Math.abs(p - 0.75) < 0.01
      )
        continue;
      const y = yBottom - p * height;
      g.lineBetween(cx + innerHalfW - 8, y, cx + innerHalfW - 2, y);
    }

    // 3. Water body
    const frac = Math.max(0, Math.min(1, currentWaterLevelHundredths / 10000));
    const waterHeight = frac * height;
    const waterBaseY = yBottom;
    const waterSurfaceY = waterBaseY - waterHeight;

    if (waterHeight > 0) {
      // Main water fill
      g.fillStyle(0x2980b9, 0.95);
      g.beginPath();
      g.moveTo(cx - innerHalfW + 2, waterBaseY);
      g.lineTo(cx - innerHalfW + 2, waterSurfaceY);

      // Subtle water ripple along surface
      const steps = 14;
      const stepW = (innerHalfW * 2 - 4) / steps;
      for (let i = 0; i <= steps; i++) {
        const x = cx - innerHalfW + 2 + i * stepW;
        const wave =
          Math.sin(animTime * 4.5 + i * 0.7) * 2.2 * Math.min(1, frac * 4);
        g.lineTo(x, waterSurfaceY + wave);
      }

      g.lineTo(cx + innerHalfW - 2, waterBaseY);
      g.closePath();
      g.fillPath();

      // Slightly lighter upper layer
      g.fillStyle(0x3498db, 0.75);
      g.fillRect(
        cx - innerHalfW + 2,
        waterSurfaceY + 4,
        innerHalfW * 2 - 4,
        Math.max(0, waterHeight - 4),
      );

      // Surface foam highlight
      g.lineStyle(2.5, 0xd4e6f1, 0.85);
      g.beginPath();
      for (let i = 0; i <= steps; i++) {
        const x = cx - innerHalfW + 2 + i * stepW;
        const wave =
          Math.sin(animTime * 4.5 + i * 0.7) * 2.2 * Math.min(1, frac * 4);
        if (i === 0) g.moveTo(x, waterSurfaceY + wave);
        else g.lineTo(x, waterSurfaceY + wave);
      }
      g.strokePath();
    }

    // 4. Glass reflection streak (left side)
    g.fillStyle(0xffffff, 0.35);
    g.fillRoundedRect(cx - innerHalfW + 6, yTop, 7, height - 10, 3);

    // 5. Outer tube glass contour and dark border
    g.lineStyle(4, theme.ink);
    g.strokeRoundedRect(
      cx - innerHalfW,
      yTop - 12,
      innerHalfW * 2,
      height + 24,
      18,
    );

    // Top rim lip
    g.lineStyle(5, theme.ink);
    g.lineBetween(
      cx - innerHalfW - 6,
      yTop - 12,
      cx + innerHalfW + 6,
      yTop - 12,
    );

    // 6. Reveal marker lines (if revealed)
    if (revealed) {
      // Actual green marker
      const actualY = yBottom - (actualHundredths / 10000) * height;
      g.lineStyle(3, 0x27ae60, 1);
      g.lineBetween(
        cx - innerHalfW - 14,
        actualY,
        cx + innerHalfW + 14,
        actualY,
      );

      // P1 Orange guess marker
      if (guess0Hundredths !== null) {
        const g0Y = yBottom - (guess0Hundredths / 10000) * height;
        g.lineStyle(2.5, theme.orange, 0.9);
        g.lineBetween(cx - innerHalfW - 22, g0Y, cx - innerHalfW - 2, g0Y);
      }

      // P2 Blue guess marker
      if (guess1Hundredths !== null) {
        const g1Y = yBottom - (guess1Hundredths / 10000) * height;
        g.lineStyle(2.5, theme.blue, 0.9);
        g.lineBetween(cx + innerHalfW + 2, g1Y, cx + innerHalfW + 22, g1Y);
      }
    }
  }
}
