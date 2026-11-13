# Current refinement status

The active Arcade collection now contains seven games. Ricochet, Pocket Pinball and Slide Escape have moved to `src/future-games/`; their source and unit tests are preserved. The original implementation notes below are historical where they describe these three as active. See [SOLO_ARCADE_REFINEMENT.md](SOLO_ARCADE_REFINEMENT.md) for current behavior and verification.

# Eight new Solo Arcade games

The collection now has ten solo games including the existing Snake and Star Patrol. All eight additions have isolated rules, a Phaser renderer, original vector previews, host pause/restart/results, procedural sound, and separate persisted personal bests. No networking, dependencies or deployment were added.

| Game | Play | Progression |
|---|---|---|
| Tower Stack | Tap/Space to place moving blocks; overhang is removed | Endless tower, perfect-placement combos, rising lateral speed |
| Ricochet | Pull back from the ball; arrows/Space also aim/fire | Eight hand-authored rooms, five shots each; four-second flights, reflective walls and removable targets |
| Orbit Hop | Tap/Space to launch along the orbit tangent | Endless generated planets, inverse-square attraction with bounded acceleration, three lives |
| Pocket Pinball | Tap sides or hold A/D/arrows; bottom center/Space launches | Three balls, rotating flipper impulses, bumpers, combos and earned multiball |
| Color Switch | Tap/Space to hop through matching ring segments | Rotating four-color rings, checkpoints, gradually faster rotation, three lives |
| Slide Escape | Drag along block axes; selected blocks also use arrows | Eight distinct reproducible puzzles, undo/retry, completion scoring |
| Perfect Pour | Hold touch/Space then release | Ten pours using five vessel profiles, target-volume scoring, residual falling water, three misses |
| Pocket Climber | Automatic bouncing; drag or arrows/A/D steer | Endless reachable ledges, moving platforms, stars and telegraphed falling rocks |

## Implementation

Each module has `config.ts`, `index.ts`, `Rules.ts`, `Game.ts`, local SVG and AGENTS.md. `shared/arcade/ArcadeGame.ts` shares only lifecycle, fixed stepping, graphics masking, text reuse and host HUD/result integration. Rules never import another game's implementation. Physics runs at 120Hz; fast Ricochet/Pinball collisions substep to 240Hz. Arrays for debris, planets, platforms, rocks and multiballs are bounded. Pausing clears owned gestures, and disposal destroys graphics, masks and labels.

Menu previews use small packaged SVG files loaded lazily as images. Engines remain dynamically imported only when selected. Relative Vite asset URLs and the existing offline manifest retain Capacitor/Vercel compatibility. New games remain excluded from duel tournaments.

Slide puzzles are scrambled from a solved board with a recorded reversible path; automated checks verify all eight layouts, uniqueness and legal inverse moves. Browser checks additionally solve all eight using bounded breadth-first search in test code and actual pointer actions. No solver runs in normal gameplay.

## Verification

Unit checks cover overlap trimming, legal Ricochet solutions within the shot budget, successive orbital landings, Pinball impulses/multiball/lives, ring color collisions and a three-ring legal route, all puzzle solutions, accurate pours through all ten vessels, 20 seeded climbing routes, and fixed-step consistency at 30/60/144Hz.

Browser checks cover each game's real input, pause, reset, exit cleanup, menu preview loading and absence of eager engine requests. End-to-end runs solve all Slide Escape puzzles and finish all ten Perfect Pour vessels, verify Tower Stack game-over/rematch and preserve duel scores.

Physical Android hardware is not available. Touch/browser emulation and the production web build do not constitute device certification. Ricochet and Slide Escape currently contain eight levels each; Perfect Pour has ten rounds. The other five modes are endless score challenges, with three lives for Orbit Hop, Pinball and Color Switch.

Final browser regression scope also includes all eight games at 320×568, 844×390 and 1280×800, using native touch events on emulated mobile and pointer input on desktop. Existing Snake, Star Patrol, Connect Four, tournament exclusion, navigation cleanup and saved Pong/Hockey clocks pass.

Final checks: 52 targeted unit tests and 21 browser tests passed, plus production Vite build, automatic module-discovery check, and bundle budget verification. The application entry is 23,994 bytes gzip (24,000-byte budget); all 26 game implementations remain lazy. Short 1280×800 desktop frame samples for the eight new games measured approximately 60 FPS with 16.7–16.8ms p95 frame intervals. These are local browser samples, not long-session mobile hardware benchmarks.
