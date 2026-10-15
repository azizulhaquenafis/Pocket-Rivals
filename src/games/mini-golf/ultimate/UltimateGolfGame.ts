import { freshSeed } from "../../../shared/ai/MatchRandom";
import type {
  GameContext,
  MatchOptions,
  MiniGame,
} from "../../../shared/contracts/GameModule";
import type { Difficulty } from "../../../shared/contracts/AIController";
import { theme } from "../../../core/ThemeManager";
import { courses } from "./courses";
import { GolfRenderer } from "./GolfRenderer";
import { GolfView, shotVector } from "./GolfInput";
import { difficulties, strokeLimit, type GolfDifficulty } from "./GolfRules";
import { GolfUI } from "./components/GolfUI";
import { modeArt } from "./components/ModeArt";
import { CasualMode } from "./modes/CasualMode";
import { LocalVersusMode } from "./modes/LocalVersusMode";
import { AIChallengeMode } from "./modes/AIChallengeMode";
import { recordCompetition } from "./modes/CompetitiveStats";
import { timeText } from "./modes/CompetitionRules";
type Mode = "casual" | "local" | "ai";
export class UltimateGolfGame implements MiniGame {
  private ctx!: GameContext;
  private ui!: GolfUI;
  private casual = new CasualMode();
  private local?: LocalVersusMode;
  private race?: AIChallengeMode;
  private mode: Mode = "local";
  private difficulty: Difficulty = "medium";
  constructor(private initialOptions?: MatchOptions) {
    if (initialOptions) this.applyOptions(initialOptions);
  }
  private applyOptions(options: MatchOptions) {
    if (options.variant === "casual") {
      this.mode = "casual";
    } else if (options.mode === "ai") {
      this.mode = "ai";
      this.difficulty = options.difficulty ?? "medium";
    } else {
      this.mode = "local";
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
  private impacts = 0;
  private recoveries = 0;
  private get world() {
    return this.mode === "casual"
      ? this.casual.world
      : this.mode === "local"
        ? this.local?.world
        : this.race?.worlds[0];
  }
  private get course() {
    return this.mode === "casual"
      ? this.casual.course
      : this.mode === "local"
        ? this.plan[this.local!.hole]
        : this.plan[this.race!.holes[0]];
  }
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    if (ctx.options) this.applyOptions(ctx.options);
    this.ui = new GolfUI((action) => {
      if (!this.paused) this.action(action);
    });
    ctx.input.press(["KeyF", "KeyR"], (code) => {
      if (this.phase === "playing")
        this.action(code === "KeyF" ? "focus" : "retry");
    });
    ctx.input.drag(
      (x, y) => {
        if (
          this.phase !== "playing" ||
          !this.world?.shootable ||
          this.view.transitioning ||
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
        if (this.phase === "playing" && this.anchor && this.world) {
          const v = shotVector(this.anchor, this.view.unproject({ x, y }));
          if (this.world.shoot(v.x, v.y)) ctx.audio.play("hit");
        }
        this.cancel();
      },
      () => this.cancel(),
    );
    this.modes();
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
      if (this.phase === "modes") this.ctx.navigation?.exit();
      else if (this.phase === "select") this.modes();
      else this.select();
      return;
    }
    if (action === "courses") {
      this.select();
      return;
    }
    if (action.startsWith("mode:")) {
      this.mode = action.split(":")[1] as Mode;
      this.select();
      return;
    }
    if (action.startsWith("difficulty:")) {
      this.casual.difficulty = Number(action.split(":")[1]) as GolfDifficulty;
      this.select();
      return;
    }
    if (action.startsWith("ai:")) {
      this.difficulty = action.split(":")[1] as Difficulty;
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
      if (this.mode === "local") this.local?.begin();
      else this.race?.begin();
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
      this.race?.pause();
      this.phase = "help";
      this.ui.help(courses[this.course].tip);
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
        this.race?.pause();
        this.phase = "confirm";
        this.ui.help(
          "Forfeit this attempt? Your opponent keeps their result.",
          "Keep playing",
        );
        const panel = this.ui.field.querySelector(".help")!;
        panel.querySelector("h2")!.textContent = "End attempt?";
        panel.querySelectorAll("p")[1]?.remove();
        panel.insertAdjacentHTML(
          "beforeend",
          '<button data-action="forfeit">Forfeit attempt</button>',
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
      this.race?.forfeit();
      this.afterCompetition();
    }
  }
  private cancel() {
    this.anchor = null;
    this.aim = null;
    this.ui?.meter(null);
  }
  private release() {
    this.cancel();
    this.race?.dispose();
    this.race = undefined;
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
            "local",
            "2 Player Challenge",
            "Challenge a friend to finish first.",
            "#f9d7b5",
          ],
          ["ai", "1 Player vs AI", "Race against a smart opponent.", "#c8e7eb"],
          [
            "casual",
            "1 Player Casual",
            "Complete courses, earn points, beat your best.",
            "#d9e9bc",
          ],
        ] as const
      )
        .map(
          ([mode, title, desc, color]) =>
            `<button class="golf-mode" data-action="mode:${mode}" style="background:${color}">${modeArt(mode)}<span><strong>${title}</strong><small>${desc}</small></span></button>`,
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
        : this.mode === "ai"
          ? "Race against AI"
          : "Hot-seat race",
    );
    this.ui.screen(
      `<h2>Choose a course</h2><div class="golf-courses">${courses.map((c, i) => `<button class="golf-course" style="background:#${c.color.toString(16)}" data-action="course:${i}">${c.name}<small>${this.mode === "casual" && this.casual.progress.best[i] ? this.casual.progress.best[i] + " points" : c.subtitle}</small></button>`).join("")}</div>${this.mode !== "casual" ? '<div class="golf-actions"><button class="golf-primary" data-action="all">All four courses</button></div>' : ""}${this.mode === "casual" ? `<div class="golf-choice">${difficulties.map((d, i) => `<button data-action="difficulty:${i}" aria-pressed="${i === this.casual.difficulty}">${d.name}</button>`).join("")}</div>` : this.mode === "ai" ? `<div class="golf-choice">${(["medium", "hard", "impossible"] as const).map((d) => `<button data-action="ai:${d}" aria-pressed="${d === this.difficulty}">${d[0].toUpperCase() + d.slice(1)}</button>`).join("")}</div>` : ""}<div class="golf-actions">${this.mode === "casual" ? '<button data-action="mode:local">2 Player match</button>' : '<button data-action="mode:casual">Casual solo practice</button>'}</div>`,
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
      if (this.mode === "local") this.local = new LocalVersusMode(plan, seed);
      else
        this.race = new AIChallengeMode(
          plan,
          seed,
          this.difficulty,
          this.ctx.reportAI,
        );
      this.ready();
    }
  }
  private ready() {
    this.phase = "ready";
    this.cancel();
    const p = this.mode === "local" ? this.local!.player + 1 : 1;
    this.ui.title(this.mode === "local" ? `Player ${p}` : "You vs AI");
    this.ui.screen(
      `<h2>${this.mode === "local" ? `Player ${p}, ready?` : "Ready to race?"}</h2><p>${courses[this.course].name}${this.plan.length > 1 ? ` · Course ${this.mode === "local" ? this.local!.hole + 1 : 1} of ${this.plan.length}` : ""}</p><p>Fewest strokes wins. Time breaks ties.<br>3 minutes per course · ${strokeLimit(courses[this.course], 0)} strokes</p>${this.mode === "local" && p === 2 ? "<p>Pass the device. Same courses, same conditions.</p>" : ""}<div class="golf-actions"><button class="golf-primary" data-action="begin">Start attempt</button></div>`,
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
    this.update(0);
  }
  private attachWorld() {
    this.renderer?.dispose();
    this.renderer = new GolfRenderer(this.ctx.scene, this.view);
    this.renderedWorld = this.world;
    this.impacts = this.recoveries = 0;
  }
  private casualResult() {
    this.phase = "result";
    this.cancel();
    this.casual.record();
    const w = this.world!;
    this.ctx.audio.play(w.status === "won" ? "win" : "draw");
    this.ui.title(courses[this.casual.course].name);
    this.ui.screen(
      `<h2>${w.status === "won" ? "Beautiful putt!" : "One more try?"}</h2><p>${w.strokes} / ${w.limit} strokes · ${w.score} points</p><div class="golf-actions"><button class="golf-primary" data-action="${w.status === "won" && this.casual.course < 3 ? "next" : "retry"}">${w.status === "won" && this.casual.course < 3 ? "Next course" : "Play again"}</button><button data-action="courses">Courses</button><button data-action="finish">Finish run</button></div>`,
    );
  }
  private afterCompetition() {
    const competition = this.mode === "local" ? this.local! : this.race!;
    if (competition.phase === "playing") return;
    if (competition.phase !== "complete") {
      this.ready();
      return;
    }
    this.phase = "result";
    this.cancel();
    const result = competition.winner;
    recordCompetition(this.mode === "local" ? "local" : "ai", result);
    this.ctx.audio.play(result === "draw" ? "draw" : "win");
    const names = this.mode === "ai" ? ["You", "AI"] : ["Player 1", "Player 2"];
    this.ui.title(
      "Race results",
      this.plan.length === 1
        ? courses[this.plan[0]].name
        : "Four-course challenge",
    );
    this.ui.screen(
      `<h2>${result === "draw" ? "A draw!" : `${names[result - 1]} ${result === 1 && this.mode === "ai" ? "win" : "wins"}!`}</h2><table class="golf-result-table"><thead><tr><th>Golfer</th><th>Strokes</th><th>Time</th></tr></thead><tbody>${competition.totals.map((r, i) => `<tr><th>${names[i]}</th><td>${r.strokes + (this.mode === "ai" && !r.completed && competition.attempts[i].length === 0 ? this.race!.worlds[i].strokes : 0)}</td><td>${r.completed ? timeText(r.time) : "DNF"}</td></tr>`).join("")}</tbody></table><p>${result === "draw" ? "Neither golfer takes the win." : competition.totals.some((r) => r.completed) ? "Completed courses first. Strokes, then time." : "An attempt ended before completion."}</p><div class="golf-actions"><button class="golf-primary" data-action="rematch">Rematch</button><button data-action="courses">New race</button><button data-action="exit">Back to all games</button></div>`,
    );
  }
  update(dt: number) {
    if (this.paused || this.phase !== "playing" || !this.world) return;
    if (this.mode === "casual") this.casual.update(dt);
    else if (this.mode === "local") this.local!.update(dt);
    else this.race!.update(dt);
    const w = this.world;
    if (this.renderedWorld !== w) {
      this.attachWorld();
      this.cancel();
      this.view.follow(w.ball, 1);
    }
    if (!w.shootable) this.cancel();
    if (!this.anchor) this.view.follow(w.ball, 1 - Math.exp(-dt * 12));
    const playerColor =
      this.mode === "local" && this.local?.player === 1
        ? theme.blue
        : theme.orange;
    this.renderer?.draw(
      w,
      this.aim,
      this.mode === "ai" && this.race!.holes[0] === this.race!.holes[1]
        ? this.race!.worlds[1].ball
        : undefined,
      playerColor,
    );
    if (w.impacts !== this.impacts) {
      this.ctx.audio.play("hit");
      this.impacts = w.impacts;
    }
    if (w.recoveries !== this.recoveries) {
      this.cancel();
      this.recoveries = w.recoveries;
    }
    const elapsed =
      this.mode === "local"
        ? this.local!.elapsed
        : this.mode === "ai"
          ? this.race!.elapsed[0]
          : 0;
    const prefix =
      this.mode === "local" ? `Player ${this.local!.player + 1} · ` : "";
    this.ui.title(
      courses[this.course].name,
      `${prefix}${w.strokes}/${w.limit} strokes${this.mode !== "casual" ? ` · ${timeText(elapsed)}` : ""}`,
    );
    const playerDone =
      this.mode === "ai" &&
      this.race!.attempts[0].length === this.plan.length;
    this.ui.message(
      playerDone
        ? "You finished! Waiting for AI..."
        : w.messageTime > 0
          ? w.message
          : w.dynamics.ufo.warning
            ? "UFO approaching"
            : "",
    );
    this.ui.meter(this.aim?.power ?? null);
    if (this.mode === "ai") {
      const r = this.race!;
      const aiDone = r.attempts[1].length === this.plan.length;
      if (aiDone) {
        const totalAI = r.totals[1];
        this.ui.rival(
          `AI finished · ${totalAI.strokes} strokes (${timeText(totalAI.time)})`,
        );
      } else {
        this.ui.rival(
          `AI · ${r.worlds[1].strokes} strokes${this.plan.length > 1 ? ` · ${r.holes[1] + 1}/${this.plan.length}` : ""}`,
        );
      }
    }
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
    this.race?.pause();
    this.world?.resetAccumulator();
    this.ui.pause(true);
  }
  resume() {
    this.paused = false;
    this.world?.resetAccumulator();
    this.ui.pause(false);
    this.resize();
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
      aiming: !!this.anchor,
      progress: [...this.casual.progress.best],
      competition: this.local
        ? {
            player: this.local.player,
            phase: this.local.phase,
            elapsed: this.local.elapsed,
            attempts: this.local.attempts,
          }
        : this.race
          ? {
              phase: this.race.phase,
              elapsed: this.race.elapsed,
              opponent: this.race.worlds[1].snapshot(),
              ai: this.race.ai.snapshot(),
            }
          : null,
      ...this.world?.snapshot(),
    };
  }
}
