import type Phaser from "phaser";
import { TUBE_HEIGHT } from "./Geometry";
import { theme } from "../../core/ThemeManager";
export const TUBE = {
  cx: 210,
  yTop: 155,
  yBottom: 465,
  width: 82,
  innerHalfW: 36,
  height: TUBE_HEIGHT,
};
export class WaterRenderer {
  constructor(_scene: Phaser.Scene) {}
  drawTube(
    g: Phaser.GameObjects.Graphics,
    level: number,
    time: number,
    _reveal: boolean,
    _actual: number,
    _one: number | null,
    _two: number | null,
  ) {
    const { cx, yTop, yBottom, innerHalfW: w, height } = TUBE;
    g.fillStyle(0xeaf4fc).fillRoundedRect(cx - w, yTop, 2 * w, height, 16);
    const h = Math.max(0, Math.min(1, level / 10000)) * height;
    const surface = yBottom - h;
    if (h > 0) {
      // The inner base is the measured 0% boundary: no empty glass foot.
      g.fillStyle(0x3498db).fillRoundedRect(cx - w, surface, w * 2, h, {
        tl: 0,
        tr: 0,
        bl: Math.min(16, h),
        br: Math.min(16, h),
      });
      g.fillStyle(0x3498db)
        .beginPath()
        .moveTo(cx - w, surface + 3);
      for (let i = 0; i <= 18; i++)
        g.lineTo(
          cx - w + (i * w) / 9,
          surface + Math.sin(time * 3.5 + i * 0.65) * Math.min(1.7, h / 4),
        );
      g.lineTo(cx + w, surface + 3)
        .closePath()
        .fillPath();
    }
    g.fillStyle(0xffffff, 0.3).fillRoundedRect(
      cx - w + 7,
      yTop + 12,
      5,
      height - 25,
      3,
    );
    g.lineStyle(4, theme.ink).strokeRoundedRect(
      cx - w,
      yTop,
      w * 2,
      height,
      16,
    );
  }
}
