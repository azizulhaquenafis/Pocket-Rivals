import { MatchRandom, mixSeed, freshSeed } from "../../shared/ai/MatchRandom";
import type Phaser from "phaser";
import type { GameContext, MiniGame } from "../../shared/contracts/GameModule";
import { theme } from "../../core/ThemeManager";
import { rounded } from "../../shared/components/drawing";
import { bladeTip, swordPose, SWING_IMPACT } from "./SwordMotion";
import { FruitMatch, isFruit } from "./Rules";
import { FruitAI } from "./AI";
import { fruit, half, sword } from "./FruitArt";

const JUICE_COLORS: ReadonlyArray<[number, number]> = [
  [0xf0655c, 0xfff2c6], // Apple
  [0xf5973b, 0xffe08a], // Orange
  [0xef5d5d, 0x78bc6b], // Watermelon
  [0xf7cf4c, 0xfff7cc], // Banana
  [0xd14c6b, 0xff94ad], // Pomegranate
  [0xefc04a, 0xfff3a1], // Pineapple
  [0xef5a67, 0xffb8c2], // Strawberry
];

export class FruitGame implements MiniGame {
  private ctx!: GameContext;
  private m = new FruitMatch();
  private ai?: FruitAI;
  private g!: Phaser.GameObjects.Graphics;
  private paused = false;
  private round = 0;
  private done = 0;
  private reported = false;
  private seen = [0, 0];
  private swing = [1, 1];
  private cutAge = 2;
  private cutSound = false;
  private tieSound = false;
  private decoyClankSound = [false, false];
  private revealAge = 0;
  private version = -1;
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    this.g = ctx.scene.add.graphics();
    if (ctx.options.mode === "ai") {
      this.ai = new FruitAI(ctx.options.difficulty);
    }
    const intenseCadence =
      !this.ai || ctx.options.difficulty === "impossible";
    this.m = new FruitMatch(
      new MatchRandom(mixSeed(this.ai?.personality.seed ?? freshSeed(), 42))
        .next,
      intenseCadence
        ? { fruitChance: 0.28, activeMin: 0.72, activeSpan: 0.28 }
        : undefined,
    );
    ctx.input.tap((x, y) => {
      if (x > 24 && x < 396 && y > 112 && y < 650) {
        // In 1-Player mode, tapping anywhere on the arena (including directly on the fruit) slices!
        this.tap(this.ai ? 0 : y < 381 ? 1 : 0);
      }
    });
    ctx.input.press(
      [
        "Space",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Enter",
        "KeyW",
        "KeyA",
        "KeyS",
        "KeyD",
      ],
      (code) => {
        if (code === "Space" || code.startsWith("Arrow")) this.tap(0);
        else if (code === "Enter") this.tap(1);
        else this.tap(this.ai ? 0 : 1);
      },
    );
    ctx.setScore(0, 0);
    ctx.setHint("");
    ctx.audio.play("start");
  }
  private tap(p: 0 | 1) {
    if (!this.paused && !this.reported && !(p === 1 && this.ai)) this.m.tap(p);
  }
  update(dt: number) {
    if (this.paused || this.reported) return;
    this.m.update(dt);
    this.ai?.update(this.m);
    if (this.version !== this.m.version) {
      this.version = this.m.version;
      this.revealAge = 0;
    }
    this.revealAge += dt;
    for (const p of [0, 1] as const) {
      if (this.seen[p] !== this.m.attemptSerial[p]) {
        this.seen[p] = this.m.attemptSerial[p];
        this.swing[p] = 0;
        this.decoyClankSound[p] = false;
        this.ctx.audio.play(this.m.missed[p] ? "thud" : "shoot");
      }
      const age = this.m.time - this.m.swingStartedAt[p];
      this.swing[p] = Math.min(1, age / this.m.recoveryDuration[p]);
      if (
        this.m.hitDecoy[p] &&
        !this.decoyClankSound[p] &&
        age >= SWING_IMPACT &&
        age < 0.4
      ) {
        this.decoyClankSound[p] = true;
        this.ctx.audio.play("hit", 0.7);
      }
    }
    if (this.round !== this.m.round) {
      this.round = this.m.round;
      this.ctx.setScore(...this.m.scores);
      this.cutSound = false;
      this.tieSound = false;
      if (this.m.capturedBy !== null) {
        this.ctx.audio.play("capture", 0.65);
      }
    }
    // Sync cutAge directly to the winning sword's swing clock so fruit splits at exact blade impact!
    if (this.m.capturedBy !== null) {
      this.cutAge = this.m.time - this.m.swingStartedAt[this.m.capturedBy];
    } else {
      this.cutAge += dt;
    }

    const g = this.g;
    g.clear();
    rounded(g, 24, 112, 372, 538, 20, 0xc5a5ce, 4);

    // Subtle board-center line & pedestal ring so tap halves & target zone read cleanly
    if (!this.ai) {
      g.lineStyle(2, 0xffffff, 0.18).lineBetween(42, 381, 378, 381);
    }
    g.fillStyle(0xffffff, 0.1).fillCircle(210, 381, 56);
    g.lineStyle(2, 0xffffff, 0.34).strokeCircle(210, 381, 46);

    const slicing =
      this.m.capturedBy !== null &&
      (this.m.phase === "between" || this.m.phase === "done");
    const tieClash =
      this.m.capturedBy === null &&
      this.m.phase === "between" &&
      this.m.current >= 0;

    if (slicing && !this.cutSound && this.cutAge >= SWING_IMPACT) {
      this.cutSound = true;
      this.ctx.audio.play("slice");
    }
    if (tieClash && !this.tieSound && this.m.time - this.m.tieAt >= SWING_IMPACT - 0.01) {
      this.tieSound = true;
      this.ctx.audio.play("hit", 0.9);
    }

    if (slicing && this.cutAge < SWING_IMPACT) {
      g.fillStyle(0x51465c, 0.12).fillEllipse(215, 398, 100, 78);
      fruit(g, this.m.capturedKind, 210, 381, 49);
    } else if (slicing) {
      const t = Math.min(0.85, Math.max(0, this.cutAge - SWING_IMPACT)),
        p = this.m.capturedBy!,
        slashTilt = -0.26; // Matches the curved forehand blade tangent across center (210, 381)
      const cutRot = Math.PI / 2 + slashTilt;
      const nx = -Math.sin(slashTilt),
        ny = Math.cos(slashTilt);
      for (const left of [true, false]) {
        // Rotating by +PI/2 maps left (-X) to the upper half (-ny) and right (+X) to the lower half (+ny)
        const side = left ? -1 : 1;
        half(
          g,
          this.m.capturedKind,
          210 + (nx * side * 125 + (p === 0 ? -1 : 1) * side * 18) * t,
          381 + ny * side * 125 * t - 28 * t + 160 * t * t,
          48,
          left,
          cutRot + side * t * 0.9,
        );
      }
      if (t < 0.6) {
        const [c1, c2] = JUICE_COLORS[this.m.capturedKind] ?? [
          0xffda85, 0xf08d86,
        ];
        for (let i = 0; i < 10; i++) {
          const a = (i * Math.PI * 2) / 10 + (p === 0 ? 0.2 : -0.2);
          const speed = 95 + (i % 3) * 35;
          g.fillStyle(i % 2 ? c1 : c2, 1 - t / 0.6).fillCircle(
            210 + Math.cos(a) * t * speed,
            381 + Math.sin(a) * t * speed * 0.8 + 115 * t * t,
            i % 2 ? 4.5 : 3.2,
          );
        }
      }
    } else if (this.m.current >= 0) {
      const scale = Math.min(1, this.revealAge / 0.16);
      g.fillStyle(0x51465c, 0.12).fillEllipse(
        215,
        398,
        100 * scale,
        78 * scale,
      );
      const clankAge = Math.min(
        ...([0, 1] as const).map((p) =>
          this.m.hitDecoy[p]
            ? this.m.time - this.m.swingStartedAt[p] - SWING_IMPACT
            : 99,
        ),
      );
      const decoyShaking = clankAge >= 0 && clankAge < 0.42;
      const tieShaking = tieClash && this.m.time - this.m.tieAt < 0.45;
      g.save();
      g.translateCanvas(210, 381);
      g.rotateCanvas(
        decoyShaking || tieShaking
          ? Math.sin(this.m.time * 48) * 0.16
          : Math.sin(this.revealAge * 0.8) * 0.06,
      );
      fruit(g, this.m.current, 0, 0, 49 * scale);
      g.restore();

      // Crisp metallic clank spark burst when a sword bounces off a decoy!
      if (clankAge >= 0 && clankAge < 0.24) {
        const u = clankAge / 0.24;
        const alpha = 1 - u;
        g.lineStyle(3.5, 0xfff6d6, alpha);
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3 + 0.25;
          g.lineBetween(
            210 + Math.cos(a) * (16 + u * 24),
            381 + Math.sin(a) * (16 + u * 24),
            210 + Math.cos(a) * (32 + u * 44),
            381 + Math.sin(a) * (32 + u * 44),
          );
        }
      }

      // Bright sword-clash starburst on a simultaneous tie!
      if (tieClash) {
        const ta = this.m.time - this.m.tieAt - SWING_IMPACT;
        if (ta >= 0 && ta < 0.35) {
          const u = ta / 0.35;
          const alpha = 1 - u;
          g.fillStyle(0xfff5be, alpha * 0.85).fillCircle(
            210,
            381,
            26 * (1 - u * 0.4),
          );
          g.lineStyle(4, 0xfffdf5, alpha);
          for (let i = 0; i < 8; i++) {
            const a = (i * Math.PI) / 4;
            g.lineBetween(
              210 + Math.cos(a) * (12 + u * 20),
              381 + Math.sin(a) * (12 + u * 20),
              210 + Math.cos(a) * (38 + u * 54),
              381 + Math.sin(a) * (38 + u * 54),
            );
          }
        }
      }
    }

    // Draw sword swing trail ribbons, swords & visible cooldown recovery arcs
    for (const p of [0, 1] as const) {
      const age = this.m.time - this.m.swingStartedAt[p];
      const dur = this.m.recoveryDuration[p];
      const recoil = this.m.hitDecoy[p];
      const color = p === 0 ? theme.orange : theme.blue;
      const pose = swordPose(p, this.m.attemptSerial[p], age, dur, recoil);

      // Curved sweeping blade slash ribbon following the ACTUAL tip trajectory!
      if (!recoil && this.m.attemptSerial[p] > 0 && age >= 0.06 && age < 0.36) {
        const trailAlpha = Math.max(0, 1 - (age - 0.06) / 0.3) * 0.82;
        const tStart = Math.max(0.045, age - 0.14);
        const tEnd = Math.min(0.25, age);
        if (tEnd > tStart) {
          const pts = Array.from({ length: 10 }, (_, i) => {
            const sampleAge = tStart + ((tEnd - tStart) * i) / 9;
            return bladeTip(
              swordPose(p, this.m.attemptSerial[p], sampleAge, dur, false),
            );
          });
          g.lineStyle(12, color, trailAlpha * 0.45).strokePoints(pts, false);
          g.lineStyle(5, 0xfffdf5, trailAlpha).strokePoints(pts, false);
        }
      }

      const stunned = this.m.missed[p] && this.swing[p] < 1;
      sword(g, pose.x, pose.y, pose.angle, color, stunned);

      // Clean edge recovery progress bar along the player's arena border (keeps sword handle uncluttered!)
      if (stunned) {
        const remaining = 1 - this.swing[p];
        const barW = 148 * remaining;
        const barY = p === 0 ? 635 : 119;
        g.fillStyle(0x242b32, 0.24).fillRoundedRect(136, barY, 148, 8, 4);
        if (barW > 4) {
          g.fillStyle(color, 0.96).fillRoundedRect(
            210 - barW / 2,
            barY,
            barW,
            8,
            4,
          );
          g.fillStyle(0xfffdf5, 0.35).fillRoundedRect(
            210 - barW / 2 + 2,
            barY + 1.5,
            Math.max(0, barW - 4),
            2.2,
            1,
          );
        }
        g.lineStyle(1.8, 0x242b32, 0.7).strokeRoundedRect(136, barY, 148, 8, 4);
      }
    }

    if (this.m.phase === "show") this.m.present();
    if (this.m.winner) {
      this.done += dt;
      if (this.done > 0.9) {
        this.reported = true;
        this.ctx.finish({ winner: this.m.winner, scores: this.m.scores });
      }
    }
  }
  pause() {
    this.paused = true;
  }
  resume() {
    this.paused = false;
  }
  dispose() {
    this.reported = true;
    this.g.destroy();
  }
  snapshot() {
    return {
      ai: this.ai?.snapshot(),
      phase: this.m.phase,
      target: this.m.target,
      current: this.m.current,
      isFruit: isFruit(this.m.current),
      time: this.m.time,
      round: this.m.round,
      scores: [...this.m.scores],
      winner: this.m.winner,
      cooldowns: this.m.blockedUntil.map((t) => Math.max(0, t - this.m.time)),
      attempts: [...this.m.attemptSerial],
      swings: [...this.swing],
      swordPoses: ([0, 1] as const).map((p) =>
        swordPose(
          p,
          this.m.attemptSerial[p],
          this.m.time - this.m.swingStartedAt[p],
          this.m.recoveryDuration[p],
          this.m.hitDecoy[p],
        ),
      ),
      cutAge: this.cutAge,
      capturedBy: this.m.capturedBy,
    };
  }
}
