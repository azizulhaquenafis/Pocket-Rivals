import type Phaser from "phaser";
import type { GameContext, MiniGame } from "../../shared/contracts/GameModule";
import { theme } from "../../core/ThemeManager";
import { rounded, circle, label } from "../../shared/components/drawing";
import { FixedStep } from "../../shared/physics/FixedStep";
import { WorkerTask } from "../../shared/utilities/WorkerTask";
import { GolfMatch } from "./GolfMatch";
import { golfStep, moving, MAX_POWER } from "./GolfPhysics";
import type { GolfShot } from "./GolfAI";
import type { Course } from "./courses";
import type { GolfBall } from "./GolfPhysics";
export class MiniGolfGame implements MiniGame {
  private ctx!: GameContext;
  private match!: GolfMatch;
  private g!: Phaser.GameObjects.Graphics;
  private heading!: Phaser.GameObjects.Text;
  private caption!: Phaser.GameObjects.Text;
  private note!: Phaser.GameObjects.Text;
  private clock = new FixedStep();
  private aim: { x: number; y: number } | null = null;
  private paused = false;
  private age = 0;
  private pending = false;
  private generation = 0;
  private disposed = false;
  private reported = false;
  private ai?: WorkerTask<
    {
      course: Course;
      ball: GolfBall;
      difficulty: GameContext["options"]["difficulty"];
    },
    GolfShot
  >;
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    const count =
      ctx.options.variant === "one"
        ? 1
        : ctx.options.variant === "three"
          ? 3
          : 5;
    this.match = GolfMatch.restore(ctx.restoredState, count);
    this.g = ctx.scene.add.graphics();
    this.heading = label(ctx.scene, 210, 144, "", 21);
    this.caption = label(ctx.scene, 210, 173, "", 12);
    this.note = label(ctx.scene, 210, 627, "", 12);
    ctx.setHint("DRAG BACK FROM YOUR BALL · RELEASE TO PUTT");
    if (ctx.options.mode === "ai")
      this.ai = new WorkerTask(
        () =>
          new Worker(new URL("./ai.worker.ts", import.meta.url), {
            type: "module",
          }),
        ctx.reportAI,
      );
    ctx.input.drag(
      (x, y) => {
        if (
          this.paused ||
          this.age < 0.4 ||
          this.match.shotActive ||
          this.match.winner ||
          (this.ai && this.match.turn === 2)
        )
          return false;
        const b = this.match.ball;
        if (Math.hypot(x - 40 - b.x, y - 200 - b.y) > 42) return false;
        this.aim = { x: x - 40, y: y - 200 };
        return true;
      },
      (x, y) => {
        this.aim = { x: x - 40, y: y - 200 };
      },
      (x, y) => {
        const b = this.match.ball,
          dx = b.x - (x - 40),
          dy = b.y - (y - 200);
        this.aim = null;
        this.takeShot(
          Math.atan2(dy, dx),
          Math.min(MAX_POWER, Math.hypot(dx, dy) * 4),
        );
      },
      () => {
        this.aim = null;
      },
    );
    this.save();
  }
  private takeShot(angle: number, power: number) {
    if (this.match.takeShot(angle, power)) {
      this.ctx.audio.play("hit");
      this.age = 0;
    }
  }
  private save() {
    this.ctx.saveState(this.match.save());
  }
  update(dt: number) {
    if (this.paused) return;
    this.age += dt;
    const m = this.match;
    this.clock.advance(dt, (step) => {
      if (m.shotActive) {
        golfStep(m.ball, m.course, step, () => this.ctx.audio.play("hit"));
        if (!moving(m.ball)) {
          if (m.ball.holed) this.ctx.audio.play("goal");
          m.finishShot();
          this.age = 0;
          if (!m.winner) this.save();
        }
      }
    });
    if (
      this.ai &&
      m.turn === 2 &&
      !m.shotActive &&
      !m.winner &&
      !this.pending &&
      this.age > 0.7
    ) {
      this.pending = true;
      const generation = this.generation;
      void this.ai
        .run({
          course: m.course,
          ball: { ...m.ball },
          difficulty: this.ctx.options.difficulty,
        })
        .then((shot) => {
          if (this.disposed || generation !== this.generation) return;
          this.pending = false;
          if (!this.paused) {
            const s = shot ?? {
              angle: Math.atan2(
                m.course.hole.y - m.ball.y,
                m.course.hole.x - m.ball.x,
              ),
              power: 220,
            };
            this.takeShot(s.angle, s.power);
          }
        });
    }
    const g = this.g,
      c = m.course;
    g.clear();
    rounded(g, 24, 112, 372, 538, 20, theme.green, 4);
    rounded(g, 40, 200, 340, 400, 12, 0x93c57f, 4);
    g.lineStyle(1, 0xffffff, 0.1);
    for (let y = 220; y < 600; y += 24) g.lineBetween(44, y, 376, y);
    c.obstacles.forEach((o) => {
      rounded(g, 40 + o.x, 200 + o.y + 4, o.w, o.h, 3, 0x68976a, 0);
      rounded(g, 40 + o.x, 200 + o.y, o.w, o.h, 3, 0xe8d9b9, 3);
    });
    circle(g, 40 + c.hole.x, 200 + c.hole.y, 11, theme.ink, 0);
    g.lineStyle(2, theme.ink).lineBetween(
      40 + c.hole.x,
      200 + c.hole.y,
      40 + c.hole.x,
      173 + c.hole.y,
    );
    g.fillStyle(theme.white).fillTriangle(
      40 + c.hole.x,
      173 + c.hole.y,
      57 + c.hole.x,
      179 + c.hole.y,
      40 + c.hole.x,
      185 + c.hole.y,
    );
    const b = m.ball,
      color = m.turn === 1 ? theme.orange : theme.blue;
    if (!b.holed) {
      if (!m.shotActive) {
        g.lineStyle(2, color, 0.7).strokeCircle(40 + b.x, 200 + b.y, 15);
      }
      circle(g, 40 + b.x, 202 + b.y, 8, 0x679565, 0);
      circle(g, 40 + b.x, 200 + b.y, 7, color, 2);
      g.fillStyle(theme.white, 0.8).fillCircle(38 + b.x, 198 + b.y, 2);
    }
    if (this.aim) {
      const dx = b.x - this.aim.x,
        dy = b.y - this.aim.y,
        d = Math.hypot(dx, dy),
        power = Math.min(1, (d * 4) / MAX_POWER),
        length = 20 + 80 * power;
      if (d > 0) {
        g.lineStyle(3, theme.white, 0.9).lineBetween(
          40 + b.x,
          200 + b.y,
          40 + b.x + (dx / d) * length,
          200 + b.y + (dy / d) * length,
        );
        for (let i = 1; i <= 5; i++)
          g.fillStyle(
            i <= power * 5 ? theme.orange : theme.white,
            0.9,
          ).fillRoundedRect(159 + i * 16, 614, 12, 8, 3);
      }
    }
    this.heading
      .setText(`HOLE ${m.hole + 1} / ${m.count} · PAR ${c.par}`)
      .setDepth(1);
    this.caption.setText(c.name.toUpperCase()).setDepth(1);
    this.note
      .setText(
        this.aim
          ? ""
          : m.shotActive
            ? "NICE AND EASY…"
            : this.pending
              ? "BLUE IS PLANNING…"
              : `${m.turn === 1 ? "ORANGE" : "BLUE"} · STROKE ${m.strokes[m.turn - 1] + 1}`,
      )
      .setDepth(1);
    this.ctx.setScore(
      m.totals[0] + (m.winner ? 0 : m.strokes[0]),
      m.totals[1] + (m.winner ? 0 : m.strokes[1]),
    );
    if (m.winner && this.age > 0.7 && !this.reported) {
      this.reported = true;
      this.ctx.finish({ winner: m.winner, scores: [...m.totals] });
    }
  }
  pause() {
    this.paused = true;
    this.aim = null;
    this.clock.reset();
    this.generation++;
    this.pending = false;
    this.ai?.cancel();
  }
  resume() {
    this.paused = false;
    this.age = 0;
    this.clock.reset();
  }
  dispose() {
    this.disposed = true;
    this.generation++;
    this.ai?.cancel();
    this.g.destroy();
    this.heading.destroy();
    this.caption.destroy();
    this.note.destroy();
  }
  snapshot() {
    return {
      ...this.match.save(),
      winner: this.match.winner,
      shotActive: this.match.shotActive,
      pending: this.pending,
      aim: this.aim,
    };
  }
}
