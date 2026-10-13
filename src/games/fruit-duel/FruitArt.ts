import type Phaser from "phaser";
const ink = 0x242b32;
/** Seven original geometric fruit silhouettes; no texture allocation. */
export function fruit(
  g: Phaser.GameObjects.Graphics,
  id: number,
  x: number,
  y: number,
  r: number,
) {
  const ellipse = (
    cx: number,
    cy: number,
    w: number,
    h: number,
    color: number,
  ) => {
    g.fillStyle(color).fillEllipse(cx, cy, w, h);
    g.lineStyle(3, ink).strokeEllipse(cx, cy, w, h);
  };
  const leaf = () => {
    g.lineStyle(4, ink).lineBetween(x, y - r * 0.65, x + 3, y - r * 1.08);
    ellipse(x + r * 0.25, y - r * 0.92, r * 0.55, r * 0.23, 0x91b96f);
  };
  if (id === 0) {
    ellipse(x - r * 0.23, y, r * 1.22, r * 1.7, 0xf07a6e);
    ellipse(x + r * 0.23, y, r * 1.22, r * 1.7, 0xf07a6e);
    leaf();
  } else if (id === 1) {
    ellipse(x, y, r * 1.8, r * 1.8, 0xf49b58);
    leaf();
    g.fillStyle(0xffd69b).fillCircle(x - r * 0.3, y - r * 0.3, r * 0.17);
  } else if (id === 2) {
    g.fillStyle(0x91b96f).fillTriangle(
      x - r,
      y - r * 0.4,
      x + r,
      y - r * 0.4,
      x,
      y + r,
    );
    g.lineStyle(4, ink).strokeTriangle(
      x - r,
      y - r * 0.4,
      x + r,
      y - r * 0.4,
      x,
      y + r,
    );
    g.fillStyle(0xf07a6e).fillTriangle(
      x - r * 0.75,
      y - r * 0.22,
      x + r * 0.75,
      y - r * 0.22,
      x,
      y + r * 0.7,
    );
    for (const dx of [-0.4, 0, 0.4])
      g.fillStyle(ink).fillEllipse(x + r * dx, y, r * 0.08, r * 0.15);
  } else if (id === 3) {
    g.lineStyle(r * 0.48, ink)
      .beginPath()
      .arc(x - r * 0.4, y - r * 0.45, r, 0, 1.7)
      .strokePath();
    g.lineStyle(r * 0.34, 0xf3cf70)
      .beginPath()
      .arc(x - r * 0.4, y - r * 0.45, r, 0, 1.7)
      .strokePath();
    g.lineStyle(5, ink).lineBetween(
      x + r * 0.6,
      y - r * 0.45,
      x + r * 0.67,
      y - r * 0.6,
    );
  } else if (id === 4) {
    ellipse(x, y, r * 1.7, r * 1.7, 0xc96b80);
    g.fillStyle(0xc96b80).fillTriangle(
      x - r * 0.4,
      y - r * 0.7,
      x + r * 0.4,
      y - r * 0.7,
      x,
      y - r * 1.15,
    );
    g.lineStyle(3, ink).strokeTriangle(
      x - r * 0.4,
      y - r * 0.7,
      x + r * 0.4,
      y - r * 0.7,
      x,
      y - r * 1.15,
    );
    g.fillStyle(0xffdacf).fillCircle(x + r * 0.23, y + r * 0.2, r * 0.44);
    for (const [dx, dy] of [
      [0.1, 0],
      [0.38, 0.12],
      [0.1, 0.3],
    ])
      g.fillStyle(0xc96b80).fillCircle(x + r * dx, y + r * dy, r * 0.09);
  } else if (id === 5) {
    ellipse(x, y + r * 0.15, r * 1.4, r * 1.7, 0xf3cf70);
    g.lineStyle(2, ink, 0.6);
    for (let i = -1; i <= 1; i++)
      g.lineBetween(
        x - r * 0.5,
        y + r * (i * 0.35),
        x + r * 0.5,
        y + r * (i * 0.35 + 0.45),
      );
    g.fillStyle(0x91b96f)
      .fillTriangle(
        x - r * 0.6,
        y - r * 0.55,
        x,
        y - r * 1.4,
        x + r * 0.15,
        y - r * 0.5,
      )
      .fillTriangle(
        x - r * 0.1,
        y - r * 0.5,
        x + r * 0.55,
        y - r * 1.3,
        x + r * 0.6,
        y - r * 0.5,
      );
  } else {
    g.fillStyle(0xf07a6e).fillTriangle(
      x - r * 0.85,
      y - r * 0.45,
      x + r * 0.85,
      y - r * 0.45,
      x,
      y + r,
    );
    g.lineStyle(3, ink).strokeTriangle(
      x - r * 0.85,
      y - r * 0.45,
      x + r * 0.85,
      y - r * 0.45,
      x,
      y + r,
    );
    g.fillStyle(0x91b96f).fillTriangle(
      x - r * 0.7,
      y - r * 0.55,
      x + r * 0.7,
      y - r * 0.55,
      x,
      y - r * 0.05,
    );
    for (const [dx, dy] of [
      [-0.3, -0.1],
      [0.3, -0.1],
      [0, 0.35],
    ])
      g.fillStyle(0xffdf91).fillEllipse(
        x + r * dx,
        y + r * dy,
        r * 0.09,
        r * 0.17,
      );
  }
}
