import type Phaser from "phaser";
import type { MiniGame, GameContext } from "../../shared/contracts/GameModule";
import { FixedStep } from "../../shared/physics/FixedStep";
import { MatchRandom, freshSeed } from "../../shared/ai/MatchRandom";
import { WorkerTask } from "../../shared/utilities/WorkerTask";
import { label } from "../../shared/components/drawing";
import { PenMatch, previewFlick, shotFromPull } from "./PenRules";
import { HALF, touchDistance, type Pen, type Shot } from "./PenPhysics";
import { drawDesk, type Aim } from "./PenArt";
import { fallbackShot, type Plan, type PlanInput } from "./PenAI";
export class PenGame implements MiniGame {
  private ctx!: GameContext;
  private match = new PenMatch();
  private g!: Phaser.GameObjects.Graphics;
  private clip!: Phaser.GameObjects.Graphics;
  private mask!: Phaser.Display.Masks.GeometryMask;
  private title!: Phaser.GameObjects.Text;
  private status!: Phaser.GameObjects.Text;
  private fixed = new FixedStep();
  private random!: MatchRandom;
  private worker?: WorkerTask<PlanInput, Plan>;
  private pending = false;
  private planned: Shot | null = null;
  private candidates = 0;
  private lastAI = { wait: 0, delay: 0, candidates: 0 };
  private generation = 0;
  private paused = false;
  private disposed = false;
  private reported = false;
  private aim: Aim | null = null;
  private grab: { x: number; y: number } | null = null;
  private wait = 0;
  private delay = 0;
  private serial = -1;
  private fallAge = 0;
  private endAge = 0;
  private previous!: [Pen, Pen];
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    this.random = new MatchRandom(freshSeed());
    this.g = ctx.scene.add.graphics();
    this.clip = ctx.scene.make.graphics({ x: 0, y: 0 });
    this.clip.fillStyle(0xffffff).fillRoundedRect(22, 110, 376, 542, 22);
    this.mask = this.clip.createGeometryMask();
    this.g.setMask(this.mask);
    this.title = label(ctx.scene, 210, 145, "ROUND 1", 12);
    this.status = label(ctx.scene, 210, 637, "", 12);
    this.previous = this.match.bodies.map((p) => ({ ...p })) as [Pen, Pen];
    if (ctx.options.mode === "ai")
      this.worker = new WorkerTask(
        () =>
          new Worker(new URL("./ai.worker.ts", import.meta.url), {
            type: "module",
          }),
        ctx.reportAI,
      );
    ctx.input.drag(
      (x, y) => {
        const m = this.match,
          p = m.bodies[m.turn];
        if (
          this.paused ||
          m.phase !== "aim" ||
          (this.worker && m.turn === 1) ||
          touchDistance(p, x, y) > 24
        )
          return false;
        const offset = Math.max(
          -HALF,
          Math.min(HALF, (x - p.x) * Math.cos(p.a) + (y - p.y) * Math.sin(p.a)),
        );
        this.grab = { x, y };
        this.aim = {
          x: p.x + offset * Math.cos(p.a),
          y: p.y + offset * Math.sin(p.a),
          dx: 0,
          dy: 0,
          offset,
        };
        return true;
      },
      (x, y) => {
        if (this.aim && this.grab) {
          this.aim.dx = this.grab.x - x;
          this.aim.dy = this.grab.y - y;
          this.aim.path = undefined;
        }
      },
      (x, y) => {
        const a = this.aim,
          grab = this.grab;
        this.aim = null;
        this.grab = null;
        if (!a || !grab || this.paused) return;
        const shot = shotFromPull(grab.x - x, grab.y - y, a.offset);
        if (shot) this.shoot(shot);
      },
      () => {
        this.aim = null;
        this.grab = null;
      },
      { outside: true },
    );
    ctx.setHint("");
    ctx.setScore(0, 0);
    this.draw();
  }
  private shoot(shot: Shot) {
    if (this.worker && this.match.turn === 1)
      this.lastAI = {
        wait: this.wait,
        delay: this.delay,
        candidates: this.candidates,
      };
    if (this.match.shoot(this.match.turn, shot)) {
      this.ctx.audio.play("shoot", 0.4);
      this.aim = null;
      this.planned = null;
    }
  }
  private think() {
    const m = this.match;
    if (
      !this.worker ||
      m.phase !== "aim" ||
      m.turn !== 1 ||
      this.planned ||
      this.pending
    )
      return;
    const token = this.generation,
      serial = m.serial;
    this.pending = true;
    void this.worker
      .run({
        bodies: m.bodies.map((p) => ({ ...p })),
        difficulty: this.ctx.options.difficulty,
        seed: this.random.turnSeed(serial),
        completed: m.shots,
      })
      .then((result) => {
        if (
          token !== this.generation ||
          this.disposed ||
          this.paused ||
          m.serial !== serial
        )
          return;
        this.pending = false;
        this.candidates = result?.candidates ?? 0;
        this.planned = result?.shot ?? fallbackShot(m.bodies, 1, m.shots);
      });
  }
  update(dt: number) {
    if (this.paused || this.disposed || this.reported) return;
    const m = this.match,
      impact = m.impacts,
      round = m.round;
    m.advanceClock(dt);
    const seconds = Math.ceil(m.remaining);
    this.ctx.setClock(
      `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`,
      seconds <= 10,
    );
    this.fixed.advance(dt, (h) => {
      this.previous = m.bodies.map((p) => ({ ...p })) as [Pen, Pen];
      m.step(h);
    });
    if (m.serial !== this.serial) {
      this.serial = m.serial;
      this.wait = 0;
      this.delay =
        { medium: 1.0, hard: 0.78, impossible: 0.6 }[
          this.ctx.options.difficulty
        ] +
        this.random.next() * 0.35;
    }
    if (this.worker && m.phase === "aim" && m.turn === 1) {
      this.wait += Math.min(dt, 0.1);
      this.think();
      if (this.planned && this.wait >= this.delay) this.shoot(this.planned);
    }
    if (m.impacts !== impact) this.ctx.audio.play("hit", 0.5);
    if (round !== m.round) {
      this.ctx.audio.play("start");
      this.previous = m.bodies.map((p) => ({ ...p })) as [Pen, Pen];
    }
    this.fallAge = m.bodies.some((p) => p.out)
      ? this.fallAge + Math.min(dt, 0.1)
      : 0;
    this.ctx.setScore(...m.scores);
    this.draw();
    if (m.winner !== null) {
      if (this.pending) {
        this.worker?.cancel();
        this.pending = false;
      }
      this.aim = null;
      this.grab = null;
      this.endAge += Math.min(dt, 0.1);
      if (this.endAge > 0.9) {
        this.reported = true;
        this.ctx.audio.play("win");
        this.ctx.finish({ winner: m.winner, scores: m.scores });
      }
    }
  }
  private draw() {
    const m = this.match,
      t = this.fixed.fraction;
    const bodies = m.bodies.map((p, i) => ({
      ...p,
      x: this.previous[i].x + (p.x - this.previous[i].x) * t,
      y: this.previous[i].y + (p.y - this.previous[i].y) * t,
      a: this.previous[i].a + (p.a - this.previous[i].a) * t,
    }));
    if (this.aim && !this.aim.path) {
      const shot = shotFromPull(this.aim.dx, this.aim.dy, this.aim.offset);
      this.aim.path = shot ? previewFlick(m.bodies, m.turn, shot, m.shots) : [];
    }
    drawDesk(this.g, m, bodies, this.aim, this.fallAge);
    const title = `ROUND ${m.round} · FIRST TO 3`;
    const status = this.statusText();
    if (this.title.text !== title) this.title.setText(title);
    if (this.status.text !== status) this.status.setText(status);
  }

  private statusText() {
    const m = this.match;
    const player = m.turn === 0 ? "ORANGE" : this.worker ? "AI" : "BLUE";
    if (m.phase === "between" || m.phase === "done") {
      if (m.winner === "draw") return "MATCH DRAW";
      if (m.roundWinner === "draw")
        return m.roundReason === "double-out"
          ? "DOUBLE OUT · REPLAY"
          : "EVEN ROUND · REPLAY";
      const winner = m.roundWinner ?? (m.winner === 1 ? 0 : 1);
      const color = winner === 0 ? "ORANGE" : "BLUE";
      if (m.roundReason === "pressure") return `${color} WINS ON PRESSURE`;
      if (m.roundReason === "smaller-desk")
        return `EDGE CLOSES · ${color} WINS`;
      return `${color} TAKES IT`;
    }
    const shrink = m.nextShrink;
    if (shrink && shrink.inFlicks <= 2)
      return `EDGE CLOSES IN ${shrink.inFlicks} ${shrink.inFlicks === 1 ? "FLICK" : "FLICKS"}`;
    if (m.phase === "moving") return "SETTLING";
    if (m.shots < 2) return `${player} · OPENING FLICK`;
    if (m.flicksLeft <= 4)
      return `${player} · PRESSURE ${Math.round(m.pressure[0])}–${Math.round(m.pressure[1])}`;
    return `${player} TO FLICK`;
  }

  pause() {
    this.paused = true;
    this.aim = null;
    this.grab = null;
    this.generation++;
    this.worker?.cancel();
    this.pending = false;
    this.planned = null;
    this.wait = 0;
    this.fixed.reset();
  }
  resume() {
    this.paused = false;
    this.fixed.reset();
  }
  dispose() {
    this.disposed = true;
    this.pause();
    this.g.destroy();
    this.mask.destroy();
    this.clip.destroy();
    this.title.destroy();
    this.status.destroy();
  }
  snapshot() {
    return {
      ...this.match.snapshot(),
      aim: this.aim ? { ...this.aim } : null,
      ai: this.worker
        ? {
            ...this.random.snapshot(),
            pending: this.pending,
            wait: this.wait,
            delay: this.delay,
            last: { ...this.lastAI },
          }
        : null,
    };
  }
}
