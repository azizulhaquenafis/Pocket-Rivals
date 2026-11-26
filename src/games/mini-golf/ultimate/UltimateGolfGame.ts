import { freshSeed } from "../../../shared/ai/MatchRandom";
import type {
  GameContext,
  MatchOptions,
  MiniGame,
} from "../../../shared/contracts/GameModule";
import { theme } from "../../../core/ThemeManager";
import { courses } from "./courses";
import { GolfRenderer } from "./GolfRenderer";
import {
  GOLF_KEY_CODES,
  GolfKeyboardAim,
  GolfView,
  shotVector,
} from "./GolfInput";
import { difficulties, strokeLimit, type GolfDifficulty } from "./GolfRules";
import { GolfUI } from "./components/GolfUI";
import { courseArt } from "./components/CourseArt";
import { modeArt } from "./components/ModeArt";
import { CasualMode } from "./modes/CasualMode";
import { LocalVersusMode } from "./modes/LocalVersusMode";
import { recordCompetition } from "./modes/CompetitiveStats";
import { timeText } from "./modes/CompetitionRules";

type Mode = "casual" | "local";

const COURSE_LEGENDS: Record<
  string,
  ReadonlyArray<{ swatch: string; label: string; detail: string }>
> = {
  foundry: [
    {
      swatch: "linear-gradient(135deg,#4a5159 50%,#f0b04c 50%)",
      label: "Conveyor Belt",
      detail: "Pushes ball along chevrons",
    },
    {
      swatch: "radial-gradient(circle at 35% 35%,#4a8a96,#222830 70%)",
      label: "Oil Spill",
      detail: "Ultra-slick gliding puddle",
    },
    {
      swatch: "linear-gradient(90deg,#e5594c 50%,#4c9be5 50%)",
      label: "Electromagnet",
      detail: "Strong inward pull & trap",
    },
    {
      swatch: "radial-gradient(circle,#ffe47a,#e85a30 70%)",
      label: "Molten Lava",
      detail: "Resets to your last shot",
    },
    {
      swatch: "linear-gradient(90deg,#3a4149 25%,#e5594c 50%,#3a4149 75%)",
      label: "Laser Gate",
      detail: "Pulses on & off — time it",
    },
    {
      swatch: "linear-gradient(135deg,#f2a341 50%,#4d5860 50%)",
      label: "Piston & Blades",
      detail: "Timed steel deflectors",
    },
  ],
  shoreline: [
    {
      swatch: "repeating-linear-gradient(0deg,#e6c387 0 6px,#b88c52 6px 8px)",
      label: "Tidal Bridge",
      detail: "Floods when the tide rises",
    },
    {
      swatch: "radial-gradient(circle,#0d2f3e,#2e89a6 65%,#8be0ea)",
      label: "Whirlpool",
      detail: "Strong spiral ocean pull",
    },
    {
      swatch: "linear-gradient(135deg,#dfa957,#f0cb82)",
      label: "Sand Bunker",
      detail: "Heavy drag slows your roll",
    },
    {
      swatch: "linear-gradient(135deg,#99dbe0,#dff9fb)",
      label: "Wet Sand",
      detail: "Glossy fast-sliding patch",
    },
    {
      swatch: "linear-gradient(90deg,#64c4d4,#b6f0f7 50%,#64c4d4)",
      label: "Shallow Ford",
      detail: "Safe water with side drift",
    },
    {
      swatch: "radial-gradient(circle,#fffdf5 35%,#ef6c4d 36%)",
      label: "Lifebuoy Bumper",
      detail: "Extra-bouncy spring ring",
    },
  ],
  horizon: [
    {
      swatch: "radial-gradient(circle,#261842 30%,#d89ef0 55%,#4f3b7d)",
      label: "Gravity Well",
      detail: "Strongly curves moving balls",
    },
    {
      swatch: "radial-gradient(circle,#1b162e 30%,#f29e57 65%,#58addb)",
      label: "Paired Portals",
      detail: "Color-matched warp arrows",
    },
    {
      swatch: "linear-gradient(135deg,#8ee3f5,#e8fbff)",
      label: "Cryo Ice",
      detail: "Near-zero friction slide",
    },
    {
      swatch: "linear-gradient(90deg,#7c96f0,#c8dcff 50%,#7c96f0)",
      label: "Ion Wind",
      detail: "Pushes ball along streams",
    },
    {
      swatch: "radial-gradient(circle,#fffdf5 25%,#58addb 65%)",
      label: "Visiting UFO",
      detail: "Lifts a still ball elsewhere",
    },
    {
      swatch: "linear-gradient(90deg,#2a2444 25%,#f05a6d 50%,#2a2444 75%)",
      label: "Plasma Laser",
      detail: "Wait for the off window",
    },
  ],
  temple: [
    {
      swatch: "repeating-linear-gradient(0deg,#dfba81 0 6px,#8c663b 6px 8px)",
      label: "Cracked Bridge",
      detail: "Planks crumble once crossed",
    },
    {
      swatch: "radial-gradient(circle,#9c621d,#dfa852 55%,#f7d48b)",
      label: "Quicksand",
      detail: "Don't stop! Sinks after 3s",
    },
    {
      swatch: "radial-gradient(circle,#6d4b33,#9c7050)",
      label: "Swamp Mud",
      detail: "Thick drag slows your ball",
    },
    {
      swatch: "linear-gradient(135deg,#94dbd3,#e0faf7)",
      label: "Polished Jade",
      detail: "Slick floor glides farther",
    },
    {
      swatch: "radial-gradient(circle,#fffdf5 28%,#f1d583 32%,#58addb 85%)",
      label: "Runic Plates",
      detail: "Unlock linked temple doors",
    },
    {
      swatch: "linear-gradient(90deg,#5b6d52 25%,#e55b4d 50%,#5b6d52 75%)",
      label: "Dart Trap",
      detail: "Pulses across stone halls",
    },
  ],
};

export class UltimateGolfGame implements MiniGame {
  private ctx!: GameContext;
  private ui!: GolfUI;
  private casual = new CasualMode();
  private local?: LocalVersusMode;
  private mode: Mode = "casual";
  constructor(private initialOptions?: MatchOptions) {
    if (initialOptions) this.applyOptions(initialOptions);
  }
  private applyOptions(options: MatchOptions) {
    if (options.variant === "casual") {
      this.mode = "casual";
    } else if (options.mode === "local") {
      this.mode = "local";
    } else {
      this.mode = "casual";
    }
  }
  private plan = [0];
  private renderer?: GolfRenderer;
  private renderedWorld?: object;
  private view = new GolfView();
  private phase = "modes";
  private paused = false;
  private aim: ReturnType<typeof shotVector> | null = null;
  private anchor: { x: number; y: number } | null = null;
  private kb = new GolfKeyboardAim();
  private heldKeys: ReadonlySet<string> = new Set();
  private impacts = 0;
  private recoveries = 0;
  private ufoWarned = false;
  private get world() {
    return this.mode === "casual" ? this.casual.world : this.local?.world;
  }
  private get course() {
    return this.mode === "casual"
      ? this.casual.course
      : this.plan[this.local!.hole];
  }
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    if (ctx.options) this.applyOptions(ctx.options);
    this.ui = new GolfUI((action) => {
      if (!this.paused) this.action(action);
    });
    this.heldKeys = ctx.input.keys([...GOLF_KEY_CODES]);
    ctx.input.press(
      ["KeyF", "KeyZ", "KeyR", "KeyC", "Backspace", "Space", "Enter"],
      (code) => {
        if (this.paused) return;
        if (this.phase === "ready" && (code === "Space" || code === "Enter")) {
          this.action("begin");
          return;
        }
        if (this.phase === "help" && code === "Enter") {
          this.action("close-help");
          return;
        }
        if (this.phase !== "playing") return;
        if (code === "KeyF" || code === "KeyZ") {
          this.action("focus");
        } else if (code === "KeyR") {
          this.action("retry");
        } else if (code === "KeyC" || code === "Backspace") {
          this.cancel();
        } else if (
          code === "Space" &&
          this.world?.shootable &&
          !this.anchor &&
          !this.view.transitioning
        ) {
          this.kb.beginCharge(this.world.ball, courses[this.course].hole);
          this.aim = this.kb.vector();
        } else if (
          code === "Enter" &&
          this.world?.shootable &&
          !this.anchor &&
          this.kb.active &&
          !this.kb.charging
        ) {
          this.fireShot(this.kb.vector());
        }
      },
    );
    ctx.input.drag(
      (x, y) => {
        if (
          this.phase !== "playing" ||
          !this.world?.shootable ||
          this.view.transitioning ||
          !this.view.contains({ x, y })
        )
          return false;
        this.kb.cancel();
        this.anchor = this.view.unproject({ x, y });
        this.aim = shotVector(this.anchor, this.anchor);
        return true;
      },
      (x, y) => {
        if (this.anchor)
          this.aim = shotVector(this.anchor, this.view.unproject({ x, y }));
      },
      (x, y) => {
        if (this.phase === "playing" && this.anchor && this.world) {
          const v = shotVector(this.anchor, this.view.unproject({ x, y }));
          this.fireShot(v);
        }
        this.cancel();
      },
      () => this.cancel(),
      { outside: true },
    );
    this.modes();
  }
  private fireShot(v: { x: number; y: number }) {
    if (this.world?.shoot(v.x, v.y)) {
      const power = Math.min(1, Math.hypot(v.x, v.y) / 900);
      this.ctx.audio.play("shoot", 0.55 + power * 0.45);
      this.cancel();
    }
  }
  private action(action: string) {
    this.ctx.audio.play("tap");
    if (action === "pause") {
      this.ctx.navigation?.pause();
      return;
    }
    if (action === "exit") {
      this.ctx.navigation?.exit();
      return;
    }
    if (action === "back") {
      this.cancel();
      this.ctx.navigation?.exit();
      return;
    }
    if (action === "courses") {
      this.select();
      return;
    }
    if (action.startsWith("mode:")) {
      const next = action.split(":")[1];
      this.mode = next === "local" ? "local" : "casual";
      this.select();
      return;
    }
    if (action.startsWith("difficulty:")) {
      this.casual.difficulty = Number(action.split(":")[1]) as GolfDifficulty;
      this.select();
      return;
    }
    if (action.startsWith("course:")) {
      this.startCompetitionOrCasual([Number(action.split(":")[1])]);
      return;
    }
    if (action === "all") {
      this.startCompetitionOrCasual(courses.map((_, i) => i));
      return;
    }
    if (action === "begin") {
      this.local?.begin();
      this.showPlay();
      return;
    }
    if (action === "rematch") {
      this.startCompetitionOrCasual(this.plan);
      return;
    }
    if (action === "next") {
      this.startCompetitionOrCasual([
        (this.casual.course + 1) % courses.length,
      ]);
      return;
    }
    if (action === "finish") {
      this.ctx.finishArcade(
        this.casual.progress.total,
        "Your best scores across all four courses",
      );
      return;
    }
    if (action === "close-help") {
      this.ui.closeHelp();
      this.phase = "playing";
      return;
    }
    if (action === "help" && this.phase === "playing") {
      this.cancel();
      this.phase = "help";
      const c = courses[this.course];
      this.ui.help(c.tip, "Back to play", COURSE_LEGENDS[c.id]);
      return;
    }
    if (action === "focus" && this.phase === "playing" && this.world) {
      this.cancel();
      this.view.focus(this.world.ball);
      this.ui.focus(this.view.focused);
      return;
    }
    if (action === "retry" && this.phase === "playing") {
      if (this.mode === "casual")
        this.startCompetitionOrCasual([this.casual.course]);
      else {
        this.cancel();
        this.phase = "confirm";
        this.ui.confirm(
          "End attempt?",
          "Forfeit this attempt? Your opponent keeps their result.",
          "Keep playing",
          "forfeit",
          "Forfeit attempt",
        );
      }
      return;
    }
    if (action === "retry" && this.phase === "result") {
      this.startCompetitionOrCasual([this.casual.course]);
      return;
    }
    if (action === "forfeit") {
      this.local?.forfeit();
      this.afterCompetition();
    }
  }
  private cancel() {
    this.anchor = null;
    this.aim = null;
    this.kb.cancel();
    this.ui?.meter(null);
  }
  private release() {
    this.cancel();
    this.local = undefined;
    this.renderer?.dispose();
    this.renderer = undefined;
    this.renderedWorld = undefined;
  }
  private modes() {
    this.release();
    this.phase = "modes";
    this.ui.title("Ultimate Golf");
    this.ui.screen(
      `<div class="golf-modes">${(
        [
          [
            "casual",
            "1 Player",
            "Casual — Complete courses, earn points, beat your best.",
            "#d9e9bc",
          ],
          [
            "local",
            "2 Players",
            "Challenge a friend on this device — fewest strokes wins.",
            "#f9d7b5",
          ],
        ] as const
      )
        .map(
          ([mode, title, desc, color]) =>
            `<button class="golf-mode" data-action="mode:${mode}" style="background:${color}">${modeArt(mode)}<span><strong>${title}</strong> <small>${desc}</small></span></button>`,
        )
        .join("")}</div>`,
    );
  }
  private select() {
    this.release();
    this.phase = "select";
    this.ui.title(
      "Ultimate Golf",
      this.mode === "casual"
        ? `Personal best · ${this.casual.progress.total}`
        : "2 Player hot-seat",
    );
    this.ui.screen(
      `<h2>Choose a course</h2><div class="golf-courses">${courses.map((c, i) => `<button class="golf-course" style="background:#${c.color.toString(16)}" data-action="course:${i}">${courseArt(c)}<strong>${c.name}</strong><small>${this.mode === "casual" && this.casual.progress.best[i] ? this.casual.progress.best[i] + " points" : c.subtitle}</small></button>`).join("")}</div>${this.mode === "casual" ? `<div class="golf-choice">${difficulties.map((d, i) => `<button data-action="difficulty:${i}" aria-pressed="${i === this.casual.difficulty}">${d.name}</button>`).join("")}</div>` : ""}<div class="golf-actions">${this.mode === "local" ? '<button class="golf-primary" data-action="all">All four courses</button><button data-action="mode:casual">1 Player (Casual)</button>' : '<button data-action="mode:local">2 Players</button>'}</div>`,
      "golf-panel-courses",
    );
  }
  private startCompetitionOrCasual(plan: number[]) {
    this.release();
    this.plan = [...plan];
    const seed = freshSeed();
    if (this.mode === "casual") {
      this.casual.start(plan[0]);
      this.showPlay();
    } else {
      this.local = new LocalVersusMode(plan, seed);
      this.ready();
    }
  }
  private ready() {
    this.phase = "ready";
    this.cancel();
    const p = this.local!.player + 1;
    this.ui.title(`Player ${p}`);
    this.ui.screen(
      `<h2>Player ${p}, ready?</h2><p>${courses[this.course].name}${this.plan.length > 1 ? ` · Course ${this.local!.hole + 1} of ${this.plan.length}` : ""} · ${strokeLimit(courses[this.course], 0)} strokes</p><div class="golf-actions"><button class="golf-primary" data-action="begin">Start attempt</button></div>`,
    );
  }
  private showPlay() {
    this.cancel();
    this.phase = "playing";
    this.view = new GolfView();
    this.ui.playing(this.mode !== "casual");
    this.view.configure(this.ui.bounds());
    this.view.follow(this.world!.ball, 1);
    this.attachWorld();
    this.ctx.audio.play("start", 0.7);
    this.update(0);
  }
  private attachWorld() {
    this.renderer?.dispose();
    this.renderer = new GolfRenderer(this.ctx.scene, this.view);
    this.renderedWorld = this.world;
    this.impacts = this.recoveries = 0;
    this.ufoWarned = false;
    if (this.world) this.kb.reset(this.world.ball, courses[this.course].hole);
  }
  private casualResult() {
    this.phase = "result";
    this.cancel();
    this.casual.record();
    const w = this.world!;
    this.ctx.audio.play(
      w.status === "won" ? (w.strokes <= 2 ? "perfect" : "win") : "fail",
    );
    this.ui.title(courses[this.casual.course].name);
    this.ui.screen(
      `<h2>${w.status === "won" ? "Beautiful putt!" : "One more try?"}</h2><p>${w.strokes} / ${w.limit} strokes · ${w.score} points</p><div class="golf-actions"><button class="golf-primary" data-action="${w.status === "won" && this.casual.course < 3 ? "next" : "retry"}">${w.status === "won" && this.casual.course < 3 ? "Next course" : "Play again"}</button><button data-action="courses">Courses</button><button data-action="finish">Finish run</button></div>`,
    );
  }
  private afterCompetition() {
    const competition = this.local!;
    if (competition.phase === "playing") return;
    if (competition.phase !== "complete") {
      this.ctx.audio.play("goal", 0.75);
      this.ready();
      return;
    }
    this.phase = "result";
    this.cancel();
    const result = competition.winner;
    recordCompetition("local", result);
    this.ctx.audio.play(result === "draw" ? "draw" : "win");
    const names = ["Player 1", "Player 2"];
    this.ui.title(
      "Match results",
      this.plan.length === 1
        ? courses[this.plan[0]].name
        : "Four-course challenge",
    );
    this.ui.screen(
      `<h2>${result === "draw" ? "A draw!" : `${names[result - 1]} wins!`}</h2><table class="golf-result-table"><thead><tr><th>Golfer</th><th>Strokes</th><th>Time</th></tr></thead><tbody>${competition.totals.map((r, i) => `<tr><th>${names[i]}</th><td>${r.strokes}</td><td>${r.completed ? timeText(r.time) : "DNF"}</td></tr>`).join("")}</tbody></table><p>${result === "draw" ? "Neither golfer takes the win." : competition.totals.some((r) => r.completed) ? "Completed courses first. Strokes, then time." : "An attempt ended before completion."}</p><div class="golf-actions"><button class="golf-primary" data-action="rematch">Rematch</button><button data-action="courses">Courses</button><button data-action="exit">Back to all games</button></div>`,
    );
  }
  update(dt: number) {
    if (this.paused || this.phase !== "playing" || !this.world) return;
    if (this.mode === "casual") this.casual.update(dt);
    else this.local!.update(dt);
    const w = this.world;
    if (this.renderedWorld !== w) {
      this.attachWorld();
      this.cancel();
      this.view.follow(w.ball, 1);
    }
    if (!w.shootable) this.cancel();
    if (w.shootable && !this.anchor && !this.view.transitioning) {
      const fired = this.kb.step(
        dt,
        this.heldKeys,
        w.ball,
        courses[this.course].hole,
      );
      if (fired) {
        this.fireShot(fired);
      } else if (this.kb.active) {
        this.aim = this.kb.vector();
      }
    }
    if (!this.anchor && !this.kb.charging)
      this.view.follow(w.ball, 1 - Math.exp(-dt * 12));
    const playerColor =
      this.mode === "local" && this.local?.player === 1
        ? theme.blue
        : theme.orange;
    this.renderer?.draw(w, this.aim, undefined, playerColor);
    if (w.impacts !== this.impacts) {
      this.ctx.audio.play("wood", 0.85);
      this.impacts = w.impacts;
    }
    if (w.recoveries !== this.recoveries) {
      this.ctx.audio.play("fall", 0.8);
      this.cancel();
      this.recoveries = w.recoveries;
    }
    if (w.dynamics.ufo.warning && !this.ufoWarned) {
      this.ufoWarned = true;
      this.ctx.audio.play("countdown", 0.65);
    } else if (!w.dynamics.ufo.warning) {
      this.ufoWarned = false;
    }
    const elapsed = this.mode === "local" ? this.local!.elapsed : 0;
    const prefix =
      this.mode === "local" ? `Player ${this.local!.player + 1} · ` : "";
    this.ui.title(
      courses[this.course].name,
      `${prefix}${w.strokes}/${w.limit} strokes${this.mode !== "casual" ? ` · ${timeText(elapsed)}` : ""}`,
    );
    this.ui.message(
      w.messageTime > 0
        ? w.message
        : w.dynamics.ufo.warning
          ? "UFO approaching"
          : "",
    );
    this.ui.meter(this.aim?.power ?? null);
    if (this.mode === "casual") {
      if (w.status !== "playing") this.casualResult();
    } else this.afterCompetition();
  }
  resize() {
    if (!this.ui) return;
    this.cancel();
    this.view.configure(this.ui.bounds());
    if (this.world) this.view.follow(this.world.ball, 1);
  }
  pause() {
    this.paused = true;
    this.cancel();
    this.world?.resetAccumulator();
    this.ui.pause(true);
  }
  resume() {
    this.paused = false;
    this.world?.resetAccumulator();
    this.ui.pause(false);
    this.resize();
  }
  toggleHelp() {
    if (this.paused) return false;
    if (this.phase === "playing") {
      this.action("help");
      return true;
    }
    if (this.phase === "help") {
      this.action("close-help");
      return true;
    }
    return false;
  }
  dispose() {
    this.release();
    this.ui.dispose();
  }
  snapshot() {
    return {
      phase: this.phase,
      mode: this.mode,
      view: {
        zoom: this.view.zoom,
        targetZoom: this.view.targetZoom,
        scale: this.view.scale,
        center: { ...this.view.center },
        bounds: this.view.bounds,
      },
      aiming: !!this.anchor || this.kb.active,
      keyboard: {
        active: this.kb.active,
        charging: this.kb.charging,
        angle: this.kb.angle,
        power: this.kb.charging ? this.kb.chargePower : this.kb.power,
      },
      progress: [...this.casual.progress.best],
      competition: this.local
        ? {
            player: this.local.player,
            phase: this.local.phase,
            elapsed: this.local.elapsed,
            attempts: this.local.attempts,
          }
        : null,
      ...this.world?.snapshot(),
    };
  }
}
