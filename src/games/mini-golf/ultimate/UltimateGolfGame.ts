import type Phaser from "phaser";
import type {
  GameContext,
  MiniGame,
} from "../../../shared/contracts/GameModule";
import { label, rounded } from "../../../shared/components/drawing";
import { theme } from "../../../core/ThemeManager";
import { courses } from "./courses";
import { GolfPhysics } from "./GolfPhysics";
import { GolfRenderer } from "./GolfRenderer";
import { GolfView, shotVector } from "./GolfInput";
import { GolfProgress } from "./GolfProgress";
import { difficulties, type GolfDifficulty } from "./GolfRules";
export class UltimateGolfGame implements MiniGame {
  private ctx!: GameContext;
  private world?: GolfPhysics;
  private renderer?: GolfRenderer;
  private view = new GolfView();
  private progress!: GolfProgress;
  private ui: Phaser.GameObjects.GameObject[] = [];
  private title?: Phaser.GameObjects.Text;
  private power?: Phaser.GameObjects.Graphics;
  private phase: "select" | "playing" | "result" | "help" = "select";
  private paused = false;
  private difficulty: GolfDifficulty = 1;
  private course = 0;
  private aim: ReturnType<typeof shotVector> | null = null;
  private anchor: { x: number; y: number } | null = null;
  private impacts = 0;
  private recoveries = 0;
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    this.progress = new GolfProgress();
    ctx.input.press(["KeyR", "KeyF"], (code) => {
      if (this.paused || this.phase !== "playing" || !this.world) return;
      if (code === "KeyR") this.start(this.course);
      else {
        this.cancel();
        this.view.focus(this.world.ball);
      }
    });
    ctx.input.drag(
      (x, y) => {
        if (
          this.phase !== "playing" ||
          !this.world?.shootable ||
          !this.view.contains({ x, y })
        )
          return false;
        this.anchor = this.view.unproject({ x, y });
        this.aim = shotVector(this.anchor, this.anchor);
        return true;
      },
      (x, y) => {
        if (this.anchor)
          this.aim = shotVector(this.anchor, this.view.unproject({ x, y }));
      },
      (x, y) => {
        if (this.anchor && this.world) {
          const v = shotVector(this.anchor, this.view.unproject({ x, y }));
          if (this.world.shoot(v.x, v.y)) ctx.audio.play("hit");
        }
        this.cancel();
      },
      () => this.cancel(),
    );
    this.select();
  }
  private cancel() {
    this.anchor = null;
    this.aim = null;
  }
  private clearUI() {
    this.ui.forEach((v) => v.destroy());
    this.ui = [];
    this.title = undefined;
    this.power = undefined;
  }
  private text(x: number, y: number, t: string, size = 18) {
    const v = label(this.ctx.scene, x, y, t, size);
    this.ui.push(v);
    return v;
  }
  private button(
    x: number,
    y: number,
    w: number,
    text: string,
    fn: () => void,
    color: number = theme.white,
  ) {
    const g = this.ctx.scene.add.graphics();
    rounded(g, x - w / 2, y - 21, w, 42, 12, color, 2);
    const t = this.text(x, y, text, 16);
    const z = this.ctx.scene.add
      .zone(x, y, w, 44)
      .setInteractive({ useHandCursor: true });
    z.on("pointerup", () => {
      if (!this.paused) {
        this.ctx.audio.play("tap");
        fn();
      }
    });
    this.ui.push(g, z);
    t.setDepth(2);
  }
  private select() {
    this.phase = "select";
    this.cancel();
    this.renderer?.dispose();
    this.renderer = undefined;
    this.world = undefined;
    this.clearUI();
    this.ctx.setArcadeHUD(this.progress.total, "");
    this.ctx.setHint("Pull back anywhere on the course. Release to putt.");
    this.text(210, 133, "Choose your adventure", 25);
    courses.forEach((c, i) => {
      const y = 204 + i * 94,
        g = this.ctx.scene.add.graphics();
      rounded(g, 28, y - 38, 364, 80, 17, c.color, 3);
      this.ui.push(g);
      this.text(58, y - 5, String(i + 1), 27);
      this.text(229, y - 12, c.name, 24);
      this.text(
        229,
        y + 15,
        `${c.subtitle}${this.progress.best[i] ? " · " + this.progress.best[i] + " pts" : ""}`,
        11,
      );
      const z = this.ctx.scene.add
        .zone(210, y, 364, 80)
        .setInteractive({ useHandCursor: true });
      z.on("pointerup", () => {
        if (!this.paused) this.start(i);
      });
      this.ui.push(z);
    });
    this.text(210, 564, "Choose the challenge", 16);
    difficulties.forEach((d, i) =>
      this.button(
        80 + i * 130,
        606,
        116,
        d.name,
        () => {
          this.difficulty = i as GolfDifficulty;
          this.select();
        },
        i === this.difficulty ? theme.orange : theme.white,
      ),
    );
    this.text(210, 654, "Easy: slower traps & more strokes", 13);
    this.text(210, 674, "Normal: original pace · Hard: faster traps", 13);
  }
  private start(index: number) {
    this.course = index;
    this.phase = "playing";
    this.clearUI();
    this.renderer?.dispose();
    this.view = new GolfView();
    this.world = new GolfPhysics(courses[index], this.difficulty);
    this.renderer = new GolfRenderer(this.ctx.scene, this.view);
    this.title = this.text(210, 112, courses[index].name.toUpperCase(), 12);
    this.button(81, 659, 112, "Courses", () => this.select());
    this.button(210, 659, 112, "Focus ↔", () => {
      this.cancel();
      this.view.focus(this.world!.ball);
    });
    this.button(339, 659, 112, "Retry", () => this.start(this.course));
    this.button(384, 607, 40, "?", () => this.help());
    this.power = this.ctx.scene.add.graphics();
    this.ui.push(this.power);
    this.impacts = this.recoveries = 0;
    this.ctx.setHint("Drag back → release • F: focus • R: retry");
    this.update(0);
  }
  private help() {
    this.cancel();
    this.phase = "help";
    const start = this.ui.length;
    const g = this.ctx.scene.add.graphics();
    rounded(g, 35, 234, 350, 314, 23, theme.paper, 4);
    this.ui.push(g);
    this.text(210, 273, courses[this.course].name, 26);
    this.text(210, 351, courses[this.course].tip, 19)
      .setWordWrapWidth(286)
      .setAlign("center");
    this.text(
      210,
      440,
      "Pull back anywhere on the course.\nLonger pulls give more power.\nHazards return you to your last shot.",
      15,
    ).setAlign("center");
    this.button(
      210,
      505,
      280,
      "Got it — let’s putt",
      () => {
        this.ui.splice(start).forEach((v) => v.destroy());
        this.phase = "playing";
      },
      theme.orange,
    );
  }
  private result() {
    const world = this.world!;
    this.phase = "result";
    this.cancel();
    this.clearUI();
    if (world.status === "won") {
      this.progress.record(this.course, world.score);
      this.ctx.audio.play("win");
    } else this.ctx.audio.play("draw");
    const g = this.ctx.scene.add.graphics();
    rounded(g, 35, 240, 350, 306, 23, theme.paper, 4);
    this.ui.push(g);
    this.text(
      210,
      285,
      world.status === "won" ? "Beautiful putt!" : "One more try?",
      30,
    );
    this.text(
      210,
      326,
      `${world.strokes} / ${world.limit} strokes · ${world.score} points`,
      18,
    );
    if (world.status === "won" && this.course < 3)
      this.button(
        210,
        378,
        290,
        "Next course →",
        () => this.start(this.course + 1),
        theme.orange,
      );
    else
      this.button(
        210,
        378,
        290,
        "Play again",
        () => this.start(this.course),
        theme.orange,
      );
    this.button(210, 436, 290, "Choose a course", () => this.select());
    this.button(210, 494, 290, "Finish run", () =>
      this.ctx.finishArcade(
        this.progress.total,
        "Your best scores across all four courses",
      ),
    );
    this.ctx.setArcadeHUD(
      this.progress.total,
      world.status === "won" ? "Course complete" : "Stroke limit reached",
    );
  }
  update(dt: number) {
    if (this.paused || this.phase !== "playing" || !this.world) return;
    const w = this.world;
    w.advance(dt);
    if (!w.shootable) this.cancel();
    if (!this.anchor) this.view.follow(w.ball, Math.min(1, dt * 9));
    this.renderer?.draw(w, this.aim);
    if (w.impacts !== this.impacts) {
      this.ctx.audio.play("hit");
      this.impacts = w.impacts;
    }
    if (w.recoveries !== this.recoveries) {
      this.cancel();
      this.ctx.audio.play("draw");
      this.recoveries = w.recoveries;
    }
    this.ctx.setArcadeHUD(
      this.progress.total,
      `${w.strokes} / ${w.limit} strokes  ·  ${difficulties[this.difficulty].name}`,
    );
    this.ctx.setHint(
      w.messageTime > 0
        ? w.message
        : w.shootable
          ? "Pull back anywhere • Release to putt • Focus for detail"
          : "Ball moving · wait for it to settle",
    );
    this.title?.setText(
      `${courses[this.course].name.toUpperCase()}  ·  ${this.view.zoom > 1 ? "FOCUS" : "9:16"}`,
    );
    if (this.power) {
      this.power.clear();
      if (this.aim) {
        rounded(this.power, 110, 706, 200, 10, 5, theme.white, 1);
        this.power
          .fillStyle(theme.orange)
          .fillRoundedRect(112, 708, 196 * this.aim.power, 6, 3);
      }
    }
    if (w.status !== "playing") this.result();
  }
  pause() {
    this.paused = true;
    this.cancel();
    this.world?.resetAccumulator();
  }
  resume() {
    this.paused = false;
    this.world?.resetAccumulator();
  }
  dispose() {
    this.cancel();
    this.clearUI();
    this.renderer?.dispose();
    this.renderer = undefined;
  }
  snapshot() {
    return {
      phase: this.phase,
      course: this.course,
      difficulty: this.difficulty,
      view: {
        zoom: this.view.zoom,
        center: { ...this.view.center },
        bounds: this.view.bounds,
      },
      aiming: !!this.anchor,
      progress: [...this.progress.best],
      ...this.world?.snapshot(),
    };
  }
}
