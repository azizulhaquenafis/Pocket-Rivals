import config from "./config";
import { ArcadeGame } from "../../shared/arcade/ArcadeGame";
import type { ArcadeGuideItem } from "../../shared/arcade/ArcadeSetup";
import type { Difficulty } from "../../shared/contracts/AIController";
import { rounded } from "../../shared/components/drawing";
import { GliderWorld } from "./Rules";

interface Puff {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  r: number;
  color: number;
}

const GLIDER_GUIDE: readonly ArcadeGuideItem[] = [
  {
    label: "Wind & Air Resistance",
    detail:
      "Watch the moving wind bar at the top and sky breeze streaks. Steering with the wind gives a faster glide; fighting against it slows you down.",
    swatch: "#58addb",
  },
  {
    label: "Landing Pad & Red Dotted Line",
    detail:
      "Touch down on the green runway strip at the bottom. Crossing the red dotted line outside the pad—or crashing into a barrier—costs a heart.",
    swatch: "#e0554f",
  },
  {
    label: "Endless Levels · 3 Hearts",
    detail:
      "You have 3 hearts. Clearing each level advances to Level 2, Level 3, and beyond with progressively narrower gates and stronger breezes.",
    swatch: "#92b875",
  },
  {
    label: "Air Brake & Rings",
    detail:
      "Steer with ←/→, A/D or drag. Hold Space/↓ (or drag in the bottom strip) to slow your descent and pass golden rings for bonus points.",
    swatch: "#f4cc60",
  },
];

export class Game extends ArcadeGame {
  protected override autoScoreSound = false;
  private w = new GliderWorld();
  protected override endDelay = 1.15;
  private keys = new Set<string>();
  private target: number | null = null;
  private brake = false;
  private wasBraking = false;
  private breezePhase = 0;
  private windDisplay = 0;
  private shake = 0;
  private crashBanner = "";
  private crashAge = 1;
  private puffs: Puff[] = [];
  private tumble = { x: 210, y: 300, vx: 0, vy: 0, spin: 0, active: false };

  protected challenge = {
    instructions: config.instructions,
    guideTitle: "How to play",
    guide: GLIDER_GUIDE,
    desktopControls: config.desktopControls?.ai,
    title: "Paper Glider",
    tiers: [
      "Wide gates, lighter breezes and a landing alignment cue.",
      "Narrower obstacles, livelier crosswinds and tighter pads.",
      "Fast descent, gusty headwinds and razor-tight gates.",
    ] as const,
  };

  protected configure(t: Difficulty) {
    this.w = new GliderWorld(t);
    this.wasBraking = false;
    this.breezePhase = 0;
    this.windDisplay = this.w.windRatio;
    this.shake = 0;
    this.crashBanner = "";
    this.crashAge = 1;
    this.puffs.length = 0;
    this.tumble.active = false;
  }

  protected bind() {
    this.keys = this.ctx.input.keys([
      "ArrowLeft",
      "ArrowRight",
      "KeyA",
      "KeyD",
      "Space",
      "ArrowDown",
    ]);
    this.ctx.input.drag(
      (x, y) => {
        if (!this.active || x < 24 || x > 396 || y < 112 || y > 650)
          return false;
        this.target = x;
        this.brake = y > 570;
        return true;
      },
      (x, y) => {
        this.target = x;
        this.brake = y > 570;
      },
      () => this.clearTouch(),
      () => this.clearTouch(),
      { outside: true },
    );
  }

  private clearTouch() {
    this.target = null;
    this.brake = false;
  }

  protected clearInput() {
    this.clearTouch();
    this.wasBraking = false;
    this.keys.clear();
  }

  private cameraY() {
    return Math.max(0, Math.min(this.w.y - 110, this.w.length - 360));
  }

  private spawnCrash(final: boolean) {
    const c = this.w.lastCrash;
    if (!c) return;
    const cam = Math.max(0, Math.min(c.y - 110, this.w.length - 360));
    const sy = 200 + c.y - cam;
    this.shake = final ? 0.28 : 0.2;
    this.crashAge = 0;
    this.crashBanner =
      c.reason === "miss" ? "CROSSED RED LINE!" : "CLIPPED BARRIER!";
    if (final) {
      this.tumble = {
        x: c.x,
        y: sy,
        vx: c.vx * 0.4,
        vy: 35,
        spin: 0,
        active: true,
      };
    }
    this.puffs.length = 0;
    const count = final ? 14 : 10;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const spd = 45 + (i % 3) * 25;
      this.puffs.push({
        x: c.x,
        y: Math.max(150, Math.min(625, sy)),
        vx: Math.cos(a) * spd + c.vx * 0.15,
        vy: Math.sin(a) * spd - 12,
        age: 0,
        life: final ? 0.8 : 0.52,
        r: final ? 4.2 - (i % 2) : 3.2 - (i % 2) * 0.6,
        color: i % 3 === 0 ? 0xe0554f : i % 3 === 1 ? 0xfffcf3 : 0x58addb,
      });
    }
  }

  private advanceEffects(dt: number) {
    this.shake = Math.max(0, this.shake - dt);
    this.crashAge += dt;
    this.breezePhase += this.w.wind * dt * 1.35;
    this.windDisplay +=
      (this.w.windRatio - this.windDisplay) * (1 - Math.exp(-10 * dt));
    if (this.tumble.active) {
      const drag = Math.exp(-2.8 * dt);
      this.tumble.vx *= drag;
      this.tumble.vy += 40 * dt;
      this.tumble.x += this.tumble.vx * dt;
      this.tumble.y += this.tumble.vy * dt;
      this.tumble.spin += 4.2 * dt;
    }
    for (let i = this.puffs.length - 1; i >= 0; i--) {
      const p = this.puffs[i];
      p.age += dt;
      const drag = Math.exp(-3.4 * dt);
      p.vx *= drag;
      p.vy *= drag;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.age >= p.life) this.puffs.splice(i, 1);
    }
  }

  protected step(dt: number) {
    const lives = this.w.lives,
      rings = this.w.rings,
      wasTransition = this.w.transition > 0;
    const k = this.keys,
      steer =
        this.target === null
          ? +(k.has("ArrowRight") || k.has("KeyD")) -
            +(k.has("ArrowLeft") || k.has("KeyA"))
          : Math.max(-1, Math.min(1, (this.target - this.w.x) / 36));
    const braking = this.brake || k.has("Space") || k.has("ArrowDown");
    if (braking && !this.wasBraking && !this.w.transition && !this.w.recovery)
      this.ctx.audio.play("slide", 0.45);
    this.wasBraking = braking;
    this.w.step(dt, steer, braking);
    this.advanceEffects(dt);
    if (this.w.rings > rings) this.ctx.audio.play("capture", 0.65);
    if (!wasTransition && this.w.transition > 0)
      this.ctx.audio.play("perfect", 0.85);
    if (this.w.lives < lives) {
      this.spawnCrash(this.w.done);
      this.ctx.audio.play(
        this.w.done
          ? "fail"
          : this.w.lastCrash?.reason === "miss"
            ? "fall"
            : "thud",
        this.w.done ? 0.9 : 0.72,
      );
    }
  }

  protected override stepEnding(dt: number) {
    this.advanceEffects(dt);
  }

  protected draw() {
    const w = this.w,
      g = this.g,
      cam = this.cameraY(),
      sy = (y: number) => 200 + y - cam;
    const sx =
      this.shake > 0
        ? Math.sin(this.age * 82) * (this.shake / 0.28) * 2.5
        : 0;
    const shY =
      this.shake > 0
        ? Math.cos(this.age * 68) * (this.shake / 0.28) * 2
        : 0;

    this.board(0xd5e9ed);

    // Soft scrolling clouds
    for (let i = 0; i < 8; i++) {
      const y = 165 + ((((i * 109 - cam * 0.28) % 480) + 480) % 480),
        x = 64 + ((i * 73) % 292);
      g.fillStyle(0xfffcf3, 0.5)
        .fillEllipse(x + sx * 0.3, y + shY * 0.3, 70, 22)
        .fillCircle(x - 12 + sx * 0.3, y - 9 + shY * 0.3, 16);
    }

    // Animated horizontal air-current breeze streaks driven by live wind velocity
    const windMag = Math.abs(this.windDisplay);
    if (windMag > 0.06) {
      const streakLen = 14 + windMag * 28;
      const streakColor = this.windDisplay > 0 ? 0xf49b58 : 0x58addb;
      g.lineStyle(2, streakColor, 0.14 + windMag * 0.2);
      for (let i = 0; i < 9; i++) {
        const rawX = (((i * 97 + this.breezePhase * (0.75 + (i % 3) * 0.2)) % 390) + 390) % 390;
        const bx = 22 + rawX;
        const by = 195 + i * 48;
        g.lineBetween(bx, by, bx + streakLen * Math.sign(this.windDisplay), by);
      }
    }

    // Golden bonus rings
    for (const r of w.targets) {
      const y = sy(r.y) + shY;
      if (y < 140 || y > 646) continue;
      g.lineStyle(6, r.hit ? 0x91b578 : 0xf4cc60).strokeEllipse(
        r.x + sx,
        y,
        w.settings.ring * 2,
        25,
      );
      g.lineStyle(2, 0x242b32).strokeEllipse(
        r.x + sx,
        y,
        w.settings.ring * 2 + 6,
        31,
      );
    }

    // Obstacle gates (progressively narrower per level)
    const halfGap = w.gap / 2;
    for (const wall of w.walls) {
      const y = sy(wall.y) + shY;
      if (y < 145 || y > 648) continue;
      const a = wall.x - halfGap,
        b = wall.x + halfGap;
      if (a > 29) {
        rounded(g, 25 + sx, y - 9, a - 25, 18, 7, 0x9aabc2, 3);
        g.fillStyle(0xe0554f, 0.85).fillRoundedRect(a - 7 + sx, y - 6, 5, 12, 2);
      }
      if (b < 391) {
        rounded(g, b + sx, y - 9, 395 - b, 18, 7, 0x9aabc2, 3);
        g.fillStyle(0xe0554f, 0.85).fillRoundedRect(b + 2 + sx, y - 6, 5, 12, 2);
      }
    }

    // Improved Landing Zone + Clear Red Dotted Danger Line across out-of-bounds edges
    const ly = sy(w.length) + shY;
    const padHalf = w.landingWidth;
    const padL = w.landing - padHalf;
    const padR = w.landing + padHalf;
    if (ly < 658) {
      // Ground horizon backdrop below the finish line
      const groundH = Math.max(0, 652 - ly);
      if (groundH > 0) {
        g.fillStyle(0xc9dfb2, 0.92).fillRect(24, ly, 372, groundH);
        // Subtle coral danger band under the red dotted line outside the runway
        if (padL > 26)
          g.fillStyle(0xe0554f, 0.16).fillRect(24, ly, padL - 24, Math.min(28, groundH));
        if (padR < 394)
          g.fillStyle(0xe0554f, 0.16).fillRect(padR, ly, 396 - padR, Math.min(28, groundH));
      }

      // Red dotted Game Over / Miss boundary line on both sides of the safe runway
      g.fillStyle(0xe0554f, 0.95);
      for (let dx = 32; dx <= padL - 6; dx += 11) {
        g.fillRoundedRect(dx + sx, ly - 2.5, 6, 5, 2.5);
      }
      for (let dx = padR + 4; dx <= 386; dx += 11) {
        g.fillRoundedRect(dx + sx, ly - 2.5, 6, 5, 2.5);
      }

      // Runway landing pad
      const aligned = Math.abs(w.x - w.landing) < padHalf;
      rounded(
        g,
        padL + sx,
        ly - 2,
        padHalf * 2,
        36,
        9,
        aligned ? 0x86bc68 : 0x92b875,
        3,
      );
      g.fillStyle(0xf8f4e6, 0.94).fillRoundedRect(
        padL + 8 + sx,
        ly + 4,
        Math.max(10, padHalf * 2 - 16),
        24,
        6,
      );
      // Runway centerline dashes & center touchdown mark
      g.lineStyle(2.5, 0x7b9870, 0.7);
      for (let cx = padL + 16; cx < padR - 18; cx += 16) {
        g.lineBetween(cx + sx, ly + 16, Math.min(cx + 8, padR - 14) + sx, ly + 16);
      }
      g.fillStyle(0xf49b58).fillCircle(w.landing + sx, ly + 16, 4.5);
      g.lineStyle(1.8, 0x242b32).strokeCircle(w.landing + sx, ly + 16, 4.5);

      // Runway corner pylons clearly marking safe vs red-line boundary
      for (const px of [padL, padR]) {
        g.fillStyle(0xf49b58).fillCircle(px + sx, ly - 2, 5.5);
        g.lineStyle(2, 0x242b32).strokeCircle(px + sx, ly - 2, 5.5);
      }

      // Medium mode helpful vertical alignment guide toward the runway
      if (this.difficulty === "medium" && ly < 620 && ly > 260 && !w.done) {
        g.lineStyle(2, 0x7ba865, 0.35);
        for (let gy = ly - 16; gy > Math.max(210, ly - 130); gy -= 14) {
          g.lineBetween(w.landing + sx, gy, w.landing + sx, gy - 7);
        }
      }

      if (ly < 615) {
        this.text("land", w.landing + sx, ly - 18, "LAND HERE", 11, "#3d6b35");
      } else {
        this.text("land", 210, -100, "", 11);
      }
    } else {
      this.text("land", 210, -100, "", 11);
    }

    // Glider sprite (smooth banking, or gentle tumble on final Game Over)
    const interp =
      this.started && !this.paused && !w.done && !w.recovery && !w.transition
        ? this.alpha / 120
        : 0;
    const gx = Math.max(39, Math.min(381, w.x + w.vx * interp)) + sx;
    const gy = sy(w.y + w.descentSpeed * interp) + shY;

    if (!w.done) {
      const alpha = w.recovery ? 0.55 + Math.sin(this.age * 24) * 0.25 : 1;
      g.save();
      g.translateCanvas(gx, gy);
      g.rotateCanvas(-w.bank);
      g.fillStyle(w.recovery ? 0xdbe3e8 : 0xfffcf3, alpha).fillPoints(
        [
          { x: 0, y: 17 },
          { x: -17, y: -12 },
          { x: 0, y: -4 },
          { x: 17, y: -12 },
        ],
        true,
      );
      g.lineStyle(3, 0x242b32, alpha).strokePoints(
        [
          { x: 0, y: 17 },
          { x: -17, y: -12 },
          { x: 0, y: -4 },
          { x: 17, y: -12 },
        ],
        true,
      );
      g.lineStyle(2, 0x58addb, alpha).lineBetween(0, 17, 0, -4);
      g.restore();
    } else if (this.tumble.active) {
      const fade = Math.max(0, 1 - this.ending / 0.85);
      g.save();
      g.translateCanvas(this.tumble.x, this.tumble.y);
      g.rotateCanvas(this.tumble.spin);
      g.fillStyle(0xfffcf3, fade).fillPoints(
        [
          { x: 0, y: 14 },
          { x: -14, y: -10 },
          { x: 0, y: -3 },
          { x: 14, y: -10 },
        ],
        true,
      );
      g.lineStyle(2.5, 0x242b32, fade).strokePoints(
        [
          { x: 0, y: 14 },
          { x: -14, y: -10 },
          { x: 0, y: -3 },
          { x: 14, y: -10 },
        ],
        true,
      );
      g.restore();
    }

    // Crash / Flutter particles
    for (const p of this.puffs) {
      const t = Math.min(1, p.age / p.life);
      g.fillStyle(p.color, (1 - t) * 0.9).fillCircle(
        p.x,
        p.y,
        Math.max(1, p.r * (1 - t * 0.4)),
      );
    }

    // Top HUD: LEVEL pill (left), RINGS pill (right), Moving Wind / Air Resistance Bar (center-below)
    g.fillStyle(0xfffdf5, 0.94).fillRoundedRect(36, 121, 90, 25, 12);
    g.lineStyle(2, 0x242b32, 0.85).strokeRoundedRect(36, 121, 90, 25, 12);
    this.text("level", 81, 133.5, `LEVEL ${w.level}`, 12, "#242b32");

    g.fillStyle(0xfffdf5, 0.94).fillRoundedRect(292, 121, 92, 25, 12);
    g.lineStyle(2, 0x242b32, 0.85).strokeRoundedRect(292, 121, 92, 25, 12);
    this.text(
      "rings-hud",
      338,
      133.5,
      `${w.rings}/${w.targets.length} RINGS`,
      11,
      "#242b32",
    );

    // Moving Wind / Air Resistance Bar in the upper HUD
    const barX = 94,
      barY = 154,
      barW = 232,
      barH = 16,
      midX = barX + barW / 2;
    g.fillStyle(0xfffdf5, 0.93).fillRoundedRect(barX, barY, barW, barH, 8);
    g.lineStyle(2, 0x242b32, 0.85).strokeRoundedRect(barX, barY, barW, barH, 8);

    const maxHalf = barW / 2 - 12;
    const fillW = this.windDisplay * maxHalf;
    const windColor = this.windDisplay >= 0 ? 0xf49b58 : 0x58addb;
    if (Math.abs(fillW) > 1.5) {
      const fx = fillW >= 0 ? midX : midX + fillW;
      g.fillStyle(windColor, 0.85).fillRoundedRect(
        fx,
        barY + 3,
        Math.abs(fillW),
        barH - 6,
        5,
      );
    }
    // Center calm tick & moving knob indicator
    g.lineStyle(2, 0x242b32, 0.45).lineBetween(midX, barY + 2, midX, barY + barH - 2);
    const knobX = midX + fillW;
    g.fillStyle(windColor).fillCircle(knobX, barY + barH / 2, 6);
    g.lineStyle(2, 0x242b32).strokeCircle(knobX, barY + barH / 2, 6);

    const dirGlyph =
      this.windDisplay > 0.12
        ? "AIR ››"
        : this.windDisplay < -0.12
          ? "‹‹ AIR"
          : "CALM";
    this.text("wind-label", 210, 133.5, dirGlyph, 10, "#5c6d73");

    // Status callouts (Level Clear, brief Crash reason, or Smooth Game Over card)
    if (w.transition > 0) {
      g.fillStyle(0xfffdf5, 0.94).fillRoundedRect(105, 578, 210, 38, 14);
      g.lineStyle(2.5, 0x242b32).strokeRoundedRect(105, 578, 210, 38, 14);
      this.text("banner", 210, 597, `LEVEL ${w.level} CLEAR!`, 14, "#3d6b35");
    } else if (!w.done && this.crashAge < 0.95 && this.crashBanner) {
      const a = Math.max(0, 1 - Math.max(0, this.crashAge - 0.5) / 0.45);
      this.text("banner", 210, 597, this.crashBanner, 13, "#c4453f", a);
    } else {
      this.text("banner", 210, -100, "", 13, "#242b32", 0);
    }

    if (w.done) {
      const p = Math.min(1, this.ending / 0.55);
      const ease = 1 - (1 - p) * (1 - p) * (1 - p);
      g.fillStyle(0x242b32, ease * 0.24).fillRoundedRect(24, 112, 372, 538, 20);
      const by = 380 + (1 - ease) * 14;
      g.fillStyle(0xfffdf5, ease * 0.96).fillRoundedRect(82, by - 32, 256, 64, 18);
      g.lineStyle(3, 0x242b32, ease).strokeRoundedRect(82, by - 32, 256, 64, 18);
      this.text("gameover", 210, by - 10, "GAME OVER", 17, "#c4453f", ease);
      this.text(
        "gameover-sub",
        210,
        by + 12,
        `${this.crashBanner || "OUT OF HEARTS"} · LEVEL ${w.level}`,
        10,
        "#5d6869",
        ease,
      );
    } else {
      this.text("gameover", 210, -100, "", 17, "#242b32", 0);
      this.text("gameover-sub", 210, -100, "", 10, "#5d6869", 0);
    }
  }

  protected state() {
    return {
      score: this.w.score,
      done: this.w.done,
      detail: "",
      lives: this.w.lives,
      maxLives: 3,
      result: `Reached Level ${this.w.level}.`,
    };
  }

  snapshot() {
    return {
      ...this.state(),
      started: this.started,
      difficulty: this.difficulty,
      x: this.w.x,
      y: this.w.y,
      vx: this.w.vx,
      level: this.w.level,
      gap: this.w.gap,
      rings: this.w.rings,
      lives: this.w.lives,
      wind: this.w.wind,
      windRatio: this.w.windRatio,
    };
  }
}
