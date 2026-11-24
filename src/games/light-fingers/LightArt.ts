import type Phaser from "phaser";
import { theme } from "../../core/ThemeManager";
import { rounded, circle } from "../../shared/components/drawing";

function blend(a: number, b: number, t: number) {
  let result = 0;
  for (const shift of [16, 8, 0])
    result |=
      Math.round(((a >> shift) & 255) * (1 - t) + ((b >> shift) & 255) * t) <<
      shift;
  return result;
}

function drawSparkle(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  size: number,
  color: number,
  alpha: number,
) {
  g.fillStyle(color, alpha);
  g.fillTriangle(x, y - size, x + size * 0.26, y, x - size * 0.26, y);
  g.fillTriangle(x, y + size, x + size * 0.26, y, x - size * 0.26, y);
  g.fillTriangle(x - size, y, x, y + size * 0.26, x, y - size * 0.26);
  g.fillTriangle(x + size, y, x, y + size * 0.26, x, y - size * 0.26);
}

function drawLightCone(
  g: Phaser.GameObjects.Graphics,
  lx: number,
  ly: number,
  cx: number,
  cy: number,
  radius: number,
  color: number,
  alpha: number,
) {
  const dx = cx - lx,
    dy = cy - ly;
  const dist = Math.hypot(dx, dy);
  if (dist <= radius + 4) return;
  const theta = Math.atan2(dy, dx);
  const spread = Math.asin(Math.min(0.96, radius / dist));
  const start = theta - Math.PI / 2 - spread;
  const end = theta + Math.PI / 2 + spread;
  const pts: { x: number; y: number }[] = [{ x: lx, y: ly }];
  const steps = 18;
  for (let i = 0; i <= steps; i++) {
    const a = start + ((end - start) * i) / steps;
    pts.push({ x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius });
  }
  g.fillStyle(color, alpha).fillPoints(pts, true);
}

/** Atmospheric museum-vault gallery floor with smooth radial mood lighting and fine floor inlay. */
export function vaultBackground(
  g: Phaser.GameObjects.Graphics,
  active: boolean,
  winnerTint: number | null,
  time: number,
) {
  const base = winnerTint ?? (active ? 0x3b3248 : 0x2a2334);
  rounded(g, 24, 112, 372, 538, 20, base, 0);

  // Silky multi-step radial room illumination (smooth falloff into dark museum corners, zero banding!)
  if (!winnerTint) {
    const steps = 14;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const r = (active ? 310 : 285) * (1 - t * 0.72);
      const color = active
        ? blend(0x524664, 0xd8c39b, t * t)
        : blend(0x3a3248, 0x625778, t);
      const alpha = active ? 0.055 + t * 0.02 : 0.055;
      g.fillStyle(color, alpha).fillCircle(210, 381, r);
    }
  }

  // Subtle alternating museum gallery diamond floor tiles
  const tileColor = winnerTint ? 0xffffff : active ? 0xb4a2bf : 0x6c5f7d;
  const tileAlpha = winnerTint ? 0.16 : active ? 0.2 : 0.16;
  g.lineStyle(1.4, tileColor, tileAlpha);
  for (let i = -8; i <= 14; i++) {
    const ox = 24 + i * 52;
    g.lineBetween(ox, 112, ox + 372, 112 + 372);
    g.lineBetween(ox + 372, 112, ox, 112 + 372);
  }

  // Fine inset museum gallery brass floor inlay border (no hard shadow boxes!)
  if (!winnerTint) {
    g.lineStyle(1.6, active ? 0xd9be8c : 0x695c78, active ? 0.32 : 0.24).strokeRoundedRect(
      38,
      126,
      344,
      510,
      13,
    );
  } else {
    // Celebratory soft radial burst rays behind the stolen plinth
    g.fillStyle(0xfffdf5, 0.24);
    for (let i = 0; i < 8; i++) {
      const a = time * 0.45 + (i * Math.PI) / 4;
      g.fillTriangle(
        210,
        381,
        210 + Math.cos(a - 0.12) * 290,
        381 + Math.sin(a - 0.12) * 290,
        210 + Math.cos(a + 0.12) * 290,
        381 + Math.sin(a + 0.12) * 290,
      );
    }
  }
}

/** Layered floor light pool, smooth stage spotlight falloff & sculpted museum display plinth. */
export function pedestal(
  g: Phaser.GameObjects.Graphics,
  active: boolean,
  time: number,
  signalAge = 99,
) {
  // Silky gradient-smooth floor light pool directly around the plinth
  if (active) {
    const pulse = 1 + Math.sin(time * 4.5) * 0.025;
    for (let i = 0; i < 10; i++) {
      const t = i / 9;
      const r = (158 - t * 96) * pulse;
      const c = blend(0xffe69c, 0xfffef4, t);
      g.fillStyle(c, 0.036 + t * 0.012).fillCircle(210, 381, r);
    }
  } else {
    // Soft cool standby glow pool + subtle pulsing security sensor ring
    for (let i = 0; i < 6; i++) {
      const t = i / 5;
      g.fillStyle(blend(0xb3c8e6, 0xd8e6fa, t), 0.024).fillCircle(
        210,
        381,
        104 - t * 52,
      );
    }
    const warn = 0.24 + 0.16 * Math.sin(time * 3.4);
    g.lineStyle(2.2, 0xe87b64, warn).strokeCircle(210, 381, 66);
  }

  // Sculpted 3D museum display plinth (ground shadow + tiered marble & brass trim)
  g.fillStyle(0x140f1a, 0.42).fillRoundedRect(156, 353, 110, 76, 16);
  rounded(g, 158, 345, 104, 74, 15, active ? 0x77877f : 0x5c6862, 3.5);
  rounded(g, 164, 350, 92, 62, 11, active ? 0x97a89d : 0x74827a, 2.5);
  // Crisp sunlit marble bevel along the upper plinth edge facing the lamp
  g.lineStyle(2.5, active ? 0xdbe8df : 0x9aa89f, active ? 0.85 : 0.45).lineBetween(
    176,
    353,
    244,
    353,
  );

  // Brass display ring + circular velvet cushion
  circle(g, 210, 381, 37, active ? 0xf5c95d : 0x7c7059, 3);
  circle(g, 210, 381, 31, active ? 0xfff9e6 : 0x352d40, 2.5);
  if (!active) {
    // Subtle velvet indentation ring when gem is hidden
    g.lineStyle(2, 0x5c506b, 0.6).strokeCircle(210, 381, 14);
  }

  // Electric expanding light flash ring right when the spotlight snaps ON!
  if (active && signalAge >= 0 && signalAge < 0.38) {
    const u = signalAge / 0.38;
    const alpha = (1 - u) * 0.82;
    g.lineStyle(4.5 * (1 - u * 0.5), 0xfff8d6, alpha).strokeCircle(
      210,
      381,
      44 + u * 112,
    );
  }

  if (active) gem(g, 210, 380, 1, time, true);
}

/** Seamless teardrop volumetric spotlight cone, floating dust motes & corner stage lamp fixture. */
export function spotlightOverlay(
  g: Phaser.GameObjects.Graphics,
  active: boolean,
  time: number,
  signalAge = 99,
) {
  const lx = 374,
    ly = 136;
  const cx = 210,
    cy = 381;
  if (active) {
    const flashBoost =
      signalAge >= 0 && signalAge < 0.25 ? (1 - signalAge / 0.25) * 0.035 : 0;
    // Layered mathematically tangent teardrop cones — silky volumetric beam haze, zero hard seams!
    for (let i = 0; i < 6; i++) {
      const t = i / 5;
      drawLightCone(
        g,
        lx,
        ly,
        cx,
        cy,
        142 - t * 82,
        blend(0xffe89c, 0xfffdf0, t),
        0.026 + t * 0.01 + flashBoost,
      );
    }

    // Shimmering floating golden dust motes drifting lazily through the light beam
    for (let i = 0; i < 9; i++) {
      const u = (i * 0.14 + time * 0.07) % 1;
      const spread = 8 + u * 26;
      const bx =
        lx + (cx - lx) * (0.18 + u * 0.72) + Math.sin(time * 2.0 + i * 2.3) * spread;
      const by =
        ly + (cy - ly) * (0.18 + u * 0.72) + Math.cos(time * 1.6 + i * 2.9) * (spread * 0.7);
      const a = Math.sin(u * Math.PI) * 0.68;
      g.fillStyle(0xfffbe2, a).fillCircle(bx, by, 1.5 + (i % 2) * 0.9);
    }
  } else {
    // Subtle cool standby security beam while waiting in suspense
    drawLightCone(g, lx, ly, cx, cy, 86, 0xc7daf2, 0.04);
    drawLightCone(g, lx, ly, cx, cy, 56, 0xdbe9fa, 0.035);
  }

  // Sleek corner stage spotlight fixture + mounting arm + warm glowing lens
  g.lineStyle(4, 0x242b32).lineBetween(394, 114, lx + 4, ly - 4);
  g.save();
  g.translateCanvas(lx, ly);
  g.rotateCanvas(Math.atan2(cy - ly, cx - lx));
  // Soft atmospheric halo right at the lamp lens when active
  if (active) {
    g.fillStyle(0xfff5be, 0.24).fillCircle(12, 0, 24);
    g.fillStyle(0xfffbe6, 0.36).fillCircle(12, 0, 13);
  }
  rounded(g, -11, -10, 23, 20, 6, 0x3b434d, 2.8);
  g.lineStyle(2, 0x626f7d, 0.7).lineBetween(-6, -5, 6, -5);
  g.fillStyle(active ? 0xfff6bd : 0x768391).fillEllipse(12, 0, 7, 15);
  g.lineStyle(2.2, theme.ink).strokeEllipse(12, 0, 7, 15);
  if (active) drawSparkle(g, 14, 0, 9, 0xfffef5, 0.85);
  g.restore();
}

/** Dazzling multi-faceted diamond gem with crown table, aura glow & twinkling starlight. */
export function gem(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale = 1,
  time = 0,
  showGlow = false,
) {
  g.save();
  g.translateCanvas(x, y);
  g.scaleCanvas(scale, scale);
  const bob = Math.sin(time * 5.2) * 2.2;
  if (showGlow) {
    g.fillStyle(0x88e6f7, 0.24 + 0.08 * Math.sin(time * 6)).fillCircle(
      0,
      bob,
      36,
    );
  }
  const outer = [
    { x: 0, y: -28 + bob },
    { x: 26, y: -1 + bob },
    { x: 0, y: 28 + bob },
    { x: -26, y: -1 + bob },
  ];
  const crown = [
    { x: 0, y: -15 + bob },
    { x: 13, y: -1 + bob },
    { x: 0, y: 13 + bob },
    { x: -13, y: -1 + bob },
  ];
  // Base azure crystal
  g.fillStyle(0x469fd4).fillPoints(outer, true);
  // Bright sunlit upper-left facet
  g.fillStyle(0x9ee8f7).fillTriangle(
    0,
    -28 + bob,
    -26,
    -1 + bob,
    0,
    -1 + bob,
  );
  // Luminous upper-right facet
  g.fillStyle(0x70c7ea).fillTriangle(0, -28 + bob, 26, -1 + bob, 0, -1 + bob);
  // Deep shaded lower-right facet
  g.fillStyle(0x2f7eb3).fillTriangle(0, 28 + bob, 26, -1 + bob, 0, -1 + bob);
  // Inner crisp crown table
  g.fillStyle(0xd6f8ff, 0.92).fillPoints(crown, true);
  // Subtle facet edge lines
  g.lineStyle(1.6, 0x242b32, 0.35);
  for (let i = 0; i < 4; i++)
    g.lineBetween(outer[i].x, outer[i].y, crown[i].x, crown[i].y);
  g.lineStyle(3.6, theme.ink).strokePoints(outer, true);
  // Animated sparkling glints off the gem crown
  const s1 = 6 + Math.sin(time * 7.5) * 2.5;
  const s2 = 4.5 + Math.cos(time * 6.2 + 1) * 2;
  drawSparkle(g, -11, -13 + bob, s1, 0xfffdf5, 0.95);
  drawSparkle(g, 13, 8 + bob, s2, 0xfff8cf, 0.85);
  g.restore();
}

export interface HandVisualOptions {
  time?: number;
  phase?: "ready" | "grab" | "steal" | "recovery";
  carrying?: boolean;
  wristAngle?: number;
  recoilShake?: number;
  lit?: boolean;
}

/** Articulated ergonomic thief glove: poised idle wiggle, curved lunge splay & true fist clench! */
export function hand(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  rotation: number,
  color: number,
  reach: number,
  gray = 0,
  grip = 0,
  opts: HandVisualOptions = {},
) {
  const time = opts.time ?? 0;
  const phase = opts.phase ?? "ready";
  const carrying = opts.carrying ?? false;
  const wristAngle = opts.wristAngle ?? 0;
  const recoilShake = opts.recoilShake ?? 0;
  const lit = opts.lit ?? false;

  const glove = blend(lit ? 0x454f59 : 0x3a434c, 0x979c9d, gray);
  const gloveDark = blend(lit ? 0x313a43 : 0x2b333b, 0x7f8587, gray);
  const gloveHighlight = blend(lit ? 0x778694 : 0x5a6875, 0xb5b9ba, gray);
  const cuffColor = blend(color, 0xaab0ae, gray);
  const cuffHighlight = blend(0xfffdf5, 0xd8dddc, gray);

  // Dynamic open splay while lunging, tight clench as grip -> 1
  const reachFrac = Math.max(0, Math.min(1, reach / 134));
  const splay =
    phase === "recovery"
      ? 0.08 * (1 - gray * 0.4)
      : reachFrac * (1 - grip) * 0.11;

  g.save();
  g.translateCanvas(x, y);
  g.rotateCanvas(rotation);
  g.translateCanvas(0, -reach);
  g.rotateCanvas(wristAngle + recoilShake);

  // Soft cast drop shadow beneath the lifted forearm & glove (lifts slightly during lunge!)
  const lift = 6 + reachFrac * 8;
  g.fillStyle(0x17121c, 0.22)
    .fillRoundedRect(-20 + lift * 0.5, -2 + lift, 42, 245, 14)
    .fillEllipse(lift * 0.5, -30 + lift, 66, 76);

  // 1. Sleek thief forearm sleeve extending cleanly into the clipped board rim
  rounded(g, -20, 4, 40, 260, 12, gloveDark, 3.8);
  g.fillStyle(gloveHighlight, 0.28).fillRoundedRect(-13, 14, 9, 225, 4);

  // 2. Stylish folded player-colored heist cuff with brass cufflink button
  rounded(g, -24, 6, 48, 17, 6, cuffColor, 3.4);
  g.lineStyle(2.5, cuffHighlight, 0.48).lineBetween(-17, 11, 17, 11);
  circle(g, 13, 14.5, 3.6, blend(0xf5cc62, 0xbcc0be, gray), 2);

  // 3. Ergonomic contoured glove palm
  rounded(g, -28, -48, 56, 58, 19, glove, 3.8);
  g.fillStyle(gloveHighlight, 0.25).fillEllipse(-9, -22, 22, 34);

  // 4. If carrying the stolen gem, nestle it gleaming right INSIDE the clutching palm before curled fingers draw over it!
  if (carrying && grip > 0.35) {
    gem(g, -2, -46, 0.72, time, false);
  }

  // 5. Anatomically proportioned articulated fingers (index, middle, ring, pinky)
  // Open/lunging: stretched & splayed; Stealing (grip -> 1): genuinely curl tightly down into a closed fist!
  const specs = [
    { fx: -20.5, len: 42, spread: -1.45, w: 12.5 }, // Index
    { fx: -6.8, len: 47, spread: -0.45, w: 13 }, // Middle
    { fx: 7.2, len: 44, spread: 0.5, w: 12.5 }, // Ring
    { fx: 20.5, len: 35, spread: 1.4, w: 11.5 }, // Pinky
  ];
  for (let i = 0; i < specs.length; i++) {
    const f = specs[i];
    const idleWiggle =
      phase === "ready" ? Math.sin(time * 3.4 + i * 0.85) * 2.2 : 0;
    const curledLen = f.len * (1 - grip * 0.56);
    const curlY = -36 + grip * 10 - idleWiggle;
    const angle = f.spread * splay;
    g.save();
    g.translateCanvas(f.fx, curlY);
    g.rotateCanvas(angle);
    rounded(
      g,
      -f.w / 2,
      -curledLen + 6,
      f.w,
      curledLen,
      f.w * 0.48,
      glove,
      3.5,
    );
    // Crisp knuckle crease line (more pronounced when clenched into a fist!)
    g.lineStyle(2, lit && gray < 0.5 ? 0xd9d2be : gloveHighlight, 0.42 + grip * 0.35).lineBetween(
      -f.w * 0.26,
      -curledLen * 0.45 + 5,
      f.w * 0.26,
      -curledLen * 0.45 + 5,
    );
    g.restore();
  }

  // 6. Articulated opposable thumb (opens wide on lunge, wraps snugly across clenched fist on steal!)
  g.save();
  g.translateCanvas(-27, -20);
  g.rotateCanvas(-0.68 - splay * 1.4 + grip * 1.28);
  rounded(g, -9, -32 + grip * 7, 16.5, 39 - grip * 7, 8, glove, 3.5);
  g.lineStyle(2, gloveHighlight, 0.38).lineBetween(-3, -14, 3, -14);
  g.restore();

  // 7. Subtle back-of-hand glove stitching lines (classic heist glove detail!)
  g.lineStyle(2, gloveHighlight, 0.52);
  g.lineBetween(-11, -30, -13, -12);
  g.lineBetween(0, -32, 0, -11);
  g.lineBetween(11, -30, 13, -12);

  g.restore();
}
