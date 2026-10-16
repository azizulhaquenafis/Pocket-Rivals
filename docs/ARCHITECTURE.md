# Architecture

Pocket Rivals has one persistent Phaser instance and one reusable host scene. The DOM owns scrolling menus and accessible modal controls; Phaser owns gameplay and its HUD. Default logical coordinates are 420×760, fitted to the viewport and rendered at up to 2× device resolution. Modules may declare responsive custom presentation (Golf), own accessible DOM controls, and receive viewport resize notifications.

| Area                                                        | Responsibility                                                                         |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `core/GameRegistry`, `GameLoader`                           | Eager metadata discovery; lazy module factories from both game roots                   |
| `core/GameManager`                                          | Navigation, foreground/background lifecycle, current-run guards, native back button    |
| `scenes/GameHost`                                           | Module context, monotonic elapsed time, HUD, initialization/shutdown generation guards |
| `core/InputManager`                                         | Pointer ownership, scene-local taps/drags/keys, cancellation and cleanup               |
| `core/TournamentManager`                                    | Serializable state machine, attempt tokens, checkpoints and one-time scoring           |
| `tournament/TournamentScene`                                | Metadata-driven setup, progress, champion and rematch UI                               |
| `core/StorageManager`, `ScoreManager`, `ArcadeScoreManager` | Validated local data, session fallback, separate duel and arcade scoring               |
| `core/AudioManager`                                         | Small procedural Web Audio effects, persisted preferences                              |
| `shared/contracts`                                          | Module, result and AI contracts; no game-specific rules                                |
| `shared/physics`, `rules`, `utilities`                      | Fixed-step accumulator, stable motion, match clock, cancellable worker tasks           |
| `games/*`, `arcade/*`                                       | Independently maintained rules, rendering, AI, assets, metadata and state              |

## Lifecycle and navigation

`menu → loading → playing ↔ paused → results`. Every launch receives a new run ID. Shutdown disposes the previous module and input manager. A stale import or worker result cannot update a newer match. An opaque themed transition covers loading; the canvas is revealed after the first completed render. Menu cards never begin at zero opacity. Modal updates preserve the existing panel rather than replaying the entrance animation.

The host computes elapsed seconds using `performance.now()`, resetting its reference on resume. Physics accumulators cap catch-up at 100 ms; Pong/Hockey match clocks receive uncapped foreground elapsed time and persist through goals. Backgrounding pauses modules and clears held controls. There is no secondary RAF loop.

## Module boundaries

`config.ts` imports only contract types and a small local preview. `index.ts` exports a side-effect-free factory. A module initializes only after selection; code remains in the browser's module cache after exit, while scene objects, inputs, timers and workers are released. Future texture-based modules must remove their own uniquely prefixed textures on disposal.

Game-specific work stays inside its folder. Pong retains registration ID `ping-pong` for saved-data compatibility. Tic-Tac-Toe lazily loads Classic or Ultimate through one metadata entry. Arcade declares `category: 'arcade'` and `tournament: false`; its result path never changes rival wins or tournament points.

## Persistence and tournaments

- `pocket-rivals.v1`: existing sound/music and overall duel scores; retained without migration.
- `pocket-rivals.match.v1`: most recent unfinished quick match. Board games save legal move histories. Pong/Hockey save clocks and physics about once per second and on pause. Arcade games do not expose duel resume checkpoints.
- `pocket-rivals.tournament.v1`: plan, completed results, points, attempt identity and current module checkpoint.
- `pocket-rivals.ultimate-golf.v1`: four validated course best scores; active golf courses restart after closure.
- `pocket-rivals.arcade.v1`: per-game high scores. Arcade runs themselves restart after closure.

Tournament states are `between → playing → between/complete`. A token combines tournament ID, round index and attempt number. Restart creates a new attempt; duplicate/stale results cannot score. Wins give one point; draws give half to each. Rematches retain the schedule with a new tournament ID. Registry metadata, not game names, controls participation.

## AI and performance

Pong/Hockey use predictive decisions plus an acceleration-limited movement controller. Classic uses alpha-beta Minimax. Ultimate and Connect Four use bounded iterative deepening, move ordering and transposition tables in workers. Workers terminate on pause/exit and have a two-second watchdog. Difficulty affects search/reaction/accuracy, never rule exemptions.

Star Patrol separates wave definitions, power-up data, combat simulation and vector rendering inside its lazy module. It reserves 52 player/28 enemy projectile slots, eight falling pickups and 24 short effects. Gear and enemy attacks use the same fixed-step clock; no extra loops or timers. Scene graphics are retained. Additional games add metadata/thumbnail bytes to the shell, but their implementation and worker chunks stay lazy. The built-in Phaser runtime remains the dominant shared payload.

Ultimate Golf uses a 240 Hz shared simulation and responsive, uniformly scaled portrait/landscape camera with exact inverse pointer transforms. Its `modes/` controllers isolate casual records, seeded hot-seat races and real worker-planned AI races. Physics, data, rendering and input remain shared under `games/mini-golf/ultimate`; the registry ID is unchanged. It has its own single/multi-course competition and remains excluded from global duel tournaments.

Development-only `?diagnostics` displays FPS, smoothed frame time, initialization times, active scenes, texture count, heap where available, AI search time and loaded module IDs. `window.__POCKET__` exposes read-only development snapshots for automated tests. Neither diagnostic UI nor snapshot access is enabled in production.

## Web and Android

Vite builds static relative URLs, suitable for Vercel (`vercel.json`) and Capacitor's local origin. Web service-worker installation caches the shell only. Selected game chunks cache on demand; Settings → Save all games offline explicitly caches the full build, including worker files. Android always packages every registered module and asset and bypasses the web service worker. No network permission or runtime server is required.

## Expanded rivalry collection

Three active expansion modules remain isolated under `games/`. They run a bounded 120Hz simulation through FixedStep and use ordinary duel results and metadata-driven tournament eligibility. Flappy Jump, Car Duel, Archery Duel and Chicken Jump are preserved under `src/future-games/`, outside the registry/loader globs; their code, assets and tests remain available for future development. Spike Attacks uses a small visibility graph on wave changes, not a worker or a continuously recomputed route. New real-time matches restart after process closure; existing board/Pong/Hockey checkpoints are unchanged.

Water Guess and Perfect Timer retain separate rule engines and renderers. Round resolution is idempotent. Perfect Timer uses a module-local foreground monotonic clock for both keyboard/touch stops and AI; pause time is excluded. Both use seeded match personalities, with no forced minimum error at Impossible.

TurnView is a small lazy presentation utility used by full-field local hot-seat games. It rotates only module-owned display objects, supplies the inverse pointer mapping, blocks interaction through its 280ms transition, and destroys its children on disposal. Host navigation remains fixed. Turn-based boards use pastel player backgrounds and compact neutral status; simultaneous games retain their separate controls.

Gravity Runner and Happy Birds interpolate fixed-step presentation separately from physics. Gravity streams bounded seeded obstacle sections, with runnable middle rails across double-wall gaps, four map-specific trap families and staged increasing run speed; it has no time deadline. Its CourseStream selects weighted nonperiodic motifs and retires old geometry. Canonical convex geometry and timed jet/gate states are shared by rendering, collision and all three AI forecasts. Happy Birds uses one shared wall-bounce arena with telegraphed safe pattern changes, a first-to-15 physical star goal and individual three-second animated returns to center after a collision. It has no match deadline; recovery freezes on pause and never awards or removes stars. Local Happy Birds controls are Space for Orange and arrow keys for Blue.

Spike Attacks uses a shared square arena, three solid cover blocks and four piston lanes per edge. Its module owns bounded attack phases, a visibility-route AI, interpolated presentation and two host-managed joystick drags. Foreground deadline is two minutes; game-specific physics and controls stay within its module.
