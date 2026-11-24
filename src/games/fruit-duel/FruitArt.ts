import type Phaser from "phaser";
const ink = 0x242b32;
type Pt = { x: number; y: number };

/** Smooth periodic quadratic-midpoint curve (C1, overshoot-free) for organic fruit shapes. */
function smoothClosed(ctrl: readonly Pt[], steps = 6): Pt[] {
  const n = ctrl.length,
    out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const prev = ctrl[(i + n - 1) % n],
      curr = ctrl[i],
      next = ctrl[(i + 1) % n];
    const p0 = { x: (prev.x + curr.x) / 2, y: (prev.y + curr.y) / 2 },
      p2 = { x: (curr.x + next.x) / 2, y: (curr.y + next.y) / 2 };
    for (let s = 0; s < steps; s++) {
      const t = s / steps,
        u = 1 - t;
      out.push({
        x: u * u * p0.x + 2 * u * t * curr.x + t * t * p2.x,
        y: u * u * p0.y + 2 * u * t * curr.y + t * t * p2.y,
      });
    }
  }
  return out;
}

function quadStrip(a: Pt, b: Pt, c: Pt, steps = 14): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps,
      u = 1 - t;
    out.push({
      x: u * u * a.x + 2 * u * t * b.x + t * t * c.x,
      y: u * u * a.y + 2 * u * t * b.y + t * t * c.y,
    });
  }
  return out;
}

function drawShape(
  g: Phaser.GameObjects.Graphics,
  pts: Pt[],
  fill: number,
  stroke = 3.5,
) {
  g.fillStyle(fill).fillPoints(pts, true);
  if (stroke > 0) g.lineStyle(stroke, ink).strokePoints(pts, true);
}

function drawLeaf(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  angle: number,
  len: number,
  wid: number,
  fill = 0x7cb665,
) {
  g.save();
  g.translateCanvas(x, y);
  g.rotateCanvas(angle);
  const top = quadStrip(
    { x: 0, y: 0 },
    { x: len * 0.5, y: -wid },
    { x: len, y: 0 },
    10,
  );
  const bot = quadStrip(
    { x: len, y: 0 },
    { x: len * 0.5, y: wid },
    { x: 0, y: 0 },
    10,
  );
  drawShape(g, [...top, ...bot], fill, 3);
  g.lineStyle(2, 0x4d7d44, 0.85).lineBetween(3, 0, len * 0.78, 0);
  g.restore();
}

function drawStem(
  g: Phaser.GameObjects.Graphics,
  x0: number,
  y0: number,
  cx: number,
  cy: number,
  x1: number,
  y1: number,
) {
  const pts = quadStrip({ x: x0, y: y0 }, { x: cx, y: cy }, { x: x1, y: y1 }, 8);
  g.lineStyle(7, ink).strokePoints(pts, false);
  g.lineStyle(3.2, 0x8d5b3a).strokePoints(pts, false);
}

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

  if (id === 0) {
    // 0: Plump glossy red apple with top dimple, curved stem and leaf.
    const body = smoothClosed(
      [
        { x: 0, y: -23 },
        { x: 18, y: -33 },
        { x: 40, y: -22 },
        { x: 42, y: 8 },
        { x: 26, y: 39 },
        { x: 8, y: 41 },
        { x: 0, y: 36 },
        { x: -8, y: 41 },
        { x: -26, y: 39 },
        { x: -42, y: 8 },
        { x: -40, y: -22 },
        { x: -18, y: -33 },
      ],
      6,
    );
    drawStem(g, 0, -25, 2, -37, 8, -46);
    drawLeaf(g, 3, -36, -0.45, 26, 11, 0x7cb665);
    g.fillStyle(0xea5d55).fillPoints(body, true);
    // Subtle lower-right shading inside body.
    g.fillStyle(0xd24640, 0.55).fillEllipse(14, 15, 42, 40);
    g.lineStyle(3.5, ink).strokePoints(body, true);
    // Dimple crease at stem base.
    g.lineStyle(2.4, 0xa83632, 0.75).strokePoints(
      quadStrip({ x: -10, y: -23 }, { x: 0, y: -18 }, { x: 10, y: -23 }, 8),
      false,
    );
    // Glossy specular crescent on upper-left cheek.
    const shine = quadStrip(
      { x: -26, y: -15 },
      { x: -30, y: -4 },
      { x: -24, y: 8 },
      8,
    );
    g.lineStyle(5, 0xffcfc7, 0.85).strokePoints(shine, false);
    g.fillStyle(0xfff5f2, 0.9).fillCircle(-19, -20, 3.2);
  } else if (id === 1) {
    // 1: Juicy sunny orange with calyx star, stem, twin leaves and peel pores.
    drawStem(g, 0, -32, 1, -40, 4, -47);
    drawLeaf(g, 2, -39, -0.32, 26, 10, 0x78b462);
    drawLeaf(g, -2, -39, -2.55, 17, 7, 0x8cc371);
    g.fillStyle(0xf5973b).fillEllipse(0, 4, 84, 78);
    g.fillStyle(0xde7a24, 0.45).fillEllipse(13, 14, 50, 44);
    g.lineStyle(3.5, ink).strokeEllipse(0, 4, 84, 78);
    // Subtle peel pores on lower-right cheek.
    for (const [px, py] of [
      [17, 16],
      [25, 9],
      [21, 24],
      [11, 27],
      [29, 17],
      [12, 11],
      [24, -1],
    ])
      g.fillStyle(0xc86519, 0.65).fillCircle(px, py, 1.9);
    // Crisp glossy highlight.
    const shine = quadStrip(
      { x: -27, y: -12 },
      { x: -31, y: 0 },
      { x: -24, y: 12 },
      8,
    );
    g.lineStyle(5, 0xffe2ad, 0.88).strokePoints(shine, false);
    g.fillStyle(0xfff7e2, 0.92).fillCircle(-18, -19, 3.3);
    // Small green calyx rosette around stem.
    g.fillStyle(0x639e50).fillEllipse(0, -31, 16, 7);
    g.lineStyle(2, ink).strokeEllipse(0, -31, 16, 7);
  } else if (id === 2) {
    // 2: Iconic round striped watermelon with contoured meridian stripes & curly vine.
    const vine = quadStrip(
      { x: 0, y: -36 },
      { x: 5, y: -48 },
      { x: 15, y: -44 },
      8,
    );
    g.lineStyle(6.5, ink).strokePoints(vine, false);
    g.lineStyle(3, 0x6ea65a).strokePoints(vine, false);
    const rx = 44,
      ry = 38,
      cy = 3;
    g.fillStyle(0x78bc6b).fillEllipse(0, cy, rx * 2, ry * 2);
    // Curved dark-emerald stripes strictly clipped inside the melon ellipse.
    for (const u of [-0.62, -0.22, 0.22, 0.62]) {
      const pts: Pt[] = [];
      for (let i = 0; i <= 14; i++) {
        const t = -0.88 + (i / 14) * 1.76;
        const baseW = Math.sqrt(Math.max(0.02, 1 - t * t));
        const px = u * (rx - 4) * baseW + Math.sin(t * 7.5 + u * 4) * 2.2;
        const py = cy + t * (ry - 2);
        pts.push({ x: px, y: py });
      }
      g.lineStyle(6.5, 0x3b7a4f, 0.9).strokePoints(pts, false);
    }
    // Glossy specular crescent & outer bold outline.
    const shine = quadStrip(
      { x: -28, y: -11 },
      { x: -32, y: 1 },
      { x: -25, y: 13 },
      8,
    );
    g.lineStyle(5, 0xc9ebb8, 0.85).strokePoints(shine, false);
    g.lineStyle(3.5, ink).strokeEllipse(0, cy, rx * 2, ry * 2);
  } else if (id === 3) {
    // 3: True curved golden banana with tapered tips, highlight ridge and brown stem/nub.
    const outer = quadStrip(
      { x: -39, y: 20 },
      { x: 14, y: 49 },
      { x: 35, y: -27 },
      18,
    );
    const inner = quadStrip(
      { x: 25, y: -33 },
      { x: 4, y: 15 },
      { x: -37, y: 13 },
      18,
    );
    const body = [...outer, ...inner];
    g.fillStyle(0xf7cf4c).fillPoints(body, true);
    // Warm golden lower shading ridge along the outer curve.
    const shade = quadStrip(
      { x: -29, y: 21 },
      { x: 10, y: 38 },
      { x: 28, y: -15 },
      12,
    );
    g.lineStyle(5, 0xdda82b, 0.72).strokePoints(shade, false);
    // Bright cream highlight along the upper belly.
    const shine = quadStrip(
      { x: -22, y: 14 },
      { x: 6, y: 24 },
      { x: 22, y: -14 },
      10,
    );
    g.lineStyle(4, 0xfff6be, 0.9).strokePoints(shine, false);
    g.lineStyle(3.5, ink).strokePoints(body, true);
    // Distinctive brown pedicel stem (top-right) and dark tip nub (bottom-left).
    const pedicel = [
      { x: 25, y: -33 },
      { x: 31, y: -43 },
      { x: 39, y: -39 },
      { x: 35, y: -27 },
    ];
    drawShape(g, pedicel, 0x795136, 3);
    g.fillStyle(0x5b3b27).fillCircle(-38, 17, 4.2);
    g.lineStyle(2.5, ink).strokeCircle(-38, 17, 4.2);
  } else if (id === 4) {
    // 4: Royal ruby pomegranate with flared 3-point crown calyx and glossy sheen.
    const crown = [
      { x: -12, y: -27 },
      { x: -16, y: -44 },
      { x: -6, y: -37 },
      { x: 0, y: -48 },
      { x: 6, y: -37 },
      { x: 16, y: -44 },
      { x: 12, y: -27 },
    ];
    drawShape(g, crown, 0xc74462, 3.2);
    const body = smoothClosed(
      [
        { x: 0, y: -30 },
        { x: 24, y: -26 },
        { x: 42, y: -4 },
        { x: 39, y: 24 },
        { x: 20, y: 40 },
        { x: 0, y: 42 },
        { x: -20, y: 40 },
        { x: -39, y: 24 },
        { x: -42, y: -4 },
        { x: -24, y: -26 },
      ],
      6,
    );
    g.fillStyle(0xd14c6b).fillPoints(body, true);
    g.fillStyle(0xa6314f, 0.5).fillEllipse(14, 16, 44, 40);
    g.lineStyle(3.5, ink).strokePoints(body, true);
    // Warm rosy highlight crescent and specular dot.
    const shine = quadStrip(
      { x: -26, y: -11 },
      { x: -30, y: 4 },
      { x: -22, y: 18 },
      8,
    );
    g.lineStyle(5, 0xf8a9b8, 0.85).strokePoints(shine, false);
    g.fillStyle(0xffe6eb, 0.92).fillCircle(-18, -19, 3.2);
    // Subtle dark calyx crease where crown meets fruit.
    g.lineStyle(2.5, ink).lineBetween(-11, -28, 11, -28);
  } else if (id === 5) {
    // 5: Golden tropical pineapple with lush spiky crown and ellipse-clipped diamond scales.
    const backFronds = [
      [
        { x: -9, y: -18 },
        { x: -28, y: -42 },
        { x: -4, y: -26 },
      ],
      [
        { x: 9, y: -18 },
        { x: 28, y: -42 },
        { x: 4, y: -26 },
      ],
    ];
    for (const f of backFronds) drawShape(g, f, 0x5d9d54, 3);
    const frontFronds = [
      [
        { x: -13, y: -16 },
        { x: -19, y: -46 },
        { x: -2, y: -22 },
      ],
      [
        { x: 13, y: -16 },
        { x: 19, y: -46 },
        { x: 2, y: -22 },
      ],
      [
        { x: -9, y: -19 },
        { x: 0, y: -51 },
        { x: 9, y: -19 },
      ],
    ];
    for (const f of frontFronds) drawShape(g, f, 0x7ec065, 3);

    const a = 30,
      b = 34,
      cy = 12;
    g.fillStyle(0xefc04a).fillEllipse(0, cy, a * 2, b * 2);
    g.fillStyle(0xd5972d, 0.4).fillEllipse(9, cy + 8, 34, 42);
    // Exact analytically clipped diagonal crosshatch strictly inside the ellipse!
    const ia = a - 2.5,
      ib = b - 2.5;
    g.lineStyle(2.2, 0xb67d22, 0.8);
    for (const slope of [-1, 1]) {
      for (const offset of [-30, -15, 0, 15, 30]) {
        const A = 1 / (ia * ia) + 1 / (ib * ib),
          B = (2 * slope * offset) / (ib * ib),
          C = (offset * offset) / (ib * ib) - 1,
          disc = B * B - 4 * A * C;
        if (disc <= 0) continue;
        const root = Math.sqrt(disc),
          x1 = (-B - root) / (2 * A),
          x2 = (-B + root) / (2 * A);
        g.lineBetween(x1, cy + slope * x1 + offset, x2, cy + slope * x2 + offset);
      }
    }
    // Tiny bright golden eye glints inside the diamond scales.
    for (const [dx, dy] of [
      [-12, 4],
      [0, 12],
      [12, 4],
      [-12, 20],
      [12, 20],
      [0, -4],
      [0, 28],
    ])
      g.fillStyle(0xfff0b2, 0.78).fillCircle(dx, dy, 2.2);
    g.lineStyle(3.5, ink).strokeEllipse(0, cy, a * 2, b * 2);
  } else if (id === 6) {
    // 6: Plump sweet strawberry with smooth tapered berry contour, 5-leaf cap and golden seeds.
    const body = smoothClosed(
      [
        { x: 0, y: -26 },
        { x: 24, y: -27 },
        { x: 38, y: -10 },
        { x: 31, y: 16 },
        { x: 13, y: 38 },
        { x: 0, y: 44 },
        { x: -13, y: 38 },
        { x: -31, y: 16 },
        { x: -38, y: -10 },
        { x: -24, y: -27 },
      ],
      6,
    );
    g.fillStyle(0xef5a67).fillPoints(body, true);
    g.fillStyle(0xd23e4e, 0.45).fillEllipse(12, 10, 34, 42);
    // Glossy left highlight.
    const shine = quadStrip(
      { x: -23, y: -10 },
      { x: -24, y: 4 },
      { x: -15, y: 18 },
      8,
    );
    g.lineStyle(4.5, 0xffbec4, 0.82).strokePoints(shine, false);
    // Neat staggered golden teardrop seeds strictly inside the berry.
    for (const [sx, sy] of [
      [-16, -4],
      [0, -6],
      [16, -4],
      [-21, 9],
      [-8, 9],
      [8, 9],
      [21, 9],
      [-11, 23],
      [0, 27],
      [11, 23],
    ])
      g.fillStyle(0xffe694).fillEllipse(sx, sy, 3.2, 5.2);
    g.lineStyle(3.5, ink).strokePoints(body, true);
    // Cute short curved stem + 5-sepal green calyx cap hugging the berry shoulder.
    drawStem(g, 0, -27, 1, -36, 5, -43);
    const cap = [
      { x: -28, y: -24 },
      { x: -15, y: -13 },
      { x: -8, y: -21 },
      { x: 0, y: -10 },
      { x: 8, y: -21 },
      { x: 15, y: -13 },
      { x: 28, y: -24 },
      { x: 12, y: -30 },
      { x: 0, y: -27 },
      { x: -12, y: -30 },
    ];
    drawShape(g, cap, 0x6eb45c, 3);
  } else if (id === 7) {
    // 7 (Decoy): Wrapped square blue gift box with golden ribbon & bow (distinct from round fruits!).
    // Ribbon bow loops on top.
    drawShape(
      g,
      smoothClosed(
        [
          { x: -2, y: -26 },
          { x: -16, y: -44 },
          { x: -28, y: -36 },
          { x: -18, y: -24 },
        ],
        5,
      ),
      0xf6cc65,
      3,
    );
    drawShape(
      g,
      smoothClosed(
        [
          { x: 2, y: -26 },
          { x: 18, y: -24 },
          { x: 28, y: -36 },
          { x: 16, y: -44 },
        ],
        5,
      ),
      0xf6cc65,
      3,
    );
    // Box body.
    g.fillStyle(0x58addb).fillRoundedRect(-35, -14, 70, 54, 10);
    g.fillStyle(0xf6cc65).fillRect(-8, -14, 16, 54);
    g.fillStyle(0xf6cc65).fillRect(-35, 6, 70, 14);
    g.lineStyle(3.5, ink).strokeRoundedRect(-35, -14, 70, 54, 10);
    g.lineStyle(2.5, ink)
      .lineBetween(-8, -14, -8, 40)
      .lineBetween(8, -14, 8, 40);
    // Box lid.
    g.fillStyle(0x74c2ea).fillRoundedRect(-40, -28, 80, 18, 6);
    g.fillStyle(0xf6cc65).fillRect(-8, -28, 16, 18);
    g.lineStyle(3.5, ink).strokeRoundedRect(-40, -28, 80, 18, 6);
    g.fillStyle(0xffe69c).fillCircle(0, -28, 6);
    g.lineStyle(3, ink).strokeCircle(0, -28, 6);
  } else if (id === 8) {
    // 8 (Decoy): Ribboned golden star medal.
    drawShape(
      g,
      [
        { x: -26, y: -44 },
        { x: -6, y: -44 },
        { x: 4, y: -8 },
        { x: -12, y: -8 },
      ],
      0x58addb,
      3,
    );
    drawShape(
      g,
      [
        { x: 6, y: -44 },
        { x: 26, y: -44 },
        { x: 12, y: -8 },
        { x: -4, y: -8 },
      ],
      0xe86f68,
      3,
    );
    g.fillStyle(0xf3c352).fillCircle(0, 12, 31);
    g.lineStyle(3.5, ink).strokeCircle(0, 12, 31);
    g.fillStyle(0xffe79a).fillCircle(0, 12, 22);
    g.lineStyle(2.2, 0xc89228).strokeCircle(0, 12, 22);
    const star = Array.from({ length: 10 }, (_, i) => ({
      x: Math.sin((i * Math.PI) / 5) * (i % 2 ? 7 : 15),
      y: 12 - Math.cos((i * Math.PI) / 5) * (i % 2 ? 7 : 15),
    }));
    drawShape(g, star, 0xe5a52c, 2.2);
  } else {
    // 9 (Decoy): Blooming 5-petal blossom flower (no background fruit-like circle).
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 5,
        px = Math.cos(a) * 23,
        py = Math.sin(a) * 23;
      g.fillStyle(0xfff1f5).fillCircle(px, py, 19);
      g.lineStyle(3.2, ink).strokeCircle(px, py, 19);
      g.fillStyle(0xf7b2c4, 0.75).fillCircle(px * 0.85, py * 0.85, 11);
    }
    g.fillStyle(0xffd76a).fillCircle(0, 0, 15);
    g.lineStyle(3.2, ink).strokeCircle(0, 0, 15);
    for (const [dx, dy] of [
      [-4, -3],
      [4, -3],
      [0, 4],
    ])
      g.fillStyle(0xd59624).fillCircle(dx, dy, 2);
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
  const a = left ? Math.PI / 2 : -Math.PI / 2,
    dir = left ? -1 : 1;

  // Fruit-specific outer rind, pith ring and juicy cut interior!
  const rind =
    [0xea5d55, 0xf5973b, 0x78bc6b, 0xf7cf4c, 0xd14c6b, 0xdca133, 0xef5a67][
      id
    ] ?? 0xea5d55;
  const pith =
    [0xfff6dc, 0xfff8e6, 0xfff6dc, 0xfff8dc, 0xffe8c6, 0xffe066, 0xff9ca4][
      id
    ] ?? 0xfff6dc;
  const flesh =
    [0xfff6dc, 0xf9ab4c, 0xef6b68, 0xfff7d6, 0xc73c5d, 0xffe066, 0xff9ca4][
      id
    ] ?? 0xfff6dc;

  // Outer skin semicircle.
  g.fillStyle(rind);
  g.beginPath();
  g.arc(0, 0, r, a, a + Math.PI);
  g.closePath();
  g.fillPath();

  // Pith ring (visible on orange, watermelon, pomegranate).
  g.fillStyle(pith);
  g.beginPath();
  g.arc(0, 0, r * 0.87, a, a + Math.PI);
  g.closePath();
  g.fillPath();

  // Inner juicy flesh.
  g.fillStyle(flesh);
  g.beginPath();
  g.arc(0, 0, r * (id === 1 || id === 2 || id === 4 ? 0.77 : 0.85), a, a + Math.PI);
  g.closePath();
  g.fillPath();

  // Fruit-specific interior details!
  if (id === 1) {
    // Orange citrus wedge segments.
    g.lineStyle(2.5, 0xfff8e6);
    for (const seg of [-0.95, -0.32, 0.32, 0.95]) {
      const ang = (left ? Math.PI : 0) + seg;
      g.lineBetween(0, 0, Math.cos(ang) * r * 0.77, Math.sin(ang) * r * 0.77);
    }
  } else if (id === 2) {
    // Watermelon black teardrop seeds.
    for (const [ang, dist] of [
      [-0.75, 0.5],
      [0, 0.54],
      [0.75, 0.5],
    ]) {
      const rad = (left ? Math.PI : 0) + ang;
      g.fillStyle(ink).fillEllipse(
        Math.cos(rad) * r * dist,
        Math.sin(rad) * r * dist,
        3.2,
        5.5,
      );
    }
  } else if (id === 4) {
    // Pomegranate ruby arils & pith dividers.
    g.lineStyle(3, 0xffe8c6).lineBetween(0, 0, dir * r * 0.78, 0);
    for (const [sy, sx] of [
      [-16, 14],
      [-10, 24],
      [14, 15],
      [10, 25],
      [-22, 8],
      [22, 8],
    ])
      g.fillStyle(0x9b2444).fillCircle(dir * sx, sy, 3.6);
  } else if (id === 5) {
    // Pineapple pale core ring.
    g.fillStyle(0xfff6be);
    g.beginPath();
    g.arc(0, 0, r * 0.34, a, a + Math.PI);
    g.closePath();
    g.fillPath();
  } else if (id === 6) {
    // Strawberry pale cream heart core.
    g.fillStyle(0xfff0ec);
    g.beginPath();
    g.arc(0, 0, r * 0.42, a, a + Math.PI);
    g.closePath();
    g.fillPath();
  } else {
    // Apple / banana small center pips.
    for (const sy of [-0.24, 0.24])
      g.fillStyle(id === 0 ? 0x5c3c28 : 0xd5b870).fillEllipse(
        dir * r * 0.22,
        sy * r,
        3.2,
        5.8,
      );
  }

  // Crisp unbroken outer cut outline.
  g.lineStyle(3.2, ink);
  g.beginPath();
  g.arc(0, 0, r, a, a + Math.PI);
  g.closePath();
  g.strokePath();
  g.restore();
}

const SWORD_TIP_LEN = Math.hypot(139, 154); // 207.4536 px
const SWORD_AXIS = Math.atan2(-154, -139); // Aligns local +X straight to (-139, -154)

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
  g.rotateCanvas(rotation + SWORD_AXIS);

  // Sleek curved katana-saber blade:
  // Leading cutting edge is along -Y (sweeps CCW across the fruit!), spine is along +Y.
  const L = SWORD_TIP_LEN;
  const spine = [
    ...quadStrip({ x: 14, y: 7 }, { x: 108, y: 11 }, { x: 184, y: 6.5 }, 14),
    { x: L, y: 0 },
  ];
  const cuttingEdge = [
    ...quadStrip({ x: L, y: 0 }, { x: 164, y: -15 }, { x: 96, y: -14.5 }, 12),
    ...quadStrip({ x: 96, y: -14.5 }, { x: 52, y: -13 }, { x: 14, y: -8.5 }, 10),
  ];
  const ridge = quadStrip(
    { x: 16, y: -1.5 },
    { x: 110, y: -2.5 },
    { x: L - 3, y: 0 },
    14,
  );
  const fullBlade = [...spine, ...cuttingEdge];
  const sharpHalf = [...ridge, ...cuttingEdge];

  // Blade-aligned subtle drop shadow
  g.fillStyle(ink, 0.12).fillPoints(
    fullBlade.map((p) => ({ x: p.x + 5, y: p.y + 7 })),
    true,
  );

  // Forged two-tone steel blade (darker back spine + razor-bright cutting edge)
  g.fillStyle(stunned ? 0x9ca1aa : 0xc6d8e0).fillPoints(fullBlade, true);
  g.fillStyle(stunned ? 0xc5c9d2 : 0xf4fbfd).fillPoints(sharpHalf, true);

  // Bright metallic gleam along the sharp front belly
  if (!stunned) {
    const gleam = quadStrip(
      { x: 116, y: -7.5 },
      { x: 148, y: -8 },
      { x: 178, y: -4.2 },
      8,
    );
    g.lineStyle(3.2, 0xffffff, 0.92).strokePoints(gleam, false);
  }

  // Smooth bevel ridge line & bold ink outline
  g.lineStyle(2.2, stunned ? 0x7e838c : 0x8ea3ad, 0.85).strokePoints(
    ridge,
    false,
  );
  g.lineStyle(4, ink).strokePoints(fullBlade, true);

  // Brass blade collar (habaki) seating the blade cleanly into the guard
  const collar = [
    { x: 9, y: -9.5 },
    { x: 24, y: -9 },
    { x: 24, y: 7.5 },
    { x: 9, y: 8.5 },
  ];
  drawShape(g, collar, stunned ? 0xa59b84 : 0xe9bc54, 3);

  // Sculpted curved sword crossguard (tsuba / quillons)
  const guard = [
    { x: 3, y: -25 },
    { x: 12, y: -22 },
    { x: 12, y: 22 },
    { x: 3, y: 25 },
    { x: -1, y: 18 },
    { x: 2, y: 9 },
    { x: 2, y: -9 },
    { x: -1, y: -18 },
  ];
  drawShape(g, guard, stunned ? 0xa89f8b : 0xf2c45a, 3.5);
  // Quillon end knobs
  g.fillStyle(stunned ? 0xa89f8b : 0xf2c45a)
    .fillCircle(7.5, -24, 4.5)
    .fillCircle(7.5, 24, 4.5);
  g.lineStyle(3, ink)
    .strokeCircle(7.5, -24, 4.5)
    .strokeCircle(7.5, 24, 4.5);

  // Wrapped sword handle / grip in the player's color
  const gripColor = stunned ? 0x9fa3ac : color;
  const grip = [
    { x: -27, y: -6.5 },
    { x: 2, y: -7.5 },
    { x: 2, y: 7.5 },
    { x: -27, y: 6.5 },
  ];
  drawShape(g, grip, gripColor, 3.5);
  // Diagonal wrap cord bands on the grip
  g.lineStyle(2.4, ink, 0.85);
  for (const gx of [-21, -14, -7]) {
    g.lineBetween(gx - 2, -6.5, gx + 3, 6.5);
  }

  // Sculpted pommel cap with player-colored inlay gem
  g.fillStyle(stunned ? 0xa89f8b : 0xf2c45a).fillCircle(-30, 0, 8.5);
  g.lineStyle(3.5, ink).strokeCircle(-30, 0, 8.5);
  g.fillStyle(gripColor).fillCircle(-30, 0, 4);
  g.fillStyle(0xfffdf5, 0.8).fillCircle(-31.5, -1.5, 1.8);

  // Player emblem stud centered on the crossguard
  g.fillStyle(gripColor).fillCircle(6.5, 0, 4.2);
  g.lineStyle(2, ink).strokeCircle(6.5, 0, 4.2);

  g.restore();
}
