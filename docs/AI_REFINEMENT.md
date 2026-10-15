# AI refinement

Scope: Pong, Air Hockey, Classic and Ultimate Tic-Tac-Toe, Connect Four, Dots and Boxes, Hammer Hit, Light Fingers, Fruit Duel, Lumberjack, and the active Ultimate Golf port. Math Quiz is owned by concurrent development and was not edited. Water Guess and Perfect Timer appeared during concurrent development and already use the seeded utility; their implementations were inspected read-only and left to their owner. Concurrent Pong keyboard-control edits were also preserved. The proposed racing and other survival modules are not present; Snake and Star Patrol have no opponent AI.

## Match identity and replay

`shared/ai/MatchRandom.ts` is a small, lazy utility, not a game manager. Each opponent receives a fresh cryptographic seed and a persistent identity. The 24 profile slots combine four game-specific roles, three tempo/position settings and two side preferences. These are parameters of each game's decisions, not 24 copied algorithms. Simple reflex games and solved positions naturally have less tactical variety.

Development URL: `/?aiSeed=314159&aiReplay&diagnostics`.

- `aiSeed` pins the seed; normal matches/rematches generate a new seed.
- `aiReplay` substitutes bounded node/candidate limits for wall-clock search cutoffs. Given the same position and seed, worker decisions replay. Normal production searches retain time limits.
- Physics replay also requires the same timestep and human input stream. This is not an input recorder. Worker watchdog cancellation can still interrupt a debug search on slow devices.
- `window.__POCKET__.scene.game.ai` contains identity and, where applicable, the current target/reaction. Golf exposes this under `competition.ai`.
- Existing board and physics checkpoints retain the identity seed. A board move derives its randomness from the seed and position. A physics checkpoint retains the personality, not every transient movement-controller/RNG accumulator.
- Goal/course resets preserve identity. Fresh matches create a new one. Pausing freezes simulation and terminates search workers; stale generations cannot play moves after exit.

## Changes and causes

| Game           | Original repetition                                                                 | Current decisions                                                                                                                                                                                  |
| -------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Classic TTT    | First move in a fixed ordering won every minimax tie                                | Weighted seeded choice among exactly equal scores; center, corner, edge and flank preferences. Hard resolves opening equivalence with full search. Impossible always uses full minimax.            |
| Ultimate TTT   | Fixed ordering, fixed positional weights; root bounds unsuitable for tie comparison | Stable seeded ordering, modest local/global positional preferences, exact root comparisons, existing iterative deepening and transposition bounds.                                                 |
| Connect Four   | Center-first tie selection and one evaluator                                        | Aggressive, defensive, balanced and flank emphasis; positional weights and equal-score selection vary. Immediate wins retain priority; terminal scores dominate preferences.                       |
| Dots and Boxes | Same greedy opening, fixed chain evaluation; some bounds cached as exact            | Perimeter, center, horizontal and flank preferences; chain valuation; correct upper/lower/exact cache entries and full-window root comparisons.                                                    |
| Pong           | Same interception and outgoing central tracking                                     | Angle attacker, defender, counter and flank preferences. Shot angle locks per incoming flight and uses the opponent's observed paddle; difficult interceptions abandon risky offsets.              |
| Air Hockey     | One home position and approach pattern                                              | Pressure, guard, counter and positional home/approach parameters; observed opponent positioning guides shots. Approach-side commitment avoids target flipping.                                     |
| Light Fingers  | Narrow uniform delay                                                                | Match cadence plus per-signal bounded bell-shaped reaction time; pressure-sensitive Hard/Medium behavior, visible-signal-only input and a 120 ms minimum.                                          |
| Fruit Duel     | Narrow uniform delay and fixed recognition-error rate                               | Cadence and cautious/opportunistic recognition profiles; per-reveal delay/error decisions. Impossible has no deliberate recognition errors.                                                        |
| Hammer Hit     | One threshold for all three strikes                                                 | Per-attempt precision tolerance and cadence parameters; Impossible aims for the best visible timing. Identical high scores are legitimate in this simple timing game.                              |
| Lumberjack     | Always chose left when safe; artificial Impossible mistake                          | Side preference, low-switching and visible-segment lookahead, varied legal chop cadence. Impossible never intentionally chooses a branch.                                                          |
| Ultimate Golf  | Fixed candidate order/delay; a periodic angle error applied after simulation        | Persistent planning preferences for waiting/bounce risk, seeded angle ordering and power refinement, variable shot preparation. Every executed trajectory was simulated by the real course engine. |

Difficulty remains game-specific. Medium uses shallower searches, slower reactions and occasional legal recognition/position errors. Hard increases tactical search and accuracy. Impossible removes deliberate reflex errors, uses maximum search budgets and precise legal motion. Only Classic TTT claims optimal play. Repeated forced wins, draws or identical strong moves are not treated as defects.

## Performance and boundaries

No dependencies were added. No rule engine, scoring, tournament, registry, rendering or shared motion-controller behavior was changed. AI implementations remain in their game folders. Search workers keep cancellation and the existing two-second watchdog. Normal worker budgets are 25/100/300 ms for Connect Four, 25/100/280 ms for Ultimate, 12/70/180 ms for Dots, and 65/140/240 ms for Golf (Medium/Hard/Impossible). Dots Medium is greedy. Golf evaluates complete trajectories between budget checks, so a single trial may slightly exceed its budget.

Pong and Hockey keep acceleration limits, interpolated targets, legal field constraints and deadbands. Randomness is sampled at tactical/reaction boundaries, never independently each render frame. No score changes, teleports or physics exemptions were added.

## Verification

Run:

```sh
AI_AUDIT=1 npx vitest run tests/unit/ai-refinement.test.ts
npx vitest run --exclude '**/math-quiz.test.ts'
npx vitest run --config tests/fixtures/golf-audit.config.ts
npx playwright test tests/browser/ai-refinement.spec.ts tests/browser/phase2.spec.ts tests/browser/phase3.spec.ts
npm run build
npm run test:bundle
npm run test:modules
```

`docs/ai-audit.json` contains seed/profile/difficulty, decisions, scores, simulation duration and measured host CPU timings. It covers 100 matches per difficulty for Classic and each of four reflex/survival games, 100 Medium Dots matches, strategy scenarios and Golf replay checks. Physics uses 100 scenarios per difficulty at 30/60/120 Hz rather than claiming full-match coverage. Exhaustive legal human continuations test Classic Impossible from both player positions across all 24 profile slots. Tests also cover difficulty separation, legal movement, terminal-state guards and worker replay.

A live development server can reload during concurrent edits. Final browser regressions use an unchanged temporary snapshot of the same source to avoid HMR interference. This is headless desktop Chrome with touch emulation, not a physical Android or memory-soak certification. Android device feel, long-session heap behavior and broader Golf seed/course combinations still need device playtesting.

## Recorded results (initial AI pass)

- 202 non-Math unit tests passed; the concurrent Math module's 7 tests subsequently passed in a separate read-only run. Earlier Math failures were left to its owner.
- 1,600 complete scripted lightweight matches: 100 per difficulty in Classic, Light Fingers, Fruit Duel, Hammer Hit and Lumberjack, plus 100 Medium Dots matches. These benchmark opponents are scripted, not estimates of human win rates.
- 300 paired Pong/Hockey scenarios, at 30/60/120 Hz, verified movement bounds and finite physics. Existing high-speed collision and 60,000-step stability regressions also pass.
- All nine Classic opening cells appeared across seeds at every difficulty. Classic Impossible remained unbeaten against all legal human continuations for representatives of all 24 personalities, playing either side.
- Light Fingers' mean sampled opening reactions were 524.6/287.1/143.7 ms; Hammer's mean strike scores were 76.57/94.88/99.67 for Medium/Hard/Impossible. The narrow Impossible score range is expected, not artificially widened.
- All four original Golf route audits completed under the revised planner. Eight seeded Hard shot scenarios confirmed comparable-shot diversity; seeded planner replay checks pass. This does not certify every seed on every course.
- Production Vite build, automatic-module discovery check and bundle check pass. The current shell is 21,183 bytes gzip; total initial JavaScript is 355,905 bytes gzip, mostly Phaser. AI modules and `MatchRandom` are absent from the initial static import graph. Concurrently added game metadata is included in these totals.
- Audit records label shared simulation CPU as `cpuBatch`; strategy/Golf records use measured search CPU. Turn-based `duration` is a synthetic thinking-time estimate; reflex/survival durations are measured simulation time. Physics records are two-second scenarios, not full matches.
- 25 distinct browser scenarios passed across the stable-snapshot runs, including tournaments, lazy loading, real touch/mouse play, Golf AI, saved identities and pause/exit worker cleanup. Two real-time input checks (Fruit and Snake) failed under a heavily loaded run and passed unchanged on isolated rerun; they remain timing-sensitive tests. The final six AI/Golf browser checks passed together in 1.1 minutes.

## Follow-up integration

The subsequent review and seven-game expansion are recorded in EXPANSION_COMPLETION.md and ANTIGRAVITY_REVIEW.md. Hammer now uses alternating full-field turns with 1.2–1.5 seconds of AI preparation before legal gauge timing. Classic/Ultimate/Connect Four have a visible minimum thinking delay; this changes presentation, not search strength. The later Golf route selector now avalanche-mixes seed/role values to prevent low-bit aliasing. Newer Golf stroke-first competition rules were preserved during integration.
