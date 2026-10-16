# Pocket Rivals
## Complete project and modification handbook

Prepared from the local source on 16 October 2026 (Asia/Dhaka).

This handbook explains the folder structure, each maintained code file, the blocks inside those files, all game families, motion and trajectory calculations, AI, persistence, Android packaging, and the practical places to edit behavior. It is intended for the project owner and friends who want to understand or modify the application.

### Read this first

All paths in this document are relative to the pocket-rivals project folder. The absolute project location is /Users/nafis/Documents/ChatGPT/Exam Grading/pocket-rivals. The surrounding Exam Grading/tmp directory contains unrelated grading scans and is outside this game handbook. The surrounding .git directory is repository metadata.

Read Chapters 1-5 to understand the application. Then open the relevant game chapter. Use the file atlas to find an exact function, line range, state field, decision condition, dependency, and return expression. Use the maintenance chapters when testing or preparing Android assets. The accompanying Markdown, code index and source reference preserve searchable, editable details.

Line numbers refer to this snapshot and will move after edits. Search for the named symbol when a number becomes stale. The code index includes SHA-256 fingerprints so a future reader can check whether a file still matches this edition. This is an explanation of the implementation, not a claim that every device, seed or strategy has been tested.

### What completeness means here

Every maintained source/configuration file and test is inventoried. Every TypeScript function, class, interface/type, method and getter found by the source parser is mapped. Anonymous callbacks are explained within their owning block; worker handlers and other top-level execution have separate entries. Class fields and module constants identify stored state and initial values. CSS has a selector/block index. Static assets, data, documents and native resources have a separate file inventory. A companion source reference reproduces the complete maintained textual sources, so small local literals and nested expressions remain available even when the PDF summarizes a large block.

Installed dependency internals, Git objects, generated bundles and caches are explained by their purpose and regeneration path. They are not hand-authored project logic. The PDF does not reproduce third-party dependency source or binary contents. No application behavior was changed to create this handbook.

# 1. The application in one explanation

Pocket Rivals is a static offline-capable game collection. TypeScript is checked and bundled by Vite. Phaser draws gameplay, while HTML/CSS draws menus and some game controls. Capacitor packages the same web build into an Android application. There is no backend or remote AI service in this project.

There are 18 registered cards: 15 rivalry entries and 3 Arcade entries, including Ultimate Golf. Tic-Tac-Toe contains Classic and Ultimate implementations behind one card. Four additional modules are preserved in future-games and do not currently register. The original five-course golf duel also remains in source, but the active mini-golf factory launches Ultimate Golf.

### The launch path

1. index.html provides #app, #menu, #game-stage and #overlays.
2. src/main.ts loads local fonts and CSS, waits for fonts, then constructs GameManager.
3. GameRegistry eagerly discovers small config.ts files from games/* and arcade/*.
4. MainMenu renders their metadata. GameSetup collects mode, difficulty and variant.
5. GameManager.play starts the reusable GameHost scene with a fresh run number.
6. GameLoader imports only the selected index.ts factory. That factory loads its implementation.
7. GameHost constructs GameContext and calls module.initialize, then module.update on the existing Phaser loop.
8. A module reports ctx.finish for a duel or ctx.finishArcade for an Arcade score. Core records the correct kind of result.
9. Pause clears controls and suspends module work. Exit destroys module-owned resources and returns to the menu.

The run number and host generation prevent delayed imports or asynchronous AI replies from affecting a later match. Do not remove those guards when simplifying navigation.

### Three different kinds of state

| Kind | Examples | Correct edit location |
|---|---|---|
| Rules and simulation | Score, legal moves, ball velocity, current phase | Game-local Rules, Physics or world class |
| Presentation | Colors, animation pose, camera interpolation, text spacing | Art, View, Renderer, UI and CSS |
| Application coordination | Current screen, tournament attempt, saved records | core and scenes |

Changing a drawing coordinate does not necessarily change collision. Changing AI preferences does not change a legal speed limit. Changing a menu description does not change the win condition. Follow the responsibility boundary to reach the actual behavior.

### A short explanation for friends

"The app has one host engine. Each game is a small independent module. Its config describes the menu card, its factory loads the game, its rules decide what is legal, its physics moves objects, its AI chooses ordinary inputs, and its renderer draws the resulting state. Shared core handles navigation, pause, sound and saved results."

# 2. Folder map and ownership

| Folder/file | What it contains | When you edit it |
|---|---|---|
| src/main.ts | Application entry, local fonts, development snapshot, web service-worker registration | Startup behavior or global stylesheet/font imports |
| src/core/ | Registry, loader, navigation, input, audio, storage, scores, tournaments, diagnostics | Behavior shared across the whole app |
| src/scenes/ | Reusable Phaser host plus DOM menu/setup/results/settings controllers | Application screens and host HUD |
| src/shared/contracts/ | Public module, result and AI types | A capability shared by independent modules |
| src/shared/interfaces/ | Compatibility re-export of the module contract | Usually no separate logic to change |
| src/shared/physics/ | Bounded fixed-step accumulator and smooth legal motion controller | Shared timing/movement helpers |
| src/shared/rules/ | First-input arbitration and Pong/Hockey match clock | Shared timing/result policy |
| src/shared/ai/ | Seeded personality/replay utilities | Common deterministic identity, not game tactics |
| src/shared/components/ | Modal, hot-seat rotation, drawing and icons | Reusable UI mechanics |
| src/shared/effects/ | Bounded impact pulse pool | Shared visual feedback |
| src/styles/ | Main app CSS, responsive menus and transitions | Global visual design |
| src/tournament/ | Tournament setup/progress/results UI | Tournament selection or progress presentation |
| src/games/ | Rivalry modules plus the Ultimate Golf entry | A specific game's rules, art, physics or AI |
| src/arcade/ | Snake and Star Patrol solo implementations | Solo score games |
| src/future-games/ | Four unregistered preserved modules | Future development or reactivation |
| examples/tap-duel/ | Small complete module template, not shipped | Learn how to add a game |
| public/ | Static icon copied directly into the build | Public web icon |
| scripts/ | Build/offline plugin, discovery and bundle checks, performance/math audit utilities | Development infrastructure |
| tests/unit/ | Rules, physics, AI and persistence tests, including deferred games | Behavioral checks |
| tests/browser/ | Active Playwright UI, touch, keyboard, worker and offline regressions | Browser behavior |
| tests/future/ | Deferred browser specs excluded by active testDir | Reactivate with their game |
| tests/fixtures/ | Legal golf shot routes, optional route search and expensive AI audit | Reproduce course completion or investigate AI |
| docs/ | Architecture, implementation history, QA, reports, screenshots and license copies | Existing explanations and evidence |
| docs/handbook/ | This guide, machine index and reproducible document generator | Update this handbook after code changes |
| android/ | Native Capacitor wrapper, Gradle configuration, resources and packaged web assets | Native identity, platform packaging and release build |
| dist/ | Generated Vite output, manifest, chunks, fonts, service worker | Rebuild rather than hand-edit |
| node_modules/ | Installed third-party packages | Recreate with npm ci; edit package.json for dependencies |
| test-results/ | Generated Playwright state/artifacts | Inspect failures; regenerate through tests |
| tmp/ | Local intermediate files, including this document's render checks | Temporary work; not runtime |
| output/pdf/ | Final generated handbook | Share the PDF from here |

### Configuration at the root

package.json defines dependencies and runnable commands. package-lock.json records exact resolved versions for npm ci; the caret versions in package.json alone are not an exact installation record. tsconfig.json enables strict TypeScript, browser DOM types and Vite-compatible module resolution. vite.config.ts sets relative URLs, ES2022 output, a build manifest, the offline plugin, and a separate Phaser chunk. vitest.config.ts configures unit testing. playwright.config.ts points to tests/browser, uses Pixel 7 emulation and installed Chrome, runs one worker, and starts dev and preview servers. vercel.json describes static hosting behavior; it does not itself deploy anything. capacitor.config.ts defines app ID/name, dist as webDir, Android background and splash behavior. index.html contains the application roots. .prettierrc.json controls formatting, while .gitignore excludes generated/local material. AGENTS.md files describe maintenance constraints, not runtime code.

### The repeated structure inside a module

config.ts owns metadata: stable ID, displayed name, instructions, ordering, colors, thumbnail, modes, variants and tournament eligibility. index.ts owns the lazy factory. assets/preview.svg is a menu image, not the live renderer. AGENTS.md states module-specific constraints. A Game controller owns lifecycle, inputs, display objects, updates and result reporting. Rules owns legal actions, score progression and terminal state. Physics/world owns movement and collision. AI owns observations and action selection. Art/View/Renderer owns drawing or interpolation. Some compact modules combine several responsibilities in one controller; use their block map in the atlas.

# 3. Core, screens and shared utilities

### Navigation and lifecycle

core/GameManager.ts is the application coordinator. Its constructor creates storage/audio/score/tournament services, the one Phaser.Game, screen controllers and event cleanup hooks. nativeLifecycle installs Capacitor foreground/back-button behavior. selectGame opens setup. play selects metadata, validates AI support, clears an old quick-match record when appropriate, creates a fresh run, exposes the opaque loading cover, resizes the canvas and starts GameHost. resizeGame uses 420x760 for ordinary modules and the available stage rectangle for responsive modules.

onReady reveals gameplay only for the current run. checkpoint routes saved state to the current tournament attempt or the quick-match key. savedMatch validates basic stored options and rejects Arcade resume. finish accepts a current duel once; finishArcade records a separate high score. pause opens the shared modal after pausing host input/module work. restart replaces the current attempt. background pauses and suspends audio. goMenu increments the run, stops the host, sleeps the Phaser loop and rebuilds the DOM menu. dispose removes application listeners and destroys shared resources.

scenes/GameHost.ts is the bridge between the selected module and core. init records options and a new generation. create sets the camera, draws the ordinary HUD unless presentation is custom, creates InputManager and lazily initializes the module. The supplied context contains scene, input, audio, options, restoredState, saveState, HUD functions and terminal result functions. update derives foreground dt from performance.now. pauseGame pauses controls first; resumeGame resets the time reference. cleanup disposes the module and its input manager. HUD score animations belong here; game score arithmetic does not.

### Metadata, screens and result routes

core/GameRegistry.ts contains the two discovery globs, stable-ID validation, order sorting, lookup and tournament eligibility filtering. core/GameLoader.ts maps an ID to the matching lazy factory and optional tutorial. Future-game paths are intentionally absent from both globs.

scenes/MainMenu.ts renders the duel/Arcade sections from metadata and binds cards/settings/tournament actions. scenes/GameSetup.ts renders local/AI selection, difficulty, variants and tutorials. scenes/Results.ts formats the duel result markup. scenes/Settings.ts controls sound, volume, explicit offline download and score-reset confirmation. tournament/TournamentScene.ts builds eligible pools and displays progress/champion/rematch controls. shared/components/Modal.ts preserves a live modal panel during content updates, handles back/close and keyboard focus trapping.

### Input ownership

core/InputManager.ts uses scene-local subscriptions. dragHalves keeps a pointer assigned to one player until release/cancel; crossing the middle must not steal ownership. tap maps pointer-up actions. drag exposes a pointer-owned start/move/end/cancel stream and optional coordinate bounds. press filters keyboard repeats for one-shot actions. keys owns held-key sets. clear resets pointers, held controls and custom clear handlers. pause disables actions and clears state; resume enables clean controls; dispose unsubscribes everything it owns.

For a new control, prefer ctx.input APIs. If a module needs a separate listener, retain and remove it explicitly. A constructor should not install active listeners; initialize is the correct place. Do not add a second requestAnimationFrame or Phaser.Game.

### Saves and scoring

| Storage key | Owner and content | Resume behavior |
|---|---|---|
| pocket-rivals.v1 | StorageManager: sound, legacy music field, volume, duel totals | Persists preferences and overall duel results |
| pocket-rivals.match.v1 | GameManager: current quick-match specification/checkpoint | Only modules that validate/restore their state resume |
| pocket-rivals.tournament.v1 | TournamentManager: schedule, results, attempt token, checkpoint | Resumes valid tournament progress |
| pocket-rivals.arcade.v1 | ArcadeScoreManager: per-game high scores | A new Arcade run starts after closure |
| pocket-rivals.ultimate-golf.v1 | GolfProgress: four casual best scores | Current course restarts after closure |
| pocket-rivals.golf-versus.v1 | CompetitiveStats: golf competition counters | Separate from casual course records |
| pocket-rivals.math-history.v1 | QuestionHistory: up to 150 recently used IDs | Avoids recently seen questions across sessions |

StorageManager validates primitive settings, clamps volume to 0..1, and keeps record writes in an in-memory map if localStorage is unavailable. ScoreManager begins a fresh round and records a duel winner once. ArcadeScoreManager validates finite scores and retains a maximum by game ID.

TournamentManager stores phases between, playing and complete. shuffledSchedule makes shuffled bags from the eligible pool and supports 1..25 rounds. startRound returns the current spec, checkpoint and token. A token includes tournament ID, results index and attempt. restartRound increments the attempt and discards its checkpoint. finish verifies phase/token, stores one result, adds one point for a win or half per player for a draw, and moves to the next phase. restore rebuilds points from results rather than trusting stored totals. GameManager separately rejects an unavailable or Arcade game at launch. To change tournament points, edit addPoints, then update restore/result expectations consistently.

### Timing, AI and feedback helpers

FixedStep.advance clamps one render delta to 0..0.1 seconds, performs at most twelve 1/120-second ticks, and exposes a remainder/fraction for rendering. reset clears pending catch-up on lifecycle boundaries. Do not use this capped time for a strict real-time match deadline. GameHost's foreground elapsed time and MatchClock serve that purpose.

MatchClock starts with 120 seconds and a five-point target. A lead at regulation expiry wins; 0-0 draws; a nonzero tie starts 60 seconds of sudden death. The first subsequent lead wins; an unresolved overtime draws. Pong/Hockey retain this clock through goals. Changing only PongWorld.goal's target leaves MatchClock inconsistent; edit both.

MotionController smooths a requested target using 1-exp(-18*dt), limits desired speed by distance and braking distance, limits acceleration, and applies a subpixel deadband. It returns an ordinary target position; each game still enforces its own legal field and speed.

FirstResponse stores at most one entry per player, waits at least 9ms before resolution, and treats entries within 8ms as tied. Those are model-time arbitration tolerances, not a guarantee about physical touchscreen latency.

MatchRandom owns seeded pseudo-random decisions and a 24-profile identity: role, tempo and side. freshSeed can read development aiSeed, otherwise uses crypto when available. sample creates bounded jitter; rank breaks comparable choices deterministically; turnSeed gives repeatable turn seeds. replayMode enables deterministic candidate caps for development audits. Game-specific tactics stay in each AI file.

WorkerTask permits one outstanding computation, terminates it when replaced/canceled, reports measured time, and applies a 2-second watchdog. Controllers add generation/turn guards before accepting a result. Cancel workers on pause and disposal.

AudioManager synthesizes short Web Audio effects from the effects map. Each entry controls frequencies, waveform, duration and gain. play applies a per-kind rate limit, a maximum of ten active oscillators, shared mute/volume and a short envelope. unlock is called after interaction; optional audio failures do not block play. There is no soundtrack despite the compatibility music field.

TurnView rotates module-owned content for local Blue turns and supplies an exact inverse point transform. Its 280ms transition blocks actions until ready. Host navigation stays fixed. Impacts uses a 14-pulse pool. drawing.ts provides outlined primitives/text; icons.ts supplies small SVG UI icons. ThemeManager is the central palette and default 420x760/FIELD geometry. Diagnostics provides development counters; main.ts exposes the read-only __POCKET__ snapshot only in development.

# 4. Motion and trajectory: how the numbers become movement

### Units and coordinate spaces

Most games render in a 420x760 logical canvas with x increasing right and y increasing down. FIELD is left 24, right 396, top 112, bottom 650 and middle 381. A velocity is logical units per second; acceleration is units per second squared; dt is seconds. Increasing positive vertical velocity moves downward.

Some games use a smaller internal arena and map it to the canvas: Happy Birds 320x460, Spike Attacks 320x320, Gravity Runner cross-track y 0..170. Ultimate Golf keeps original 1920x1080 source coordinates. Never copy a display pixel value into its physics without applying the inverse transform.

### Integration and collision

A common fixed-step update is velocity += acceleration*dt, then position += velocity*dt. This is semi-implicit Euler. It approximates a continuous path with small legal steps. An analytic trajectory such as y(t)=y0+v0*t+0.5*g*t*t is useful for an explanation or initial AI estimate, but it does not include the engine's collisions, moving hazards, discrete releases or state changes.

A circle collision uses a unit contact normal n and relative velocity u=v-objectVelocity. The dot product u.n tells whether the bodies approach. Reflect only an approaching velocity, then project the overlapping body outside the obstacle with a small clearance. This avoids repeated reversals and sticking. Swept tests examine the segment between previous/current positions so fast motion cannot jump over a thin target.

Presentation interpolation computes a display position between captured physics states using FixedStep.fraction. It smooths frames without changing the authoritative state. Changing View smoothing changes appearance; changing Physics changes outcomes and AI forecasts.

### Trajectory owner map

| Movement or trajectory | Authoritative file/block | Related prediction/presentation |
|---|---|---|
| Pong flight, paddle bounce, serve | games/pong/PongPhysics.ts: PongWorld.step/goal | PongAI.reflectedX/update; PongGame trail |
| Hockey puck, mallets, posts, rounded rails | games/air-hockey/AirHockeyPhysics.ts and rink.ts | AirHockeyAI, MotionController, PossessionClock |
| Active golf ball, surfaces, attraction and hazards | games/mini-golf/ultimate/GolfPhysics.ts: tick | GolfDynamics, GolfCollision, ShotPlanner, GolfRenderer |
| Active golf pullback/camera | ultimate/GolfInput.ts: shotVector/project/unproject | UltimateGolfGame gesture ownership |
| Legacy golf ball | games/mini-golf/GolfPhysics.ts: golfStep | Legacy GolfAI/ai.worker; inactive factory path |
| Gravity flip and trap contact | gravity-runner/RunnerPhysics.ts: advanceRunner | ObstacleGeometry, GravityAI forecasts, GravityView |
| Bird flight and triangle spikes | happy-birds/ArenaPhysics.ts: advanceBird | Rules.speed, BirdsAI forecasts, BirdView |
| Bird recovery curve | happy-birds/Recovery.ts: advanceRecovery | recoveryPose/recoveryColor, BirdArt |
| Star collection sweep | happy-birds/Stars.ts: pickupDistance | Rules.step chooses nearest eligible bird |
| Spike piston motion/player routing | spike-attacks/Rules.ts: tick and ArenaPhysics.ts | SpikeAI, SpikeView and SpikeArt |
| Hammer puck and bell oscillation | hammer-hit/StrikePhysics.ts | HammerGame presentation; Rules owns score |
| Fruit sword swing and return | fruit-duel/SwordMotion.ts: swordPose | FruitGame uses Rules' swing start/recovery duration |
| Snake grid motion | arcade/snake/SnakeRules.ts: tick | SnakeGame interpolation |
| Shooter projectiles/formation | arcade/space-shooter/ShooterWorld.ts: step | SpaceShooterGame geometric rendering |
| Basketball jump/release/hoop crossing | future-games/flappy-jump/Rules.ts: step | projectedLanding and FlappyAI |
| Car body and rotation | future-games/car-duel/Physics.ts | CarAI, shared point/head/colliders geometry |
| Chicken/block landing | future-games/chicken-jump/Rules.ts: step | ChickenAI alignment offset |
| Archery moving crosshair | future-games/archery-duel/Rules.ts: step | ArcheryAI locks actual crosshair |

Board tokens, gem reaches, tube fill and stopwatch graphics have animation paths, but their scores are determined by discrete rules or timing rather than a projectile simulation. Their controller/render blocks are mapped in the atlas.

### Example: changing a jump or flap

For Happy Birds, GRAVITY is 650 and FLAP is -195. In free flight, the analytic rise after a flap is approximately FLAP^2/(2*GRAVITY)=29.25 units and time to apex is 0.30s. Actual gameplay uses 120Hz integration and wall/ceiling/floor contacts. A more negative FLAP increases the rise; increasing GRAVITY makes descent faster and reduces rise at the same flap velocity. Update the common constants so AI forecasts and human motion continue to share physics. Recheck arena reachability, star access and collision tests.

For Hammer Hit, StrikePhysics launches from y=602 with acceleration 2200. Initial upward velocity is -sqrt(2*2200*height). A score of 100 uses height 365 and reaches the bell; other scores use height=(score/100)*348 and peak below bell contact y=254. This is a visual consequence of a legal score. Editing it must not award more points.

For Gravity Runner, a flip reverses the gravity sign; it does not replace vy with a new jump impulse. The runner therefore takes time to brake and reverse. Gravity is 900 and legal flips are separated by 0.16s. That momentum explains why a late flip can fail even when a visual opening looks reachable.

### Presentation paths and animation variables

These paths are visual feedback unless their row explicitly shares a legal cooldown. They are useful when a friend asks to make an action feel faster without changing its score.

| Effect | Exact expression / owner | What to change |
|---|---|---|
| Fruit split halves | FruitGame.update: x=210+side*t*125; y=381-45*t+150*t*t; angle=side*t*1.5, after the0.15s impact beat | 125 changes sideways spread;45 initial rise;150 downward curvature;1.5 rotation |
| Fruit droplets | x=210+cos(a)*t*130; y=381+sin(a)*t*90+100*t*t, eight droplets fading over0.6s | 130/90 spread axes;100 falling curvature; keep the count/lifetime bounded |
| Sword return | SwordMotion.swordPose: rest->wind over0.065s, impact at0.15s, follow-through until0.26s, return by the shared recovery duration | Pose arrays change x/y/angle; durations must match Rules input unlock |
| Gem grab | LightGame.update: hand travel=sin(clampedAge*pi)*140; winning gem uses smoothstep from age0.32 over0.5s toward x+/-45,y+/-200 | Change amplitude or eased destination without changing signalAt/arbitration |
| Lumber chop | LumberGame.update: scroll*=exp(-26*dt); swing=max(0,swing-7*dt), scroll capped28 | Decay26 changes settling;7 changes swing duration; side switches remain immediate |
| Gravity facing/landing | GravityView.sample: angle approaches target by1-exp(-22*dt); landing*=exp(-16*dt) | Changes visual rotation/impact, not gravity sign or vy |
| Bird facing/body/trail | BirdView.sample: facing blend26, body angle blend14 from clamped vy/400; bump decay18; six trail positions sampled every0.045s | Tune responsiveness/trail appearance while preserving collision radius |
| Spike facing | SpikeView.sample: shortest angular delta blended by1-exp(-18*dt); position and shaft length use fixed-step alpha | Changes drawing smoothness; legal movement and piston contact stay in Rules/Physics |
| Classic symbol entrance | ClassicGame.update: t=min(1,age/0.2); scale=1+2.7*(t-1)^3+1.7*(t-1)^2 |0.2 is duration; coefficients produce overshoot; board legality is immediate |
| Connect Four token drop | ConnectFourGame.update: t=min(1,age/0.3); y=182+(targetY-182)*(1-(1-t)^2) |0.3 changes fall time; keep the input lock synchronized |
| Water fill/reveal | WaterGuessGame.update: fillProgress+=1.3*dt to1; reveal advances after3.2s |1.3 changes fill speed;3.2 changes feedback wait; percentages remain integers |
| Timer reveal/clock tick | PerfectTimerGame.update: reveal waits3.2s; tick=floor(foregroundMs/500) |3.2 changes result pacing;500 tick cadence; human/AI stop time stays TimerClock |


# 5. Active rivalry games

## 5.1 Pong - folder games/pong

Pong keeps the stable registration ID ping-pong. PongGame.ts exports the PingPong controller. It initializes graphics, inputs, AI and optional restored rally; update obtains legal targets, runs fixed physics, advances the separate MatchClock, draws paddles/ball/trail and checkpoints about once per second. paddleTarget interprets keyboard or pointer ownership. goal triggers feedback but does not reset the match deadline. pause saves and clears timing; dispose releases graphics/effects. PongState.ts serializes and validates position, velocity, scores and clock rather than trusting arbitrary local data.

PongPhysics.ts is the motion authority. The ball starts at (210,381), radius 9, velocity (110,340). Paddles start at y 608 and 154, half-width 44, and move at at most 1800 units/s. step advances the ball, reflects side walls, detects a swept crossing of each paddle plane, and awards a point after the ball passes the top/bottom. On a paddle contact, hit=(ball.x-paddle.x)/44 is clamped to -1..1. New speed=min(820,oldSpeed*1.055+8). Horizontal velocity includes sin(hit*1.03)*speed plus paddle.vx*0.13 and is capped at 0.88*speed; vertical velocity preserves total speed. goal uses 1.1s serve cooldown and alternates horizontal serve direction.

PongAI.ts predicts the intercept with reflectedX, a triangular-wave fold that accounts for repeated side-wall bounces. Medium uses delay 0.24s, error 56 and speed 420; Hard 0.075/14/820; Impossible 0.018/0/1750 before personality adjustments. A once-per-flight offensive shot offset seeks an angle away from the observed rival, but is abandoned when interception needs the full reach. MotionController smooths targets and the world still enforces legal speed/position.

| Desired change | Exact owner | Consequence/check |
|---|---|---|
| Ball faster after each hit | PongWorld.step speed expression | Recheck swept hits and maximum 820 cap |
| Wider paddle | Half-width 44 in physics, bounds, drawing and AI offsets | Keep hit normalization and visual width consistent |
| Win at a different score | PongWorld.goal and shared MatchClock.score | Both world and deadline result rules must agree |
| Longer match | shared/rules/MatchClock.ts | Also affects Hockey |
| Easier AI | PongAI.update settings | Keep world limits; do not teleport paddles |

## 5.2 Air Hockey - folder games/air-hockey

AirHockeyGame.ts coordinates world, two targets, keyboard/touch input, MatchClock, PossessionClock, save checkpoints and rendering. AirHockeyPhysics.ts exports HockeyWorld. The puck radius is 11; mallets radius 29. Targets are clamped to each half and capped at 1500 units/s. Each 120Hz step contains three collision substeps with mallets interpolated across them.

step applies exp(-0.1*substep) damping, moves the puck, resolves mallet/rail/post contacts in bounded passes, repairs pinches and caps speed at 1100. malletContact uses relative velocity and coefficient 1.9 on the approaching normal. posts uses 1.96. These correspond to near-elastic responses while preserving tangent motion. rink.ts owns CORNER=44, GOAL_HALF=63, rounded corners, goal-mouth clearance and reachablePuck. Moving a drawn goal alone will not move the scoring region.

solvePinch searches 64 nearby legal contact positions. checkUnplayable waits 0.75s for unreachable/invalid geometry before local repair. A reachable stationary puck is legal and must not be reset for being slow. awardPoint resets the puck/mallets and 1.1s cooldown. HockeyState.ts validates the combined physics and clock checkpoint.

PossessionClock counts continuous residence on a half with center +/-3 hysteresis and a 15s violation. Contacts do not reset it. The controller awards the rival a point for a violation. AirHockeyAI.ts predicts incoming reflected flight or routes behind the puck to strike downfield. Medium/Hard/Impossible delay-error-speed values are 0.19-24-530, 0.065-7-1050 and 0.02-0-1450, with personality variation and legal MotionController output.

To change table geometry, edit ThemeManager/rink plus drawing, restore validation and AI prediction bounds together. To alter friction, edit the exponential damping in HockeyWorld.step. To tune goals, edit inMouth and post geometry together. To alter the possession rule, edit PossessionClock rather than mallet contact. Relevant checks are engine, phase2, phase3 and air-hockey-keyboard.

## 5.3 Tic-Tac-Toe - folder games/tic-tac-toe

index.ts lazily selects classic/ClassicGame.ts or ultimate/UltimateGame.ts from one config entry. shared/lines.ts defines eight 3x3 winning triples. ClassicRules.ts owns nine cells, current player, winner, winning line and legal history. play rejects illegal/finished moves, updates the line/draw and changes turn. restore replays a history through play. ClassicGame.ts maps input, animates symbols and turn backgrounds, schedules ordinary AI decisions and reports one result.

ClassicAI.ts implements alpha-beta minimax through classicMove. ORDER prefers center, corners, then edges as a search ordering, with seeded comparable-choice variety. ClassicAI.choose wraps mode-dependent choice and personality. Classic Impossible is the one mode whose unbeatable legal play is exhaustively covered by tests. Adjust difficulty behavior here; altering the shared WIN_LINES changes the game rules.

UltimateRules.ts owns 81 cells, nine board results and forced board routing. A move is encoded board*9+cell. Playing a cell directs the next player to that numbered local board; a closed destination permits any open board. Local wins contribute to the macro board. clone supports independent search; key represents search state; save/restore use legal histories.

UltimateSearch.ts evaluates local and macro threats and performs bounded iterative deepening with ordered moves, alpha-beta and a transposition table. UltimateAI.ts delegates to a cancellable worker. UltimateGame.ts owns pending/generation guards, normal/focused coordinate mapping, highlighting, animation, save points and lifecycle cancellation. UltimateTutorial.ts is the interactive setup explanation. ai.worker.ts restores a search board and returns a chosen legal action.

To change focus layout, edit UltimateGame.drawBoard and pointer conversion while preserving board*9+cell. To tune strength, edit UltimateSearch budgets/evaluation and UltimateAI setup rather than the legal rules. To change routing, start in UltimateBoard.play/legal and update tutorial/tests. Ultimate Impossible is bounded practical search; do not describe it as guaranteed optimal.

## 5.4 Connect Four - folder games/connect-four

ConnectFourRules.ts creates the 69 winning four-cell windows for a 7-column, 6-row board. drop finds a free cell under gravity, records history, detects a win/draw and advances turn. legal returns nonfull columns. undo reverses a search move. restore replays legal drops; it does not accept arbitrary stored cells.

ConnectFourGame.ts maps taps to columns, blocks input during falling-token animation or an AI turn, checkpoints complete moves and checks generation/disposal before accepting a worker reply. The delay is presentation/AI scheduling; the rules determine the true board. ConnectFourAI.ts evaluates center control and four-cell patterns, then uses bounded iterative-deepening alpha-beta with move ordering and transposition entries. Search temporarily mutates and undoes only its private board. The worker owns its restored copy.

To change AI valuation, edit evaluate. To change search strength, edit difficulty budgets/depth/node settings inside searchConnectFour. To change grid dimensions, update all indexing/window generation, rules, hit mapping, drawing and tests; replacing only a display width is insufficient. To change token animation speed, use ConnectFourGame's animation-age calculations without changing board gravity. Relevant coverage includes phase3, engine and AI refinement.

## 5.5 Dots and Boxes - folder games/dots-and-boxes

The current config exposes 4x4, 5x5 and 6x6 box variants. Rules.ts is parameterized: size n has n*n boxes, (n+1)*n horizontal edges and 2*n*(n+1) total edges. The supported variants therefore use 40/60/84 edges and 16/25/36 boxes. Some older project notes describe only 4x4; the source is authoritative.

createBoxes builds each box's four edge IDs. createAdjacent maps an edge to adjoining boxes. DotsBoard.play validates the edge, assigns its owner, claims every newly completed box, adds score and keeps the turn if at least one box was captured. A single edge can complete two boxes. When all boxes are owned, the higher score wins. clone gives an independent board; save/restore preserve size and a replayed edge history. edgeEnds converts an edge ID into visible endpoints. pickEdge selects a nearby middle portion with a size-scaled threshold.

AI.ts estimates sacrifice damage/chains, orders capture/safe/strategic moves, handles the extra-turn rule and runs bounded alpha-beta/endgame search. ai.worker.ts returns a chosen edge. DotsGame.ts owns selected-edge keyboard navigation, taps, animation, worker cancellation and background/turn feedback.

To add a board size, update config variants, board-size validation/cache tables, the controller's variant parsing and geometry assumptions, search budget, save/test expectations and preview. To make taps more forgiving, edit pickEdge's threshold, keeping endpoint ambiguity controlled. To change the extra-turn rule, change play and AI search turn handling together. The current extra turn is deliberate and central to chain strategy.

## 5.6 Hammer Hit - folder games/hammer-hit

Rules.ts owns ATTEMPTS=3, a separate gauge clock/cooldown per player, needle and strikeScore. needle=sin(time*(2.6+attempt*0.35)-pi/2). strikeScore=round(100*(1-min(1,abs(position)))). hit records an integer score, resets that gauge and imposes 1.1s reveal cooldown. totals decide the winner; averages divide totals by three for display only. Never choose a winner from rounded averages or best strike.

HammerGame.ts presents alternating full-field turns, resets the active gauge after handoff, delays AI preparation, owns TurnView for local Blue, and blocks new input until strike feedback finishes. It subdivides the bounded host update for 600Hz gauge/AI timing. Search its active-player, preparation and update blocks when changing handoff pacing. Pause freezes gauge, handoff and presentation clocks.

AI.ts samples a target score band once per strike and hits the actual needle through the ordinary legal action. Impossible chooses 97..100 with probability 70%, 90..96 with 25%, and 75..89 with 5%; 97 belongs to the top band. It never assigns a score directly. Hard/Medium have their own band tables.

StrikePhysics.ts owns the presentation-only ballistic puck. step integrates y/velocity, handles separating bell contact with 0.28 rebound, and settles at y=602. ImpactRing is a damped spring: angular acceleration=-65*angle-9*velocity; strike adds 2.8 angular velocity. Change those for visual ringing, not score. The hammer's grip remains a fixed pivot in the controller drawing.

To increase attempts, update ATTEMPTS, controller turn/labels/results and AI's current length===3 guard. To widen the scoring sweet spot, edit strikeScore and update AI target interpretation/tests. To tune gauge frequency, edit needle. To tune strike height, edit StrikePhysics only. Unit checks separate rules, AI and presentation.

## 5.7 Light Fingers - folder games/light-fingers

Rules.ts owns waiting -> signal -> active -> between -> done. The gem initially waits 1.5..4.5s. The controller draws the signal, then calls presentSignal to make it legally claimable. This prevents AI responding to a hidden state before players could see it. tap during waiting/between is a false start and blocks only that player for 1.25s; signal-stage taps are rejected. Active taps go through FirstResponse. A same-instant tie leaves the gem available and locks both briefly. A successful steal gives one point to its owner, while an idle rival is not penalized. First to five wins; the between beat is 1.1s.

LightGame.ts wires taps/keys, updates the model/AI, presents the visible signal, follows reach/steal animation and reports a finished match once. LightArt.ts draws original gloves, forearm, plinth and gem. Reach animation follows the outcome and never delays arbitration. AI.ts starts its delay from signalAt, with means 0.53/0.29/0.145s and a 0.12s floor; it uses the same tap method and can retry after a tied cooldown.

To change waiting suspense, edit the two waiting-duration expressions in Rules. To change false-start punishment, edit blockedUntil durations and related AI retry pacing. To change score target, update the score===5 terminal check and visible instructions. To change reach appearance, edit LightArt/controller animation without moving presentSignal after a long animation. Relevant tests cover false starts, visibility, ties, cooldown and completed matches.

## 5.8 Fruit Duel - folder games/fruit-duel

Rules.ts defines seven real fruits (IDs 0..6) and three decoys (7 gift, 8 medal, 9 flower). Every real fruit scores; there is no target-memory task. reveal guarantees a real fruit within three reveals, otherwise chooses fruit with probability 0.58. show waits for the controller's present call, then active lasts 0.85..1.25s. A legal fruit tap captures its ID immediately, preventing a later reveal from changing the judgment. FirstResponse resolves the race; ties award no point. First to ten wins.

SwordMotion.ts is shared by rule cooldowns and rendering. SWING_IMPACT=0.15, HIT_RECOVERY=0.72, MISS_RECOVERY=1.35 seconds. swordPose interpolates mirrored rest/windup/impact/follow-through/return poses with smooth easing. The sword returns to its original backed-away rest exactly when input unlocks. Current swordPose uses index0 for the base pose arrays and mirrors Blue by x=420-x, y=762-y, angle+=pi. Editing an unused second array entry alone has no effect; edit the base pose or the mirror transform. Empty/decoy swings cause recovery but do not give the rival a point.

FruitGame.ts owns retained graphics, bounded halves/droplets, swing start times, impact-delayed slice sound/visuals and result feedback. FruitArt.ts draws fruit interiors, decoys and the curved sword. AI.ts reacts only to presented objects, samples recognition error once per reveal, and calls the same tap. Impossible intentionally attacks no decoys; reaction means are 0.46/0.275/0.145s with a 0.12s minimum.

To add a fruit, change the ID arrays, isFruit, reveal's hardcoded 7/3 ranges, FruitArt and any AI/tests assuming ten kinds. To slow returns, edit SwordMotion durations so rendering and input remain synchronized. To alter reveal cadence, edit Rules.present and preview/between deadlines. To change the target, edit the scores>=10 terminal rule plus metadata. The retained target field stores the latest real fruit; it is not an instruction to match a remembered target.

## 5.9 Math Quiz - folder games/math-quiz

MathGame.ts constructs a QuizMatch and question provider, renders the DOM MathUI, maps Orange 1/2/3 and local Blue 7/8/9, calls present after rendering, and reports the winner once. Rules.ts arbitrates the first answer with FirstResponse: first correct earns one point, first wrong gives the rival one point, same-instant responses advance without a point, first to ten wins. The between-question beat is 1.4s.

questions/Question.ts defines a MathQuestion with ID, topic, difficulty, questionLatex, exactly three optionsLatex, correctIndex 0..2, explanationLatex and estimatedSeconds. It also owns fraction normalization, LaTeX formatting and answer shuffling that remaps correctIndex. Basic.ts generates seven basic arithmetic categories with exact integer/rational answers and plausible distractors. ProceduralUniversity.ts generates university families across eight topics. university.json is the static 100-question bank. Bank.ts combines and deduplicates static/procedural IDs, groups by topic, prioritizes unseen questions and interleaves a finite deck. History.ts persists a bounded 150-ID set and removes oldest entries. It is implemented as an insertion-ordered Set with FIFO eviction, not a separate array ring structure.

MathUI.ts creates KaTeX DOM content, player-local topic labels and three option buttons. It rotates the Blue section for local play and auto-fits both axes after font readiness and resize. quiz.css owns equation/button spacing and text layout. AI.ts chooses a difficulty-calibrated answer after visible question latency; it changes neither the bank nor score directly.

To add static questions, preserve the JSON shape, stable unique ID, three distinct options and exact correctIndex. Run math-quiz tests; use verify-math-bank.py only when intentionally regenerating the static bank, because it overwrites that JSON and its report. To add a procedural family, extend the corresponding generator and validity/uniqueness checks. To change repetition memory, edit MAX_HISTORY in History. To improve readability, edit MathUI/quiz.css rather than shrinking physics coordinates. To change target points, update QuizMatch.update and instructions. The file atlas maps all generator helpers individually.

## 5.10 Lumberjack - folder games/lumberjack

Rules.ts is compact but owns all gameplay. branches uses a seeded linear congruential sequence, starts with two clear segments and prevents adjacent branches from occupying opposite sides. Both players consume the same pattern independently. safe checks both current and next branch before a chop. chop changes side, applies 0.085s cooldown, kills an unsafe chop or increments score/reset idle. limit=max(0.32,1.5-score*0.035) seconds is the allowed idle time. A round lasts at most 20s. After both are dead, scores add to totals; at least three rounds play, with extra rounds while cumulative totals tie. Between rounds lasts 1.4s.

LumberGame.ts maps left/right actions, drives model/AI and draws two independent trees with local Blue orientation. LumberArt.ts owns foliage, original characters, seven visible 28-unit segments, axes and edge meters. Chop displacement is capped and decays; character sides change immediately, avoiding motion through the trunk.

AI.ts selects a legal side from the same visible seven segments and returns an ordinary chop choice. Mean decision intervals are 0.42/0.245/0.135s with personality variation. Hard/Impossible bound decisions to the remaining idle budget; Impossible deliberately chooses no branch. Some Medium/Hard recognition errors remain intentional.

To make play easier, increase the idle budget or reduce its score slope, then retune AI pacing and edge-meter presentation. To lengthen rounds, change ROUND_SECONDS. To change stream density, edit branches while preserving a legal side. To change number of rounds, edit round>=3; ties still continue. To change visuals, edit LumberArt/controller offsets, keeping the seven visible segments consistent with AI lookahead.

## 5.11 Water Guess - folder games/water-guess

WaterGuessRules.ts stores percentages as integer hundredths of one percent: 5000 means 50.00%. MIN_PERCENT=1000 and MAX_PERCENT=9000 generate 10.00..90.00% targets. startNewRound avoids used values with a bounded 100-attempt fallback. submit rejects nonfinite input, clamps/rounds to 0..10000 and allows one guess per player. resolveRound compares absolute integer errors, awards the closer player one point, awards none on equal error, and caches the result so repeated calls cannot add points. Five rounds are followed by sudden death while scores tie.

WaterGuessGame.ts is the turn/fill/guess/reveal controller. setupKeypad builds the numeric buttons; setupInputs handles digits, decimal, backspace and submit. appendDigit/appendDecimal maintain the buffer; startRound animates fill; submitCurrentGuess commits; triggerReveal shows the answer/errors; advanceNext progresses. It uses TurnView for full local Blue field/keypad rotation and its inverse for pointer hits. It rejects actions while transitioning and waits for AI preparation using foreground update time.

Geometry.ts owns TUBE_HEIGHT=310, shared with WaterRenderer and AI. WaterRenderer.ts draws the outlined tube and liquid. WaterGuessAI.ts rounds the hidden level to the visible one-logical-pixel tube measurement, then applies difficulty/personality bias and noise. Spread is 550/170/0 hundredths for Medium/Hard/Impossible. Impossible therefore has pixel quantization rather than oracle-perfect hidden decimal access.

To change target range, edit MIN_PERCENT/MAX_PERCENT. To change rounds, edit TOTAL_ROUNDS and every controller label/terminal assumption. To change tube height, edit Geometry and renderer endpoints together. To change accepted precision, update parsing, integer units, display and comparisons consistently. parsePercentInput uses parseFloat and a forgiving fallback, while submit enforces finite numeric input; strict text validation would require an explicit parser change and tests. Changing display precision alone must not silently change legal error comparison.

## 5.12 Perfect Timer - folder games/perfect-timer

PerfectTimerRules.ts stores durations in integer centiseconds. TARGET_PRESETS=[500,743,1000,1267,1525] means 5.00, 7.43, 10.00, 12.67 and 15.25s. startNewRound prefers unused presets, then generates 500..1500 with a bounded deterministic uniqueness fallback. recordStop takes elapsed milliseconds, rejects invalid/negative values, rounds elapsedMs/10, and records each player once. resolveRound compares absolute errors, awards the closer player and caches its result. Five rounds extend into sudden death on a tie.

TimerClock.ts is the time authority. start records performance.now, elapsed returns carried plus foreground running time, pause banks elapsed, resume starts a fresh reference. PerfectTimerGame.ts uses it for both human events and AI deadlines, so background/pause time never leaks into a stop. Its controller phases include ready, countdown, timing and reveal. handlePlayerAction performs the phase-appropriate action; startTimingPhase starts the clock; triggerReveal resolves only after both stops; advanceNext opens the next round. Both players stop the same timer simultaneously; there is no per-stop rotation.

PerfectTimerAI.ts schedules a legal deadline in milliseconds from the same foreground elapsed clock. Error spreads are 72/21/0 centiseconds with persistent fast/slow personality bias. Impossible targets the exact visible duration. TimerRenderer.ts draws the stopwatch. The controller plays a quiet clockTick at most once per current half-second index, avoiding catch-up bursts, and clockStop on an actual stop.

To change durations, edit TARGET_PRESETS plus fallback range if desired. To change precision, update centisecond conversion, formatting, AI units and tests together. To tune AI error, edit spread in scheduleRound. To change timer art, edit TimerRenderer; do not replace TimerClock with raw elapsed from an unadjusted initial timestamp. To change round count, update TOTAL_ROUNDS and controller labels/assumptions.

## 5.13 Gravity Runner - folder games/gravity-runner

Rules.ts exports GravityMatch. Both runners share one endless seeded course and progress distance. A run ends on collision, not a time deadline. A sole survivor gets one point; simultaneous deaths replay. First to five wins. flip reverses gravity and applies a 160ms lock. speed(age) starts at 120, then six smooth +24 ramps, beginning after 8s and then every 20s over a 3s easing window, reaching 264. distance advances using that age-dependent speed.

RunnerPhysics.ts owns cross-track y, vy, gravity, alive and cooldown. advanceRunner uses gravity 900, supports intact outer walls at centers y 10/160, detects wall gaps with a 13-unit longitudinal reach, allows swept landings on runnable platform faces, rejects front penetration/late wall rescue, applies trap contact and kills escape beyond -22..192. The collision footprint is 26x18. There is no runner-to-runner collision.

CourseStream.ts selects weighted map-specific motifs excluding the previous two choices: single, switchback, cluster, gaps, slalom, rail, pinch and islands. It guarantees an early rail teaching section. Geometry is generated ahead about 2100 units, retired behind about 400, and history is capped at 16. Independent hazards retain at least 245 clearance. Rail gaps begin/end 180 units inside the supporting platform; pinches retain outer walls. Maps.ts is lightweight metadata/preview colors. TRAPS chooses ice icicle/block, green root/bramble, blue jet/buoy and purple crystal/phase families.

ObstacleGeometry.ts is shared by collision, art and AI. obstacleBounds computes timed jet depth and phase-gate activity/warning from the same round age. obstacleOutline returns canonical convex polygons. touchesTrap uses separating-axis tests for the runner rectangle against nonrectangular traps. AI.ts forecasts legal advanceRunner steps, tests bounded one/two-flip plans and uses difficulty-specific reaction/lookahead. GravityView interpolates display only; GravityArt/TrapArt draw the corridor, runners and canonical traps. GravityGame owns controls, fixed ticks, view capture and results.

To change difficulty ramp, edit speed, not a screen scroll coefficient. To change gravity/footprint, edit RunnerPhysics plus shared shape extents and revalidate forecasts/courses. To change obstacle density, edit CourseStream clearance/count/width rules, retaining reachability. To add a map, extend Maps and TRAPS, then tests. To change jet/gate timing, edit the generated period/phase and ObstacleGeometry formula. Never let AI use a different age from human collision or drawing.

## 5.14 Happy Birds - folder games/happy-birds

Rules.ts exports BirdsMatch: one shared 320x460 arena, two auto-flying birds, one star and first-to-15 scoring. There is a 1.1s opening beat, no match deadline or round reset, and individual recovery rather than rival survival points. speed=min(165,115+age*0.25). flap sets vy=-195, applies 140ms lock and increments a visual serial. ArenaPhysics uses gravity 650, radius 15, wall-triangle collisions, ceiling/floor hazards at 16-unit borders and safe horizontal bounces. Birds do not collide with each other.

Rules.wall creates a seeded three-row safe opening and four spike rows. schedule previews a change for 0.4s; clear defers committing it until both active birds are over 100 units away. A collision calls beginRecovery for that bird only. Recovery.ts freezes ordinary input/physics/collection for 3s, captures the impact, smoothly curves toward home (140/180,230), fades from gray and relaunches upward at -125. Recovery is model-time and pauses with gameplay.

Stars.ts sets STAR_GOAL=15 and STAR_RADIUS=10. spawnStar samples up to 64 arena candidates within x58..262 and y110..350, preferring at least 65 distance from active birds and 80 from the previous star; bounded failure uses the best-clearance candidate. pickupDistance computes distance from the star to the swept bird segment. Rules waits 0.18s birth time, awards the nearest eligible touching bird, shares credit for exactly equal distances, removes the collected star and spawns one replacement. Recovering birds cannot collect. Bursts expire after 0.5s.

AI.ts routes to real stars and safe wall openings through legal flaps with the same physics. BirdView handles interpolation, facing/wing motion and recovery reset. BirdArt draws original birds, hinged wings, spikes, stars and bursts. BirdsGame handles Orange lower/Blue upper inputs, AI scheduling, view capture and result reporting.

To change target points, edit STAR_GOAL and all target labels/metadata. To change flap behavior, edit ArenaPhysics constants and retest forecasts/reachability. To change recovery duration/path, edit Recovery's time/easing/home/relaunch consistently. To change star placement, edit spawnStar constraints and birth/pickup checks. To change wall density, edit Rules.wall/schedule while preserving safe openings and telegraph clearance.

## 5.15 Spike Attacks - folder games/spike-attacks

Maps.ts defines Courtyard, Split Steps and Crosswind plus seeded Random selection. Each map has three rectangular cover blocks and two spawns. MapPreview.ts draws metadata previews. ArenaPhysics.ts is authoritative for SIZE=320, RADIUS=9, SPEED=160, SHAFT=72, lane centers, legal points, cover-limited attackDepth, pistonHits and movement sliding around expanded blocks. Each edge has four 80-unit lanes; 72-wide shafts leave gaps too small to hide a radius-nine player. Both players face the same hazards and do not collide with one another.

Rules.ts owns warning -> extend -> hold -> retract -> recover. warning=max(1.05,1.85-(wave-1)*0.045); extensionSpeed=min(940,620+(wave-1)*18). Every piston extends only to the cover-limited attackDepth. Hold lasts 0.32+min(0.18,wave*0.008)s. Retraction uses smoothstep over 0.64s; recovery lasts 0.18s. nextWave chooses a seeded different direction. tick moves players and checks the maximum old/new extension to cover swept danger. Sole survival scores; same-step deaths replay; first to five wins.

The 120s match deadline is advanced separately by advanceClock using foreground dt and persists through round resets. Tied expiry draws. SpikeAI constructs bounded candidate safe points and a visibility graph around expanded map blocks at wave changes, then follows ordinary speed-limited targets. SpikeView interpolates position, shaft lengths and facing. SpikeArt owns themed arena, characters, warnings and joysticks. SpikeGame wires all control sources and model/view flow.

SpikeControls.ts prioritizes keyboard direction, normalizes gamepad axes/D-pad with dead zone, assigns stable player slots and requires neutral after pause. Gamepads are polled in the existing update; there are no global subscriptions. Only human players receive joysticks/drag subscriptions; single-player accepts arrows or WASD, local Orange WASD and Blue arrows. Cancel/release/pause clears movement.

To change movement speed/radius, edit ArenaPhysics and retest safe routes/cover geometry. To change warning tempo, edit Rules.warningDuration and preserve visible warnings. To change layouts, edit Maps so art, physics and AI share the selected blocks; avoid the default BLOCKS compatibility constant in new map-aware code. To tune controller dead zone/priority, edit SpikeControls. To change deadline, update remaining and advanceClock together.

# 6. Arcade games and Ultimate Golf

## 6.1 Classic Snake - folder arcade/snake

SnakeRules.ts owns SnakeWorld: 17x20 grid, a three-cell initial body, current direction, a two-action direction queue, food, score and accumulator. steer rejects duplicates, reverse turns and a third queued action. update caps catch-up at 0.5s and repeatedly calls tick using interval=max(0.065,0.18-score*0.0015). Each food is worth 10, so the speed changes by score rather than food count directly.

tick computes the new head and checks walls/body. When not eating, the old tail is excluded from collision because it moves away in the same step. Eating grows the body and spawns food from an enumerated free-cell list, avoiding rejection loops. Filling the grid sets won/dead and clears food. SnakeGame maps swipe, direction pad and keyboard, interpolates from previous positions and reports finishArcade. Pause clears queued directions/held controls.

To change grid size, edit width/height plus render spacing and starting body. To slow progression, edit interval's score coefficient or floor. To change food points, edit score+=10 and consider its speed effect. To allow wrapping, explicitly change tick's boundary rule and interpolation/tests; changing the drawing alone cannot wrap collisions.

## 6.2 Star Patrol - folder arcade/space-shooter

ShooterWorld.ts owns player motion, swept projectile collision, damage, pickups and bounded pools. Waves.ts now owns formation/enemy roles, speed and attack cadence; Powerups.ts owns upgrade metadata/rewards/life eligibility; ShooterArt.ts owns the original live artwork; SpaceShooterGame.ts owns host inputs, fixed stepping, HUD/audio and cleanup. These files were added/refined during the documentation review and this section follows the extracted snapshot rather than the older three-file description.

The player starts with three lives and moves at370 units/s within x44..376. There are80 pooled projectiles: slots0..51 reserved for player fire and52..79 for enemies, preventing spread fire from suppressing enemy attacks. Player bullets travel at vy=-490; enemies use speed min(340,155+wave*13), with straight, paired, aimed and boss patterns. contact computes swept segment-to-box entry time on both axes, including diagonal shots. The closest eligible enemy is hit first; laser projectiles track prior hits and can pierce up to three targets. The pool stores damage, pierce and laser flags per shot.

Waves.formation creates up to five rows, normally six columns, with five columns and an added boss every fourth wave. Roles include ordinary alternating types, tougher armored enemies, aimed attackers, a reward carrier and boss. waveSpeed=min(130,28+wave*6+killed*0.8). attackInterval=max(0.42,1.4-wave*0.065). Front-row attackers charge visibly for0.38s, or0.55s for a boss, before firing. Formations reverse/drop10 at edges, some enemies sway, and all descend slowly. Kill points are10+kind*5; wave clear adds wave*50 and a1.8s transition.

The pickup pool has eight slots and bursts are capped at24 with0.45s lifetime. Upgrades are spread cannon, rapid fire14s, piercing laser16s, wingmates18s, shield and life. Timed powers accumulate to at most24s. spread increments weaponLevel up to3; rapid changes player shot interval from0.23 to0.11s; drones add shots on alternating firing cycles; shield absorbs a hit and gives0.8s immunity. Ordinary damage removes a life, reduces weaponLevel by one and gives1.5s immunity. spawnWave grants at least1.2s immunity. Extra-life drops require a sixth-wave milestone,90s since the last life drop and fewer than four lives. A life pickup at the cap grants a shield instead. Reward carriers use the deterministic waveReward cycle; ordinary loot can drop every eighth kill.

Pickups fall at86 units/s, attract horizontally toward a nearby player below y450 at up to110 units/s, collect within24x25, and retire below640 or after9s. ShooterArt renders original craft/enemy types, charging telegraphs, upgrades, effects and gear indicators in one retained masked Graphics. The controller starts after a0.7s ready beat, fires while lower-field drag or Space is held, keeps keyboard/drag targets legal, rate-limits shot feedback and reports finishArcade once. Pause cancels dragging and fixed catch-up; disposal releases graphics, mask and text.

To change movement/fire, edit ShooterWorld's caps and shotClock. To change wave roles/health/bosses, edit Waves.formation; tune waveSpeed/attackInterval separately. To change power duration/name/color, edit POWERUPS; to change rare-life policy, edit canDropLife and drop. To change pickup collection motion, edit the pickup loop in step. To change visuals, edit ShooterArt, preserving shared hit dimensions. Validate phase3 and star-patrol unit tests plus the real browser controls; effects/upgrades must never grow unbounded.

## 6.3 Ultimate Golf - active folder games/mini-golf/ultimate

The parent config keeps id mini-golf, display name Ultimate Golf, category arcade, custom/responsive presentation and tournament=false. The parent index lazily creates UltimateGolfGame. Everything in this subsection is active. The old parent-root duel files are explained separately in Chapter 8.

### Controller and three modes

UltimateGolfGame.ts owns mode/course/challenge selection, help, input drag ownership, focus camera, result screens and lifecycle. initialize creates GolfUI/renderer, binds keys/drag and applies options. action handles menu controls. release converts one owned gesture into one shot only while shootable. attachWorld binds the current physics world to presentation. update advances the selected mode, AI world if applicable, camera/rendering and HUD. pause cancels aiming, resets physics catch-up and cancels worker planning; dispose removes DOM/graphics/masks/workers.

modes/CasualMode.ts starts a course/challenge and records casual bests through GolfProgress. LocalVersusMode.ts gives Orange then Blue identical seeded course/tour conditions with a handoff phase; a course has a 180s foreground cap and Easy stroke allowance. CompetitionRules.total/winner compare completion first, then total time, use a 0.1s tolerance and fewer strokes as the time tie-break. AIChallengeMode.ts advances two independent real worlds concurrently and records first completion/failure with the close-finish rule. CompetitiveStats.ts stores separate counters under golf-versus; these never modify casual records. Help, handoff, menus and pause do not consume competition time.

### Rules and ball trajectory

GolfRules.ts defines three challenge records. Easy: obstacle speed 0.7, stroke factor 1.5, preview 0.6s, bonus 100 plus 10 per unused stroke. Normal: 1.0/1.1/0.3s/250+25. Hard: 1.3/0.75/no preview/500+50. strokeLimit rounds baseLimit*factor; scoreFor uses the remaining allowed strokes.

GolfCollision.ts defines RADIUS=7 and MAX_SPEED=650. shotVector in GolfInput.ts uses (dragStart-dragEnd)*3.125 in world units and caps magnitude to MAX_SPEED. GolfPhysics.shoot requires a stopped playing ball, remaining strokes, finite velocity and magnitude at least 43.75, equivalent to 14 world units of pullback. It saves lastShot and increments strokes exactly once.

GolfPhysics.advance caps render catch-up at 0.1s and simulates at 240Hz. tick first updates obstacle dynamics. UFO carrying suspends ground/hazard logic. Surfaces can replace normal friction 110 or apply push acceleration. Oil uses friction 20. Fields accelerate toward their center, optionally with quadratic falloff or only while moving. Speed is capped, position integrates, and friction reduces speed linearly by friction*dt, scaling vx/vy proportionally. A non-pushed ball stops below 6. This is not global exponential drag.

Then tick tracks bridge/plank/plate state, handles directed portals with 0.5s cooldown and minimum exit speed 80, recovers unsafe/lava/laser/quicksand states, resolves circles/movers/fans/diamond/piston/doors/cores/walls, and checks bounded contact oscillation or nonfinite/out-of-bounds state. Recovery returns to a legal last-shot position without an extra stroke. The cup captures inside abs(dx)<8.25 and abs(dy)<8.25 with no added speed test. A last-stroke cup win is checked before exhausted-stroke loss.

GolfCollision.hitRect/hitCircle project the ball outside overlap and reflect only approaching relative velocity; hitRotated transforms into an obstacle's local coordinates and accounts for contact-point angular velocity. Moving contact transfers legal momentum, then cap limits speed. Never enlarge the physical ball to match its visibility halo.

### Dynamics and four course data files

GolfDynamics.ts uses difficulty-scaled obstacle time. mover traverses a triangular out-and-back path and returns real motion velocity. laser is active when (time+phase)%3>=1.6. bridgeSafe uses the 8s tidal cycle. piston implements fast extension, hold and slower retraction. safe checks ground, river/planks, bridges and ford. update advances doors, plates, planks, cooldowns and the Horizon UFO. recovery moves last-shot returns out of mover/fan/piston sweeps or chooses a safe start fallback.

| Course data | Main data/mechanics to edit | Base stroke limit |
|---|---|---|
| courses/foundry.ts | Six serpentine lanes, crate/diamond, bumpers, belts, oil, moving beams, magnet/core, rotating cross, piston, lava and laser | 18 |
| courses/shoreline.ts | Ten ground islands/paths, sand/slick/ford, tidal bridges/current, crabs, palms/bumpers and whirlpool fields | 25 |
| courses/horizon.ts | Eleven platforms, slick strips, solar wind, fields/cores, directed portals, asteroids, lasers, rotating cross and UFO config | 20 |
| courses/temple.ts | Walls, river/two five-plank bridges, mud/slick/quicksand, boulders, dart gates, rotating cross, entrance plate and two latched plates/doors | 18 |

courses/types.ts defines every data shape: Point, Rect, Circle, Mover, Surface, Field, Fan, Portal, UFOConfig and Course. p/r/outer are coordinate constructors/boundaries. courses/index.ts fixes course ordering. Keep original 1920x1080 source units. A course rect is x,y,w,h; a mover has from,to,seconds and radius or dimensions; a field has radius,strength,optional core/quadratic/movingOnly; a portal has from,to and exit angle in degrees. Course art and physics consume the same data.

Horizon's UFO values are first 11.5 obstacle seconds, interval 28, warning 1.5, speed 170, duration 13, hover 1, carry 0.8 and cooldown 8. Its seeded event hash makes competitors reproducible. Drop selection rejects hazards and falls back to lastShot. The third portal exits toward (960,310), then offsets 35 units along its angle. The course port is mechanically derived from an external source described in docs/ULTIMATE_GOLF.md; consult that file's provenance/license discussion before redistributing the derived course layouts. This handbook makes no new licensing claim.

### Camera, aim preview and AI

GolfView uses one uniform scale. Portrait rotates clockwise; landscape is unrotated. project/unproject are exact inverses around the same center/origin/scale. Focus zoom is clamped to 2.2..4 and follows/clamps the ball neighborhood. UltimateGolfGame holds the camera during aiming so a stationary finger does not change the shot. GolfUI.bounds reserves actual responsive header/footer space.

GolfRenderer.ts owns retained masked Graphics and original vector course artwork. components/CourseArt.ts generates static SVG course overviews from real data without creating simulations. ModeArt.ts draws small mode icons. GolfUI.ts owns DOM menu/HUD/help/meter/rival elements; components/golf.css controls their responsive layout. GolfProgress.ts validates and stores four casual best scores.

GolfPhysics.preview makes a disposable ghost simulation for a bounded path and stops at impact/recovery/portal/terminal state. The renderer also contains the short preview drawing logic; moving hazards may change before release. Preview dots are guidance, not a guaranteed future path.

ai/GolfAI.ts owns planning scheduling/generation and calls the same world.shoot API. Current base decision delays are 2.2/1.6/1.2s for Medium/Hard/Impossible before personality variation; accelerated mode uses 0.25s. Older prose mentioning 1.1/0.8/0.65s is stale. ShotPlanner.ts copies the actual world snapshot, records reached waypoints before forecasting reaction delay, simulates candidate angles/powers/waits in the actual 240Hz physics, refines the best result and selects only comparably good simulated landings. Budgets are 65/140/240ms and replay candidate limits 180/420/800. Each trial is bounded to ten simulated seconds. Penalties discourage recovery, ongoing motion and missed Temple plates. routes.ts supplies legal waypoint guidance and comparable route variants, not scripted awarded progress or shot velocities. planner.worker.ts runs the planner; cancellation terminates computation.

### Golf change guide

| Desired change | Edit | Related work |
|---|---|---|
| Stronger/weaker pullback | GolfInput.shotVector multiplier 3.125 | shoot minimum 43.75, preview/power UI and touch tests |
| Faster maximum ball | GolfCollision.MAX_SPEED | planner powers/estimates, collision stress and route checks |
| More/less rolling | GolfPhysics.tick friction and course surface friction | Planner uses shared physics; legal route difficulty changes |
| More allowed strokes | Course.baseLimit or GolfRules factor | Score formula and tests use the same rounded limit |
| Easier moving obstacles | GolfRules speed multiplier | Dynamics contact velocity must remain scaled consistently |
| Move an obstacle | Corresponding course data | Course art updates; verify route clearance and AI waypoints |
| Change laser/tide/piston timing | GolfDynamics methods | Test timing and safe traversal at every challenge |
| Longer competition | CompetitionRules.COURSE_TIMEOUT and mode checks | Keep foreground time semantics |
| Faster AI thinking/action | ShotPlanner budget and GolfAI baseDelay separately | Search quality and reaction pacing are different settings |
| Better Temple route | ai/routes.ts waypoints and planner cost | Stay outside bumpers, quicksand and mover sweep |
| Different camera/UI size | GolfView, GolfUI.bounds and golf.css | Verify project/unproject after focus/resize |

# 7. Preserved future games

These folders are outside both discovery globs and therefore absent from menus, global tournaments and production module chunks. Their unit tests remain active. To reactivate, move the entire module from src/future-games to src/games, restore its browser spec from tests/future to tests/browser, rebuild and run module/bundle/browser checks. Preserve stable IDs. Old unavailable tournament rounds cannot launch; create a new tournament rather than fabricating a result.

## 7.1 Flappy Jump - future-games/flappy-jump

Despite its name, this is a running basketball jumper. Rules.ts defines Jumper and BasketBall plus walk, projectedLanding and FlappyMatch. Both players receive identically seeded hoop positions. The runner moves at 70 units/s between x45 and195, reflecting at boundaries. jump applies vy=-310 under gravity750. At the jump apex, the ball releases at y-20 with vx225/vy-200. Ball gravity is also750. Rim-end circles use 10-unit combined contact radius and separating impulses; the backboard reflects with 0.65 horizontal restitution. Scoring requires a downward swept crossing of the hoop plane inside x+/-14 and a per-ball scored guard. Balls retire on bounds or after3s. First ten baskets wins; same-step finish draws; a240s cap compares score.

AI.ts uses projectedLanding to time the same jump action, plus seeded difficulty offset/delay. FlappyGame.ts maps input, advances120Hz, draws and reports. To change jump height, edit jump impulse/gravity and projectedLanding together. To change ball arc, edit release velocity and predictor. To change hoop range, edit hoop generation and prove reachability. The written implementation uses original balancing choices, not a claim of exact missing reference-PDF physics.

## 7.2 Car Duel - future-games/car-duel

Physics.ts contains a custom rigid-body approximation, not a second Phaser physics engine. Car has x/y/vx/vy/angle/omega/facing/alive/grounded. terrain is a compact raised middle bump. point rotates body-local coordinates; head and colliders share these transforms with rendering. INERTIA=560. integrate clamps input -1..1, applies grounded/air throttle145/35, gravity520, input torque1.1/3.2, exponential damping0.65, speed/rotation caps and three ground-contact projection passes. Ground normals derive from terrain slope; impulses include angular lever arm. Head contact with ground/walls kills. collide tests exposed heads against the opponent's body/head, projects chassis circles apart and applies an approaching relative impulse.

Rules.ts spawns cars and scores first-to-five rounds. Simultaneous deaths replay; stalled40s rounds replay; total240s compares scores. CarInput.ts owns per-pointer left/right button subscriptions and clears them on pause/dispose. CarAI drives ordinary throttle/torque-limited inputs. CarGame owns fixed120Hz update and original rendering. To change handling, edit integrate constants; to change collision shape, edit colliders/head and shared drawing transforms together. To change terrain, edit terrain and retest grounding/slope/head contact. Avoid modifying only the drawn wheels or body silhouette.

## 7.3 Archery Duel - future-games/archery-duel

Rules.ts owns ArcheryMatch, seeded target centers and an Archer three-tap state machine. Taps start aiming, lock horizontal crosshair, then lock vertical crosshair/fire. Lock debounce is120ms. The crosshair reflects at175 units/s. After380ms impact delay, the distance to the actual target awards1 or2 using the same visible circle radii. First to ten wins with180s safety cap; per-attempt target sequences are shared but consumed independently. The two target radii are28 and14, worth1 and2 points. Horizontal/vertical crosshair limits are340/170. AI.ts waits/locks the real moving crosshair instead of inventing impact coordinates. ArcheryGame.ts presents mirrored player fields, maps keys/taps, runs fixed updates and reports the result.

To change aim difficulty, edit crosshair speed, target radii or AI target offsets/delay. Keep drawing/rule radii synchronized. To change flight/impact delay, edit the Rules phase deadline and arrow presentation consistently. To change target range or points, edit seeded targets/scoring and tests. Every attempt can resolve only once.

## 7.4 Chicken Jump - future-games/chicken-jump

Rules.ts owns two independent Chicken stacks and geometric descending landings. A sliding block moves horizontally; stop locks it and launches the chicken. The next height changes only after the descending chicken lands within the legal block interval. A miss retries the same height. First ten stacks wins, same-step finish draws, and180s expiry compares heights. speed, stop and step contain the sliding/bounce/jump/landing rules. ChickenAI samples an alignment offset per attempt/height and invokes the same stop action. ChickenGame handles input,120Hz updates and drawing.

Current defaults: block width65 shrinks by2.5 per successful stack to a38 minimum; slide speed is92+min(85,score*8). stop sets vy=-310; gravity is800. A descending crossing of y=-26 lands when abs(chicken.x-block.x)<=width/2+6. A miss falls beyond y60, waits0.65s and retries. To change stack target or timeout, edit step's terminal checks and metadata. To change alignment tolerance, edit geometric landing bounds together with block/chicken visible widths. To change block speed progression, edit speed; tune AI reaction without bypassing stop. To change jump shape, edit vertical velocity/gravity and camera/art follow behavior together.

# 8. Retained legacy golf and the example module

### Legacy five-course duel - games/mini-golf root files

The active index does not import MiniGolfGame.ts, GolfMatch.ts, GolfPhysics.ts, GolfAI.ts, ai.worker.ts or courses.ts at this parent level. They remain source history with tests. Do not confuse their constants with Ultimate Golf's active constants.

courses.ts contains five small340x400 layouts. Legacy GolfPhysics.ts sets BALL_RADIUS7, FRICTION65 and MAX_POWER600. shoot requires a stationary/unholed ball and power>=20, then assigns angle-based velocity. golfStep subdivides travel to at most half a radius, uses separating-normal bounces with coefficient1.82, two projection passes, linear friction, stop threshold8 and circular cup capture distance<11 only below speed150. simulate copies a ball and advances up to1500 steps at120Hz.

GolfMatch.ts alternates players, counts strokes per hole, caps an unholed12th-stroke attempt as13 and marks it finished, totals the selected number of holes and chooses lower strokes. Saves contain validated stopped balls, hole/turn/count/history and totals. MiniGolfGame.ts owns the old drag-to-shoot, duel UI, fixed stepping, save points and worker lifecycle.

GolfAI.ts constructs a visibility route around expanded rectangles, derives stopping-power estimates sqrt(2*FRICTION*distance), simulates candidate angles/powers and bounds difficulty budgets45/140/300ms. Impossible considers a direct second shot from promising finalists. Its worker returns a normal legal shot. These algorithms are educational history; edits here do not change the current Ultimate Golf card.

### examples/tap-duel

config.ts demonstrates metadata, assets/preview.svg provides its thumbnail, and index.ts contains a complete small MiniGame. Copy the whole folder into src/games/tap-duel to register it at build time. Use initialize to bind host-owned inputs and make display objects, update for foreground behavior, ctx.setScore for HUD, ctx.finish exactly once, and dispose for module resources. scripts/check-module.mjs proves folder-only discovery in a temporary copy rather than adding the example to the real collection.

# 9. Build, offline support, Android and assets

### Commands and what each does

| Command | Purpose |
|---|---|
| npm ci | Install exact package-lock dependency graph |
| npm run dev | Start Vite on127.0.0.1:5173 |
| npm run build | Strict tsc check, then production Vite build to dist |
| npm run preview | Serve existing production dist on preview port |
| npm test | Active Vitest unit suites, including future-game units |
| npm run test:browser | Active Playwright tests under tests/browser |
| npm run test:modules | Temporary-copy example registration/build proof |
| npm run test:bundle | Verify shell budget and lazy module chunks |
| node scripts/measure-performance.mjs | Browser performance sampling; inspect required running server in script |
| node scripts/measure-expansion.mjs | Expansion performance sample using a running dev server |
| python3 scripts/verify-math-bank.py | Regenerate/verify 100 static questions, overwriting bank/report; requires SymPy |
| npm run android:sync | Build web assets, then cap sync android |
| npm run android:open | Open native wrapper in Android Studio |
| npm run android:debug | Sync then Gradle assembleDebug |
| npm run android:release | Sync then Gradle bundleRelease with local signing prerequisites |

scripts/offline-plugin.ts emits sw.js with embedded FILES and SHELL lists from the build. Shell precaching is separate from caching game/worker assets on demand. core/OfflineManager.ts sends explicit cache-all work to the service worker and waits for its response. Settings exposes Save all games offline. main.ts registers the web worker only in production, outside native Capacitor. Android uses packaged assets. After source changes, rebuild the web output; after Android changes to web content, sync before compiling the native app.

scripts/bundle-report.mjs discovers registered folders/chunks and enforces lazy-loading/payload constraints. scripts/check-module.mjs validates automatic discovery with the example in a disposable checkout. measure-performance and measure-expansion are measurement tools, not gameplay code. verify-math-bank.py is a SymPy-based generator and symbolic verifier for 100 static questions. It WRITES src/games/math-quiz/questions/university.json and docs/math-validation.json; it is not a read-only audit of an edited bank and does not validate all procedural families. Run it only when intentionally regenerating the bank. Existing math-quiz unit tests provide separate validation. Their internal blocks are indexed in the atlas.

### Android folder by folder

android/app/src/main/java/com/pocketrivals/games/MainActivity.java is the Capacitor activity. AndroidManifest.xml defines activity/orientation/theme and app entry. res/layout/activity_main.xml contains the native WebView wrapper layout. res/values holds strings, colors and theme/splash styles. res/xml holds provider paths and generated Capacitor/Cordova configuration. res/drawable and drawable-v24 contain vector branding, icon background/foreground and base splash resources. drawable-land-* and drawable-port-* hold density/orientation splash variants. mipmap-* contains raster launcher assets by density; mipmap-anydpi-v24/v26 contains adaptive icon resource definitions.

android/app/build.gradle configures application identity, SDK settings, build types, packaging and environment-based signing. proguard-rules.pro holds optional shrinking rules. app/capacitor.build.gradle and capacitor.settings.gradle connect generated plugin modules. android/build.gradle, settings.gradle, variables.gradle and gradle.properties configure Gradle/plugins/SDK values. gradle/wrapper holds the pinned wrapper properties and executable JAR; gradlew/gradlew.bat start it on Unix/Windows. capacitor-cordova-android-plugins is a generated compatibility module. ExampleUnitTest.java and ExampleInstrumentedTest.java are native template tests, not evidence of Android gameplay validation.

android/app/src/main/assets/public is a copied web build. Its hashed JS/CSS/font files, manifest, index, sw and compatibility stubs come from cap sync. Editing these copies will be overwritten and can leave Android out of sync with source. Rebuild/sync instead. Existing copied assets can lag behind src until synced; their presence alone does not prove the latest collection is installed on a device. local.properties, if present, is machine-local SDK configuration and deliberately excluded from the handbook inventory. No secrets or signing values are reproduced.

### Static and generated artwork

public/icon.svg is the web app mark. Every game's assets/preview.svg is its card thumbnail. Some configs embed variant SVG strings or call a lightweight local map preview; changing a thumbnail does not alter live gameplay. Most live art is original procedural Phaser Graphics in Art/Renderer files, and some DOM/SVG helpers generate previews from game data. Fonts come from bundled @fontsource packages; npm/Vite emits hashed local font assets. KaTeX styles/fonts are bundled for Math Quiz. There is no remote asset dependency in normal play.

The docs PNGs are historical screenshots and visual evidence. Their filenames identify the game/state reviewed; they are not authoritative physics or current asset source. docs JSON reports record measured snapshots/audits, not live telemetry. docs/licenses contains bundled third-party license copies. docs/THIRD_PARTY_NOTICES.md and PRIVACY.md describe dependencies and local data behavior.

# 10. Testing, troubleshooting and safe modification

### A practical edit workflow

1. Find the active file in this handbook and read its local AGENTS.md plus the shared contract.
2. Search for the symbol, then inspect all reads/writes and callers. Prefer a named constant over an unrelated UI literal.
3. Change one behavior at a time. Keep units explicit and update metadata/help only when actual behavior changes.
4. Run the game's targeted unit test(s). Run npm run build for TypeScript/import/bundle errors.
5. Exercise the real UI input path, pause/resume, restart and exit. For physics/input changes, run the related browser/framerate tests.
6. For metadata/module discovery changes, run test:modules and test:bundle. For Android delivery, rebuild/sync and validate on an actual device.
7. Update this guide and re-extract the source index when behavior or line locations change.

This documentation request did not require changing game code. The validation ledger at the end reports exactly which checks were run for this edition; it does not imply browser/native checks that were not executed.

### Find the right test

| Area | Main coverage to start with |
|---|---|
| Core saves/tokens, Pong/Hockey/boards | engine, phase2, phase3, app, precision/keyboard specs |
| Seeded AI identity and bounds | ai-refinement tests and browser spec |
| Dots/board sizes/captures | dots-and-boxes and phase suites |
| Hammer | hammer-hit, hammer-presentation, hammer-presentation-related browser checks |
| Light/Fruit/Lumber/Math | matching unit files, fruit-timer-effects, light-lumber-polish, math-quiz-visual |
| Water/Timer/rotation | water-guess, perfect-timer, turn-view, precision-games |
| Gravity/Birds/Spike | matching unit files, gravity-variation, spike-controls, premium-motion, expansion-framerate and matching browser specs |
| Active golf | ultimate-golf, golf-routes, golf-refinement, golf-temple-ai, browser ultimate-golf/golf-temple-ai |
| Optional full golf AI audit | fixtures/golf-ai-audit.test.ts via fixtures/golf-audit.config.ts |
| Future modules | matching unit files; specs in tests/future are excluded from normal browser discovery |
| Offline/lazy/discovery | offline browser spec, test:bundle and test:modules scripts |

The atlas lists actual describe/test titles and line locations for every test file. Reading those titles identifies the assertions' intended contract; passing them does not establish every possible runtime path. fixtures/golf-solutions.ts contains legal Easy-mode shots for all four active courses. fixtures/golf-route-search.ts explains an optional search process and is not shipped gameplay. The expensive AI audit has a separate config and is not part of ordinary npm test.

### Common symptoms and where to investigate

| Symptom | Start here | Why |
|---|---|---|
| New game card absent | Registry globs, folder config, unique ID | Only games/* and arcade/* are discovered |
| Card opens old behavior | Active index.ts, rebuilt dist, Android sync | A retained legacy implementation may not be imported |
| Score appears twice | Controller reported/ended guard, GameHost.finish, attempt token | Terminal reporting must be idempotent |
| Timer advances during pause | TimerClock/GameHost resume reference, module update guard | Raw wall time can include background duration |
| Motion changes with frame rate | FixedStep usage and interpolation split | Simulation must not be frame-count based |
| AI hits invisible information | Controller present/presentSignal order and AI visibleAt | Model readiness must follow presentation |
| Ghost input after resume | InputManager.clear and module-specific held sets | Pointer/key/gamepad state must be canceled |
| Worker affects another match | WorkerTask.cancel and controller generation guard | Late asynchronous replies must be rejected |
| Art and collision disagree | Shared geometry/constants and transforms | Draw code may have independent literals |
| Golf aiming shifts on focus | project/unproject and camera freeze during drag | All coordinates must use one transform |
| Android seems outdated | cap sync copied public assets | Native assets are snapshots, not live src |
| Works online, worker fails offline | sw collection manifest/cache-all and worker chunks | Workers are separate lazy assets |
| Save corrupt/missing | Module restore validator and StorageManager persistent flag | Storage may be invalid or unavailable |
| Math repeated/too small | History/Bank and MathUI/quiz.css | Data scheduling and DOM fit are separate |

### Change requests mapped to owners

| What you want to change | Where to start |
|---|---|
| App colors and default canvas | ThemeManager plus app.css and hardcoded local art |
| Menu card name/order/instructions | Game config.ts |
| Thumbnail | assets/preview.svg or config variant preview helper |
| Enable/disable tournament entry | config tournament/category and supportedModes |
| AI strength | The selected game's AI settings/search budgets |
| AI personality variety | MatchRandom identity and local comparable-choice policy |
| Win target | Local Rules/world plus any shared clock/controller hardcodes |
| Movement speed/gravity | Local Physics/world constants and legal controller |
| Collision shape | Canonical geometry plus matching renderer and forecasts |
| Animation speed | View/Art/controller age expressions, unless shared with rule cooldown |
| Keyboard mapping | Game initialize/setupInputs; host InputManager only for general mechanics |
| Shared sound effect | AudioManager.effects and Sound union |
| Per-game feedback event | The controller ctx.audio.play call at the legal event |
| Save schema | The save and restore pair, version and tests |
| Add math question/topic | questions JSON/generator, Question schema and bank tests |
| Add golf obstacle/course | Course data/types, dynamics/collision/renderer/planner as required |
| Reactivate future game | Move folder and restore its browser spec, then rebuild/check discovery |
| Add entirely new game | Copy tap-duel example, implement MiniGame, supply metadata/assets/tests |
| Change native app identity | capacitor.config.ts, native Gradle/manifest/resources consistently |
| Offline caching policy | scripts/offline-plugin.ts and OfflineManager |

### Constraints that protect correctness

Keep game rules inside their modules. Do not import one game into another or eager metadata into heavy physics/AI. Preserve legal human/AI actions and bounded search/physics. Preserve pointer identity and clear state on cancel/pause. Keep match deadlines on foreground monotonic time. Reject nonfinite input and validate restored data. Separate duel scores, Arcade bests, casual golf and competitive golf. Preserve stable ping-pong and mini-golf IDs. Own and dispose graphics, DOM, masks, workers and extra listeners. Use the existing Phaser loop. These are practical invariants needed for correct edits.

# 11. How to use the complete file atlas

The following reference follows the actual folders. For each maintained code file it states responsibility, dependencies, named blocks and source lines. Function entries explain the role, show selected decision guards, state writes, calls and return expressions extracted from the current AST. Those observations describe direct code; delegated helpers and callbacks may perform additional work. A displayed guard is an actual branch condition, not a claim that every branch rejects input. No arbitrary threshold is recommended as safe solely because it appears in the table.

State/constant tables distinguish module data from class initial state. A field initialized to zero can be a runtime counter, not a tuning knob. AI local settings and literals inside functions remain in the companion complete source. Long SVG/data literals are summarized in the PDF and reproduced in that source reference. CSS selectors and test titles have separate maps. The maintained-file inventory also covers JSON, XML, Gradle, shell, SVG, Markdown, licenses and image resources. Generated/native copied bundles are grouped with regeneration instructions.
