import type { Difficulty } from "../../shared/contracts/AIController";
import { ArcadeGame } from "../../shared/arcade/ArcadeGame";
import { circle } from "../../shared/components/drawing";
import { OrbitWorld } from "./Rules";
import { PLANET_CLASSES, PLANET_GUIDE, planetSpec } from "./Planets";
import { drawPlanetBody, drawPlanetHalo } from "./PlanetArt";

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  r: number;
  color: number;
}

interface Drift {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  duration: number;
  final: boolean;
}

export class Game extends ArcadeGame {
  private w = new OrbitWorld();
  protected override endDelay = 1.15;
  protected override autoScoreSound = false;
  protected challenge = {
    title: "Orbit Hop",
    guideTitle: "How to play & planet guide",
    instructions:
      "Tap, Space or Enter to launch tangentially from orbit. Enter a planet's outer halo so its gravity curves your flight onto the surface. Across 25 planet types, larger volume creates a bigger target and wider halo, while higher density creates stronger pull. Three hearts.",
    guide: PLANET_GUIDE,
    tiers: [
      "Wide gravity fields, relaxed orbits and a smooth curved flight guide.",
      "Smaller planets, longer leaps and a short launch arrow.",
      "Distant tiny planets, tight gravity fields and no aim guide.",
    ] as const,
  };
  protected configure(tier: Difficulty) {
    this.w = new OrbitWorld(Math.random, tier);
    this.trail.length = 0;
    this.sparks.length = 0;
    this.drift = null;
    this.shake = 0;
    this.landingAge = 1;
  }
  private landingAge = 1;
  private shake = 0;
  private trail: { x: number; y: number }[] = [];
  private sparks: Spark[] = [];
  private drift: Drift | null = null;

  protected bind() {
    const go = () => {
      if (this.w.launch()) this.ctx.audio.play("shoot", 0.5);
    };
    this.tap(go);
    this.press(["Space", "Enter"], go);
  }

  private spawnMiss(final: boolean) {
    const m = this.w.lastMiss;
    if (!m) return;
    const vx = Math.abs(m.vx) + Math.abs(m.vy) > 10 ? m.vx : 0;
    const vy = Math.abs(m.vx) + Math.abs(m.vy) > 10 ? m.vy : -80;
    this.drift = {
      x: m.x,
      y: m.y + this.w.camera,
      vx: vx * 0.55,
      vy: vy * 0.55,
      age: 0,
      duration: final ? 0.95 : 0.65,
      final,
    };
    this.shake = final ? 0.28 : 0.18;
    const count = final ? 14 : 10;
    this.sparks.length = 0;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + (final ? 0.2 : 0.1);
      const spd = (final ? 75 : 55) + (i % 3) * 26;
      this.sparks.push({
        x: Math.max(36, Math.min(384, m.x)),
        y: Math.max(124, Math.min(640, m.y + this.w.camera)),
        vx: Math.cos(a) * spd - vx * 0.12,
        vy: Math.sin(a) * spd - vy * 0.12,
        age: 0,
        life: final ? 0.72 + (i % 3) * 0.12 : 0.45 + (i % 3) * 0.08,
        r: final ? 3.2 - (i % 2) * 0.9 : 2.5 - (i % 2) * 0.6,
        color: i % 3 === 0 ? 0xf49b58 : i % 3 === 1 ? 0xfffdf5 : 0xb99ce0,
      });
    }
  }

  private advanceEffects(dt: number) {
    this.shake = Math.max(0, this.shake - dt);
    if (this.drift) {
      this.drift.age += dt;
      const drag = Math.exp(-3.4 * dt);
      this.drift.vx *= drag;
      this.drift.vy *= drag;
      this.drift.x += this.drift.vx * dt;
      this.drift.y += this.drift.vy * dt;
      if (this.drift.age >= this.drift.duration) this.drift = null;
    }
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.age += dt;
      const drag = Math.exp(-3.2 * dt);
      s.vx *= drag;
      s.vy *= drag;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.age >= s.life) this.sparks.splice(i, 1);
    }
  }

  protected step(dt: number) {
    const lives = this.w.lives;
    const wasOrbiting = this.w.orbit;
    const highest = this.w.highest;
    this.w.step(dt);
    this.landingAge += dt;
    this.advanceEffects(dt);
    if (!wasOrbiting && this.w.orbit && this.w.lives === lives) {
      this.landingAge = 0;
      const advanced = this.w.highest > highest;
      this.ctx.audio.play(
        advanced ? "perfect" : "capture",
        advanced ? 0.75 : 0.55,
      );
    }
    if (!this.w.orbit && !this.w.done) {
      this.trail.push({ x: this.w.ball.x, y: this.w.ball.y });
      if (this.trail.length > 20) this.trail.shift();
    } else if (this.w.orbit) {
      this.trail.length = 0;
    }
    if (this.w.lives < lives) {
      this.spawnMiss(this.w.done);
      this.ctx.audio.play(this.w.done ? "fail" : "fall");
    }
  }

  protected override stepEnding(dt: number) {
    this.advanceEffects(dt);
    // Smoothly settle camera and drain trail so Game Over glides instead of freezing.
    const target = Math.max(0, 540 - this.w.planet.y);
    this.w.camera += (target - this.w.camera) * (1 - Math.exp(-4.5 * dt));
    if (
      this.trail.length > 0 &&
      Math.floor(this.ending * 38) > Math.floor((this.ending - dt) * 38)
    ) {
      this.trail.shift();
    }
  }

  protected draw() {
    const w = this.w,
      g = this.g;
    const sx =
      this.shake > 0
        ? Math.sin(this.age * 78) * (this.shake / 0.28) * 2.5
        : 0;
    const sy =
      this.shake > 0
        ? Math.cos(this.age * 64) * (this.shake / 0.28) * 2.0
        : 0;

    this.board(0xe5ddf0);
    g.fillStyle(0xc7b8df, 0.3).fillEllipse(315 + sx * 0.4, 265 + sy * 0.4, 290, 190);
    g.fillStyle(0xffffff, 0.72);
    for (let i = 0; i < 25; i++)
      g.fillCircle(
        42 + ((i * 79) % 330) + sx * 0.3,
        155 + ((i * 117 + w.camera * 0.15) % 460) + sy * 0.3,
        i % 3 === 0 ? 2 : 1,
      );

    for (const p of w.planets) {
      const y = p.y + w.camera + sy;
      const px = p.x + sx;
      const field = w.fieldRadius(p);
      if (y + field < 112 || y - field > 650) continue;
      const next = p.id === w.highest + 1;
      drawPlanetHalo(g, p, px, y, field, next, this.age);

      if (p.id === w.current && this.landingAge < 0.7) {
        const t = this.landingAge / 0.7;
        g.lineStyle(3, 0xffffff, (1 - t) * 0.8).strokeCircle(
          px,
          y,
          p.r + 9 + t * 26,
        );
      }
      if (next && this.difficulty === "medium")
        g.lineStyle(2, 0xffffff, 0.65).strokeCircle(
          px,
          y,
          p.r + 13 + Math.sin(this.age * 3) * 2,
        );
      drawPlanetBody(g, p, px, y, this.age);
    }

    // Smooth flight trail (drains and fades gently on Game Over).
    const trailFade = w.done ? Math.max(0, 1 - this.ending / 0.55) : 1;
    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i];
      const frac = (i + 1) / this.trail.length;
      g.fillStyle(0xffffff, frac * 0.45 * trailFade).fillCircle(
        p.x + sx,
        p.y + w.camera + sy,
        4.2 * frac,
      );
    }

    // Sub-step interpolated orbit pose keeps both ball and dotted guide silky smooth at 60/120/144 Hz.
    const interp =
      this.started && !this.paused && !w.done ? this.alpha / 120 : 0;
    const renderAngle = w.orbit ? w.angle - w.tuning.orbit * interp : w.angle;
    const home = w.planet;
    const bx = w.orbit
      ? home.x + Math.cos(renderAngle) * (home.r + 8)
      : w.ball.x + w.ball.vx * interp;
    const by = w.orbit
      ? home.y + Math.sin(renderAngle) * (home.r + 8)
      : w.ball.y + w.ball.vy * interp;

    // Smooth native-FPS dotted flight preview in Medium (Easy) mode — zero 80ms stutter.
    if (w.orbit && !w.grace && !w.done && this.difficulty === "medium") {
      const dots = w.preview(renderAngle);
      const len = dots.length;
      for (let i = 0; i < len; i++) {
        const pt = dots[i];
        const t = i / Math.max(1, len);
        const r = 2.6 - t * 1.1;
        const a = (0.58 - t * 0.42);
        g.fillStyle(0xfffdf5, a * 0.7).fillCircle(
          pt.x + sx,
          pt.y + w.camera + sy,
          r + 1.1,
        );
        g.fillStyle(0x242b32, a).fillCircle(pt.x + sx, pt.y + w.camera + sy, r);
      }
    }

    const screenY = by + w.camera + sy;
    if (w.orbit && !w.done && this.difficulty === "hard") {
      g.lineStyle(3, 0x242b32, 0.55).lineBetween(
        bx + sx,
        screenY,
        bx + sx + Math.sin(renderAngle) * 38,
        screenY - Math.cos(renderAngle) * 38,
      );
    }

    // Smooth respawn reform ring during grace window.
    if (w.grace && !w.done) {
      const t = 1 - w.grace / 0.45;
      const ease = 1 - (1 - t) * (1 - t);
      g.lineStyle(3, 0xffffff, (1 - ease) * 0.85).strokeCircle(
        bx + sx,
        screenY,
        24 - ease * 15,
      );
      circle(g, bx + sx, screenY, 3 + ease * 4, 0xfffdf5, 2);
    } else if (!w.done) {
      circle(g, bx + sx, screenY, 7, 0xfffdf5, 2);
    }

    // Smooth miss drift & stardust dissolution (both regular miss and Game Over).
    if (this.drift) {
      const t = Math.min(1, this.drift.age / this.drift.duration);
      const alpha = Math.max(0, 1 - t * t);
      const r = Math.max(1.2, 7 * (1 - t * 0.72));
      g.lineStyle(2.5, 0xf49b58, alpha * 0.75).strokeCircle(
        this.drift.x,
        this.drift.y,
        8 + t * (this.drift.final ? 34 : 22),
      );
      g.fillStyle(0xfffdf5, alpha).fillCircle(this.drift.x, this.drift.y, r);
      g.lineStyle(2, 0x242b32, alpha).strokeCircle(
        this.drift.x,
        this.drift.y,
        r,
      );
    }
    for (const s of this.sparks) {
      const t = Math.min(1, s.age / s.life);
      g.fillStyle(s.color, (1 - t) * 0.9).fillCircle(
        s.x,
        s.y,
        Math.max(0.8, s.r * (1 - t * 0.5)),
      );
    }

    // Smooth Game Over dim veil & graceful banner before result modal opens.
    if (w.done) {
      const p = Math.min(1, this.ending / 0.55);
      const ease = 1 - (1 - p) * (1 - p) * (1 - p);
      g.fillStyle(0x242b32, ease * 0.22).fillRoundedRect(24, 112, 372, 538, 20);
      const bannerY = 382 + (1 - ease) * 14;
      g.fillStyle(0xfffdf5, ease * 0.95).fillRoundedRect(
        86,
        bannerY - 26,
        248,
        52,
        18,
      );
      g.lineStyle(3, 0x242b32, ease).strokeRoundedRect(
        86,
        bannerY - 26,
        248,
        52,
        18,
      );
      this.text(
        "gameover",
        210,
        bannerY - 7,
        "OUT OF ORBIT",
        16,
        "#242b32",
        ease,
      );
      this.text(
        "gameover-sub",
        210,
        bannerY + 12,
        `REACHED PLANET ${w.highest + 1}`,
        10,
        "#697474",
        ease,
      );
    } else {
      this.text("gameover", 210, -100, "", 16, "#242b32", 0);
      this.text("gameover-sub", 210, -100, "", 10, "#697474", 0);
    }

    // Top HUD pills: current planet counter + upcoming planet type & gravity class.
    g.fillStyle(0xfffdf5, 0.92).fillRoundedRect(37, 122, 86, 25, 12);
    g.lineStyle(1.5, 0x242b32, 0.25).strokeRoundedRect(37, 122, 86, 25, 12);
    this.text("status", 80, 134, `PLANET ${w.highest + 1}`, 11);

    const upcoming = w.nextPlanet ?? w.planet;
    const spec = planetSpec(upcoming.type);
    const cls = PLANET_CLASSES[upcoming.kind ?? "terran"];
    g.fillStyle(0xfffdf5, 0.92).fillRoundedRect(184, 122, 200, 25, 12);
    g.lineStyle(1.5, 0x242b32, 0.25).strokeRoundedRect(184, 122, 200, 25, 12);
    circle(g, 198, 134.5, 5, spec.color, 1.5);
    this.text(
      "planet-info",
      292,
      134,
      `${spec.name.toUpperCase()} · ${cls.badge}`,
      10,
      "#242b32",
    );
  }

  protected state() {
    return {
      score: this.w.score,
      done: this.w.done,
      detail: "",
      lives: this.w.lives,
      maxLives: 3,
      result: `Reached planet ${this.w.highest + 1}.`,
    };
  }

  snapshot() {
    return {
      ...this.state(),
      started: this.started,
      difficulty: this.difficulty,
      lives: this.w.lives,
      camera: this.w.camera,
      orbit: this.w.orbit,
      angle: this.w.angle,
      ball: { ...this.w.ball },
      planets: this.w.planets,
      current: this.w.current,
      gravityFields: this.w.planets.map((p) => ({
        id: p.id,
        radius: this.w.fieldRadius(p),
        pull: this.w.planetPull(p),
        type: p.type,
        kind: p.kind,
      })),
      highest: this.w.highest,
    };
  }
}
