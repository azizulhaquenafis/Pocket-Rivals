import type Phaser from "phaser";
const ink = 0x242b32;
const skin = [
  0xef7168, 0xf6a14c, 0x73b878, 0xf2ce64, 0xc76885, 0xeac56c, 0xeb747b,
];
/** Original reusable vector art, expressed in a 100-unit box. */
export function fruit(
  g: Phaser.GameObjects.Graphics,
  id: number,
  x: number,
  y: number,
  r: number,
) {
  g.save();
  g.translateCanvas(x, y);
  g.scaleCanvas(r / 50, r / 50);
  const oval = (x: number, y: number, w: number, h: number, c: number) => {
    g.fillStyle(c).fillEllipse(x, y, w, h);
    g.lineStyle(3, ink).strokeEllipse(x, y, w, h);
  };
  const leaf = () => {
    g.lineStyle(4, ink).lineBetween(0, -32, 3, -53);
    g.fillStyle(0x80b66d).fillEllipse(15, -47, 28, 13);
    g.lineStyle(2, ink).strokeEllipse(15, -47, 28, 13);
  };
  if (id === 0) {
    const points = Array.from({ length: 64 }, (_, i) => {
      const t = (i / 64) * Math.PI * 2;
      return {
        x: 42 * Math.sin(t) ** 3,
        y:
          -(
            32 * Math.cos(t) -
            13 * Math.cos(2 * t) -
            6 * Math.cos(3 * t) -
            2 * Math.cos(4 * t)
          ) - 4,
      };
    });
    g.fillStyle(skin[0]).fillPoints(points, true);
    g.lineStyle(3, ink).strokePoints(points, true);
    leaf();
    g.lineStyle(4, 0xffd0b9, 0.8).lineBetween(-23, -16, -27, -3);
  } else if (id === 1) {
    oval(0, 3, 84, 84, skin[1]);
    leaf();
    for (let i = 0; i < 10; i++)
      g.fillStyle(0xd57e38, 0.7).fillCircle(
        Math.cos(i * 2.4) * 29,
        Math.sin(i * 2.4) * 27 + 3,
        1.8,
      );
    g.fillStyle(0xffd8a1).fillEllipse(-18, -17, 14, 9);
  } else if (id === 2) {
    oval(0, 0, 88, 79, skin[2]);
    for (const offset of [-23, 0, 23]) {
      g.lineStyle(5, 0x43895e, 0.8);
      g.beginPath();
      g.moveTo(offset - 7, -30);
      g.lineTo(offset + 4, -13);
      g.lineTo(offset - 4, 7);
      g.lineTo(offset + 5, 29);
      g.strokePath();
    }
    g.lineStyle(4, ink).lineBetween(42, 0, 49, -4);
  } else if (id === 3) {
    g.lineStyle(24, ink).beginPath().arc(-18, -27, 57, 0.1, 1.8).strokePath();
    g.lineStyle(17, skin[3])
      .beginPath()
      .arc(-18, -27, 57, 0.1, 1.8)
      .strokePath();
    g.lineStyle(3, 0xbf9343)
      .beginPath()
      .arc(-18, -27, 57, 0.1, 1.8)
      .strokePath();
    g.lineStyle(6, ink).lineBetween(39, -22, 43, -29);
  } else if (id === 4) {
    oval(0, 3, 77, 77, skin[4]);
    g.fillStyle(skin[4]).fillTriangle(-15, -31, 15, -31, 0, -52);
    g.lineStyle(3, ink).strokeTriangle(-15, -31, 15, -31, 0, -52);
    oval(13, 12, 37, 40, 0xffd6bd);
    for (let i = 0; i < 6; i++)
      g.fillStyle(0xb34e70).fillCircle(
        13 + Math.cos(i * 2.4) * 12,
        12 + Math.sin(i * 2.4) * 12,
        3,
      );
  } else if (id === 5) {
    oval(0, 9, 64, 77, skin[5]);
    g.lineStyle(2, 0x997a3f, 0.65);
    for (let j = -2; j <= 2; j++) {
      g.lineBetween(-25, j * 13 + 2, 25, j * 13 + 28);
      g.lineBetween(25, j * 13 + 2, -25, j * 13 + 28);
    }
    g.fillStyle(0x81ad68);
    g.fillTriangle(-29, -24, -25, -59, 1, -19);
    g.fillTriangle(-10, -24, 7, -66, 12, -20);
    g.fillTriangle(5, -22, 34, -52, 28, -17);
  } else if (id === 6) {
    const pts = [
      { x: -34, y: -20 },
      { x: -30, y: 12 },
      { x: 0, y: 44 },
      { x: 30, y: 12 },
      { x: 34, y: -20 },
      { x: 0, y: -30 },
    ];
    g.fillStyle(skin[6]).fillPoints(pts, true);
    g.lineStyle(3, ink).strokePoints(pts, true);
    g.fillStyle(0x80b66d).fillTriangle(-30, -25, 30, -25, 0, -7);
    for (let i = 0; i < 7; i++)
      g.fillStyle(0xffe49a).fillEllipse(
        Math.sin(i * 2.4) * 20,
        Math.cos(i * 2.4) * 20 + 2,
        3,
        5,
      );
  } else {
    const color = id === 7 ? 0xe77c78 : id === 8 ? 0xf3c56b : 0x83ba8c;
    oval(0, 0, 88, 88, color);
    if (id === 7) {
      g.lineStyle(9, 0xffe09c)
        .lineBetween(-40, 0, 40, 0)
        .lineBetween(0, -40, 0, 40);
      g.fillStyle(0xf6b765)
        .fillEllipse(-15, -7, 30, 20)
        .fillEllipse(15, -7, 30, 20);
    }
    if (id === 8) {
      g.lineStyle(13, 0xb37a52)
        .lineBetween(-20, -35, 18, 35)
        .lineBetween(20, -35, -18, 35);
      oval(0, 0, 38, 38, 0xffe7a2);
      const p = Array.from({ length: 10 }, (_, i) => ({
        x: Math.sin((i * Math.PI) / 5) * (i % 2 ? 8 : 16),
        y: -Math.cos((i * Math.PI) / 5) * (i % 2 ? 8 : 16),
      }));
      g.fillStyle(0xe4ac41).fillPoints(p, true);
    }
    if (id === 9) {
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5;
        oval(Math.cos(a) * 20, Math.sin(a) * 20, 32, 32, 0xf39b9c);
      }
      oval(0, 0, 22, 22, 0xffda78);
    }
  }
  g.restore();
}
export function half(
  g: Phaser.GameObjects.Graphics,
  id: number,
  x: number,
  y: number,
  r: number,
  left: boolean,
  angle: number,
) {
  g.save();
  g.translateCanvas(x, y);
  g.rotateCanvas(angle);
  const a = left ? Math.PI / 2 : -Math.PI / 2;
  g.fillStyle(skin[id] ?? skin[0]);
  g.beginPath();
  g.arc(0, 0, r, a, a + Math.PI);
  g.closePath();
  g.fillPath();
  g.lineStyle(3, ink).strokePath();
  g.fillStyle(id === 2 ? 0xf48e8d : id === 1 ? 0xffcf82 : 0xffe4b2);
  g.beginPath();
  g.arc(0, 0, r * 0.82, a, a + Math.PI);
  g.closePath();
  g.fillPath();
  for (let i = 0; i < 3; i++)
    g.fillStyle(id === 2 ? ink : 0xb87350).fillEllipse(
      (left ? -1 : 1) * r * 0.32,
      (i - 1) * r * 0.35,
      3,
      6,
    );
  g.restore();
}
export function sword(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  rotation: number,
  color: number,
  stunned: boolean,
) {
  g.save();
  g.translateCanvas(x, y);
  g.rotateCanvas(rotation);
  g.fillStyle(ink, 0.1).fillEllipse(-25, -62, 58, 150);
  const bezier = (
    a: { x: number; y: number },
    b: { x: number; y: number },
    c: { x: number; y: number },
  ) =>
    Array.from({ length: 18 }, (_, i) => {
      const t = i / 17,
        u = 1 - t;
      return {
        x: u * u * a.x + 2 * u * t * b.x + t * t * c.x,
        y: u * u * a.y + 2 * u * t * b.y + t * t * c.y,
      };
    });
  const blade = [
    ...bezier({ x: -8, y: -18 }, { x: -45, y: -119 }, { x: -139, y: -154 }),
    ...bezier({ x: -139, y: -154 }, { x: -103, y: -92 }, { x: -18, y: -9 }),
  ];
  g.fillStyle(stunned ? 0xb3b4bc : 0xedf5f4).fillPoints(blade, true);
  g.lineStyle(5, ink).strokePoints(blade, true);
  g.lineStyle(5, 0xc4d3d6)
    .lineBetween(-22, -28, -61, -97)
    .lineBetween(-61, -97, -120, -143);
  g.lineStyle(16, ink).lineBetween(-7, -7, 12, 20);
  g.lineStyle(9, color).lineBetween(-7, -7, 12, 20);
  g.lineStyle(7, ink)
    .beginPath()
    .arc(0, 0, 24, -0.4, Math.PI + 1)
    .strokePath();
  g.lineStyle(3, color)
    .beginPath()
    .arc(0, 0, 24, -0.4, Math.PI + 1)
    .strokePath();
  g.restore();
}
