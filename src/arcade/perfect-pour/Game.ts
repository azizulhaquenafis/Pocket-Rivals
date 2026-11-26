import type { Difficulty } from "../../shared/contracts/AIController";
import { ArcadeGame } from "../../shared/arcade/ArcadeGame";
import { circle, rounded } from "../../shared/components/drawing";
import config from "./config";
import { PourWorld } from "./Rules";

const BASE_Y = 560;
const NOZZLE_Y = 236;
const INK = 0x242b32;

export class Game extends ArcadeGame {
  protected override autoScoreSound = false;
  private w = new PourWorld();
  private shapeRound = -1;
  private shape: { x: number; y: number }[] = [];
  private leftWall: { x: number; y: number }[] = [];
  private rightWall: { x: number; y: number }[] = [];
  private keys = new Set<string>();
  private touch = false;
  private wasDown = false;
  private wasBetween = false;

  protected challenge = {
    title: "Perfect Pour",
    instructions: config.instructions,
    desktopControls: config.desktopControls?.ai,
    tiers: [
      "Gentle flow and a preview of water still falling.",
      "Faster flow with more water arriving after release.",
      "Fast flow and a narrower accuracy allowance.",
    ] as const,
  };

  protected configure(tier: Difficulty) {
    this.w = new PourWorld(tier);
    this.shapeRound = -1;
    this.wasBetween = false;
  }

  protected bind() {
    this.keys = this.ctx.input.keys(["Space", "Enter", "ArrowDown", "KeyS"]);
    this.ctx.input.drag(
      (x, y) => {
        if (!this.active || x < 24 || x > 396 || y < 112 || y > 650)
          return false;
        this.touch = true;
        return true;
      },
      () => {},
      () => (this.touch = false),
      () => {
        this.touch = false;
        this.w.cancel();
      },
      { outside: true },
    );
  }

  protected clearInput() {
    this.touch = false;
    this.wasDown = false;
    this.w.cancel();
  }

  protected step(dt: number) {
    const down =
      this.touch ||
      this.keys.has("Space") ||
      this.keys.has("Enter") ||
      this.keys.has("ArrowDown") ||
      this.keys.has("KeyS");
    if (down !== this.wasDown) {
      const wasHolding = this.w.holding;
      this.w.hold(down);
      if (down && this.w.holding) this.ctx.audio.play("soft", 0.48);
      else if (!down && wasHolding) this.ctx.audio.play("tap", 0.55);
      this.wasDown = down;
    }
    this.w.step(dt);
    const inBetween = this.w.between > 0;
    if (inBetween && !this.wasBetween) {
      if (this.w.spilled) this.ctx.audio.play("fall", 0.85);
      else if (this.w.rating >= 97) this.ctx.audio.play("perfect", 0.95);
      else if (this.w.rating >= 75) this.ctx.audio.play("capture", 0.7);
      else this.ctx.audio.play("fail", 0.65);
    }
    this.wasBetween = inBetween;
  }

  private ensureShape() {
    const w = this.w;
    if (this.shapeRound === w.round) return;
    this.shapeRound = w.round;
    this.shape.length = 0;
    this.leftWall.length = 0;
    this.rightWall.length = 0;
    for (let h = 270; h >= 0; h -= 5) {
      const pt = { x: 210 - w.width(h) / 2, y: BASE_Y - h };
      this.shape.push(pt);
      this.leftWall.push(pt);
    }
    for (let h = 0; h <= 270; h += 5) {
      const pt = { x: 210 + w.width(h) / 2, y: BASE_Y - h };
      this.shape.push(pt);
      this.rightWall.push(pt);
    }
  }

  protected draw() {
    const g = this.g,
      w = this.w;
    this.ensureShape();

    // 1. Clean airy sunlit backdrop + grounded oak counter shelf
    this.board(0xd9edf3);
    // Subtle studio wall tile bands
    g.fillStyle(0xffffff, 0.14).fillRect(24, 112, 372, 165);
    // Warm oak counter beneath the vessel
    g.fillStyle(0xdcb98b).fillRect(24, BASE_Y, 372, 90);
    g.fillStyle(0xf0d7b1).fillRect(24, BASE_Y, 372, 10);
    g.lineStyle(2, 0xc49f71, 0.45);
    g.lineBetween(34, BASE_Y + 28, 386, BASE_Y + 28);
    g.lineBetween(34, BASE_Y + 56, 386, BASE_Y + 56);
    g.lineStyle(3.5, INK).lineBetween(24, BASE_Y, 396, BASE_Y);

    // Subtle celebration / miss glow behind the vessel during reveal
    if (w.between > 0) {
      const fade = Math.min(1, w.between / 0.35);
      const glowColor =
        w.rating >= 97 ? 0xffe066 : w.rating >= 75 ? 0x92d48f : 0xf27d6b;
      g.fillStyle(glowColor, 0.24 * fade).fillCircle(210, 425, 136);
      g.fillStyle(glowColor, 0.18 * fade).fillCircle(210, 425, 96);
    }

    // Soft coaster shadow under the glass base
    const baseW = w.width(0);
    g.fillStyle(INK, 0.16).fillEllipse(210, BASE_Y + 5, baseW + 24, 14);

    // 2. Frosted glass back body + soft top rim ellipse
    const topW = w.width(270);
    g.fillStyle(0xfffdf5, 0.94).fillPoints(this.shape, true);
    g.fillStyle(0xe8f4fa).fillEllipse(210, BASE_Y - 270, topW, 13);

    // 3. Living water body with surface wave, depth tint, bubbles & impact ripples
    const fill = w.heightFor(w.volume);
    const surfaceY = BASE_Y - fill;
    const churn = Math.min(1, w.streamRate);
    if (fill > 2) {
      const water: { x: number; y: number }[] = [];
      const halfSurface = w.width(fill) / 2 - 3;
      const waveAmp = Math.min(fill * 0.25, 0.9 + churn * 3.8);
      for (let h = fill; h > 0; h -= 4) {
        water.push({ x: 210 - w.width(h) / 2 + 3, y: BASE_Y - h });
      }
      water.push(
        { x: 210 - baseW / 2 + 3, y: BASE_Y - 3 },
        { x: 210 + baseW / 2 - 3, y: BASE_Y - 3 },
      );
      for (let h = 0; h < fill; h += 4) {
        water.push({ x: 210 + w.width(h) / 2 - 3, y: BASE_Y - h });
      }
      // Animated meniscus wave across the top of the liquid
      const waveSteps = 12;
      for (let i = 0; i <= waveSteps; i++) {
        const u = i / waveSteps;
        const x = 210 + halfSurface - u * halfSurface * 2;
        const centerDip = Math.sin(u * Math.PI) * churn * 2.2;
        const ripple =
          Math.sin(w.time * 11 + u * Math.PI * 3.5) * waveAmp * Math.sin(u * Math.PI);
        water.push({ x, y: surfaceY + ripple + centerDip });
      }
      g.fillStyle(0x58addb).fillPoints(water, true);

      // Subtle deeper bottom shade band for clean volume
      const deepH = Math.min(fill * 0.38, 64);
      if (deepH > 6) {
        const deep: { x: number; y: number }[] = [];
        for (let h = deepH; h > 0; h -= 6)
          deep.push({ x: 210 - w.width(h) / 2 + 3, y: BASE_Y - h });
        deep.push(
          { x: 210 - baseW / 2 + 3, y: BASE_Y - 3 },
          { x: 210 + baseW / 2 - 3, y: BASE_Y - 3 },
        );
        for (let h = 0; h <= deepH; h += 6)
          deep.push({ x: 210 + w.width(h) / 2 - 3, y: BASE_Y - h });
        g.fillStyle(0x3f93c4, 0.42).fillPoints(deep, true);
      }

      // Luminous surface meniscus & impact foam ring
      g.fillStyle(0x9ce2fc, 0.78).fillEllipse(
        210,
        surfaceY + 1,
        Math.max(8, halfSurface * 1.94),
        Math.min(11, 5 + churn * 3),
      );
      if (churn > 0.12) {
        g.lineStyle(2, 0xfffdf5, 0.75 * churn).strokeEllipse(
          210,
          surfaceY + 1,
          14 + ((w.time * 48) % Math.max(16, halfSurface * 1.3)),
          4.5,
        );
      }

      // Rising micro-bubbles inside the water while pouring
      if (fill > 26 && churn > 0.08) {
        g.fillStyle(0xdaf5ff, 0.72 * churn);
        for (let i = 0; i < 6; i++) {
          const u = (w.time * (0.7 + (i % 3) * 0.25) + i * 0.19) % 1;
          const bh = 8 + u * Math.max(4, fill - 16);
          const spread = Math.max(6, w.width(bh) * 0.28);
          const bx = 210 + Math.sin(i * 2.4 + w.time * 4.5) * spread;
          g.fillCircle(bx, BASE_Y - bh, 2 + (i % 2) * 1.3);
        }
      }
    }

    // 4. Overflow spill streams & puddle if player over-poured
    if (w.spilled) {
      const spillProgress = Math.min(1, w.betweenAge / 0.35);
      const puddleW = baseW + 24 + spillProgress * 64;
      g.fillStyle(0x58addb, 0.85).fillEllipse(210, BASE_Y + 6, puddleW, 14);
      g.fillStyle(0x9ce2fc, 0.6).fillEllipse(
        210,
        BASE_Y + 5,
        puddleW * 0.62,
        6,
      );
      // Trickle streams hugging left & right outer rims
      const dropLen = spillProgress * 268;
      g.lineStyle(5, 0x58addb, 0.9);
      g.lineBetween(
        210 - topW / 2 - 2,
        BASE_Y - 268,
        210 - w.width(Math.max(0, 270 - dropLen)) / 2 - 4,
        BASE_Y - 268 + dropLen,
      );
      g.lineBetween(
        210 + topW / 2 + 2,
        BASE_Y - 268,
        210 + w.width(Math.max(0, 270 - dropLen)) / 2 + 4,
        BASE_Y - 268 + dropLen,
      );
    }

    // 5. Continuous glossy pouring stream + pinching residual droplets
    const streamBottom = Math.min(BASE_Y - 4, surfaceY + 2);
    if (w.holding && streamBottom > NOZZLE_Y + 4) {
      const streamW = 4 + w.valve * 4.5 + Math.sin(w.time * 24) * 0.6;
      // Soft dark edge contour + glossy sky-blue stream + bright core gleam
      g.fillStyle(INK, 0.85).fillRect(
        210 - streamW / 2 - 1.5,
        NOZZLE_Y,
        streamW + 3,
        streamBottom - NOZZLE_Y,
      );
      g.fillStyle(0x58addb).fillRect(
        210 - streamW / 2,
        NOZZLE_Y,
        streamW,
        streamBottom - NOZZLE_Y,
      );
      g.fillStyle(0xdcf6ff, 0.85).fillRect(
        210 - streamW * 0.18,
        NOZZLE_Y + 2,
        Math.max(1.5, streamW * 0.28),
        streamBottom - NOZZLE_Y - 4,
      );
      // Tiny lively splash droplets bouncing up at stream impact
      g.fillStyle(0x88d8fa, 0.9);
      for (const side of [-1, 1]) {
        const phase = (w.time * 6.5 + (side > 0 ? 0.5 : 0)) % 1;
        const dx = side * (6 + phase * 14);
        const dy = -Math.sin(phase * Math.PI) * 14;
        g.fillCircle(210 + dx, surfaceY + dy, 2.4 * (1 - phase * 0.4));
      }
    } else if (!w.holding && w.pending > 2 && streamBottom > NOZZLE_Y + 6) {
      // Realistic pinching stream tail & falling residual droplets matching w.pending!
      const fallDist = Math.min(
        streamBottom - NOZZLE_Y,
        w.releaseAge * 520 + w.releaseAge * w.releaseAge * 420,
      );
      const tailTop = NOZZLE_Y + fallDist;
      const thinW = Math.max(2.5, 6 * (1 - Math.min(1, w.releaseAge / 0.28)));
      if (tailTop < streamBottom - 6) {
        g.fillStyle(0x58addb, 0.92).fillRoundedRect(
          210 - thinW / 2,
          tailTop,
          thinW,
          streamBottom - tailTop,
          thinW / 2,
        );
        g.fillStyle(0xdcf6ff, 0.8).fillRect(
          210 - thinW * 0.15,
          tailTop + 2,
          Math.max(1.2, thinW * 0.3),
          Math.max(0, streamBottom - tailTop - 4),
        );
      }
      // Trailing elongated drops racing down from the freshly closed nozzle
      for (let i = 0; i < 3; i++) {
        const dropT = w.releaseAge - i * 0.08;
        if (dropT <= 0) continue;
        const dy = NOZZLE_Y + dropT * 360 + dropT * dropT * 520;
        if (dy < streamBottom - 4) {
          g.fillStyle(0x58addb, 0.9).fillEllipse(210, dy, 5.5 - i * 0.9, 10 - i);
          g.fillStyle(0xfffdf5, 0.7).fillCircle(209, dy - 1.5, 1.3);
        }
      }
    }

    // 6. Glass front specular reflections & crisp outer contour
    if (this.leftWall.length > 6) {
      g.lineStyle(4.5, 0xfffdf5, 0.65);
      g.beginPath();
      const startIdx = 4;
      const endIdx = this.leftWall.length - 4;
      g.moveTo(this.leftWall[startIdx].x + 9, this.leftWall[startIdx].y);
      for (let i = startIdx + 1; i <= endIdx; i++) {
        g.lineTo(this.leftWall[i].x + 9, this.leftWall[i].y);
      }
      g.strokePath();
      g.lineStyle(2.5, 0xfffdf5, 0.35);
      g.beginPath();
      g.moveTo(this.rightWall[startIdx].x - 7, this.rightWall[startIdx].y);
      for (let i = startIdx + 1; i <= endIdx; i++) {
        g.lineTo(this.rightWall[i].x - 7, this.rightWall[i].y);
      }
      g.strokePath();
    }
    g.lineStyle(4, INK).strokePoints(this.shape, false);
    g.lineStyle(3.2, INK).strokeEllipse(210, BASE_Y - 270, topW, 13);

    // 7. Medium difficulty incoming-water settle preview + signature orange target line
    if (this.difficulty === "medium" && w.pending > 0 && !w.between) {
      const incomingH = w.heightFor(w.volume + w.pending);
      const incomingY = BASE_Y - incomingH;
      const iw = w.width(incomingH) / 2 - 4;
      g.lineStyle(2.4, 0x3f93c4, 0.68).lineBetween(
        210 - iw,
        incomingY,
        210 + iw,
        incomingY,
      );
    }
    const targetH = w.heightFor(w.capacity * w.target);
    const targetY = BASE_Y - targetH;
    const tw = w.width(targetH) / 2;
    // Crisp dashed orange target line + tidy side ticks right outside the glass
    g.lineStyle(3.2, 0xf49b58);
    for (let x = 210 - tw - 12; x < 210 + tw + 10; x += 12) {
      g.lineBetween(x, targetY, Math.min(210 + tw + 12, x + 7), targetY);
    }
    g.fillStyle(0xf49b58);
    g.fillTriangle(
      210 - tw - 22,
      targetY - 4,
      210 - tw - 14,
      targetY,
      210 - tw - 22,
      targetY + 4,
    );
    g.fillTriangle(
      210 + tw + 22,
      targetY - 4,
      210 + tw + 14,
      targetY,
      210 + tw + 22,
      targetY + 4,
    );

    // 8. Furnished wall-mounted brushed-steel & brass overhead water tap!
    this.drawDispenser(g, w.valve, w.holding, w.time);

    // 9. Clean minimal HUD labels (positioned cleanly off to the side of the ceiling pipe)
    this.text("round", 74, 136, `POUR ${w.round} / 10`, 14, "#4b5a64");
    const ratingMsg = w.between
      ? w.spilled
        ? "OVERFLOW!"
        : w.rating >= 97
          ? `PERFECT · ${w.rating}`
          : `${w.rating} / 100`
      : w.started || w.round > 1
        ? ""
        : "HOLD TO POUR";
    const ratingColor = w.between
      ? w.rating >= 97
        ? "#b87412"
        : w.rating >= 75
          ? "#2f7a44"
          : "#b53f2f"
      : "#242b32";
    this.text("rating", 210, 606, ratingMsg, 20, ratingColor);
  }

  private drawDispenser(
    g: Phaser.GameObjects.Graphics,
    valve: number,
    holding: boolean,
    time: number,
  ) {
    // Ceiling flange & vertical stainless feed pipe rising straight from top frame (y = 112)
    rounded(g, 190, 108, 40, 14, 5, 0x5c6b78, 3);
    rounded(g, 200, 118, 20, 62, 4, 0x7a8a97, 3);
    g.fillStyle(0xb9c7d2, 0.75).fillRect(204, 122, 5, 54);

    // Brass mounting collar
    rounded(g, 194, 174, 32, 11, 4, 0xe8bd5a, 2.8);

    // Tactile animated lever handle on the right side (tilts cleanly open while holding!)
    const leverAngle = -0.35 + valve * 0.72;
    g.save();
    g.translateCanvas(236, 200);
    g.rotateCanvas(leverAngle);
    rounded(g, 0, -4.5, 28, 9, 4.5, 0x5c6b78, 2.8);
    circle(g, 31, 0, 7.5, holding ? 0xf49b58 : 0xe8bd5a, 3);
    g.fillStyle(0xfff5c7, 0.85).fillCircle(29.5, -2, 2.2);
    g.restore();

    // Sculpted ceramic/steel dispenser body with subtle specular highlight
    rounded(g, 182, 183, 56, 36, 11, 0x627280, 3.5);
    g.fillStyle(0x8899a8, 0.65).fillRoundedRect(189, 189, 42, 8, 4);
    g.fillStyle(0x45525e, 0.5).fillRoundedRect(189, 208, 42, 6, 3);
    // Center pressure gauge dial dot (glows soft blue while pouring)
    circle(g, 210, 201, 7, 0xfffdf5, 2.4);
    circle(g, 210, 201, 3.5, holding ? 0x58addb : 0x8ea0ad, 0);

    // Tapered brass/steel aerator spout nozzle ending cleanly at NOZZLE_Y (236)
    rounded(g, 198, 218, 24, 11, 4, 0xe8bd5a, 2.8);
    rounded(g, 202, 227, 16, 10, 3, 0x45525e, 2.8);

    // Tiny glistening water bead hanging at the spout when idle
    if (!holding && this.w.pending <= 2) {
      const pulse = 1 + Math.sin(time * 3) * 0.12;
      g.fillStyle(0x58addb, 0.85).fillCircle(210, NOZZLE_Y + 3, 2.6 * pulse);
    }
  }

  protected state() {
    return {
      score: this.w.score,
      done: this.w.done,
      detail: "",
      lives: this.w.lives,
      maxLives: 3,
      result: this.w.lives
        ? "Ten vessels filled."
        : `Reached pour ${this.w.round}.`,
    };
  }

  snapshot() {
    return {
      ...this.state(),
      started: this.started,
      difficulty: this.difficulty,
      round: this.w.round,
      volume: this.w.volume,
      capacity: this.w.capacity,
      target: this.w.target,
      holding: this.w.holding,
      locked: this.w.locked,
      spilled: this.w.spilled,
      rating: this.w.rating,
      between: this.w.between,
    };
  }
}
