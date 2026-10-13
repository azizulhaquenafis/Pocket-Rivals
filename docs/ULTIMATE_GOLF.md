# Ultimate Golf port

Source studied: [abdullah-b41/L1T1-Game-Project](https://github.com/abdullah-b41/L1T1-Game-Project), commit `06dcdc65b06e9767e9089a032f1e465fe8ee931b`, local `~/Documents/Game-References/Ultimate-Golf/the_ultimate_golf/the_ultimate_golf.c` (6,015 lines). The source credits Abdullah Al Nafi and Syed Abdul Fahim. The reference repository was not modified; its pre-existing untracked `.DS_Store` and `the_ultimate_golf/game` remain unchanged.

This is a native TypeScript/Phaser rewrite, with no C executable, raylib dependency, original textures, music or sounds. Original course geometry and mechanics are expressed as data and small simulation classes. All displayed artwork is original Phaser Graphics/SVG, using Pocket Rivals' palette, type and UI.

## Courses and mechanics

| Original course | Ported elements                                                                                                                                                                                                                                                |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Foundry         | Six serpentine lanes, crate, diamond, alternating girders, bumpers, oil, two conveyor belts, rotating cross, three moving beams, magnetic attraction/core, extending piston, three lava pools, timed laser                                                     |
| Shoreline       | Ten islands/paths, soft and wet sand, tidal bridges and opposing currents, flowing ford, whirlpools, four moving crabs, palms, spring bumpers                                                                                                                  |
| Event Horizon   | Eleven platforms, low-friction vacuum strips, solar wind, two gravity planets and black-hole field, three directed portal pairs, four asteroids, phased lasers, rotating cross, bumpers, recurring UFO visits with lift and safe adjacent-platform drop                |
| Lost Temple     | Thirteen walls, river and two five-plank bridges with different collapse delays/regeneration, mud, moss, quicksand, three rolling boulders, four phased dart gates, rotating cross, bumpers, six-second entrance plate/gate, two latched plates and inner gate |

Course coordinates, tee/cup positions and obstacle dimensions retain the source's 1920×1080 units. Portrait screens rotate the course clockwise; landscape uses the source orientation. A responsive DOM header/footer reserves real touch targets and spacing, and the remaining viewport uses one uniform camera scale. Full view fits the course; Focus magnifies the ball neighborhood to a readable scale (2.2–4×), follows smoothly and clamps to world bounds. Input uses the exact inverse transform; the camera stays still during a drag. There is no independent X/Y scaling or clipped permanent footer text.

Mouse and touch share one pointer-owned drag path. Pull back anywhere inside the course and release; drag displacement determines direction and power. Use Focus or F for detail, Retry or R to restart, ? for course help, and Escape/back for the shared pause menu. A canceled/interrupted gesture never shoots.

## Original rules retained

Ball radius 7; maximum speed 650; pullback multiplier 3.125; minimum pullback 14 world units; normal friction 110; stop threshold 6. Special surfaces and forces override these as in the source. The cup captures within the original 16.5×16.5 box; no invented speed condition is added. Moving obstacles transfer legal relative momentum. Hazards return the ball to a safe last-shot position and do not add another stroke.

| Challenge | Obstacle speed | Stroke factor | Preview | Completion scoring         |
| --------- | -------------- | ------------- | ------- | -------------------------- |
| Easy      | 0.7×           | 1.5×          | 0.6 s   | 100 + 10 per unused stroke |
| Normal    | 1×             | 1.1×          | 0.3 s   | 250 + 25 per unused stroke |
| Hard      | 1.3×           | 0.75×         | Off     | 500 + 50 per unused stroke |

Base limits are 18, 25, 20, 18; rounding follows the C implementation. Winning on the last stroke succeeds before the exhausted-stroke check. Best scores for each course persist under `pocket-rivals.ultimate-golf.v1`; Finish run records their sum through the shared Arcade result screen. All four courses are available immediately, matching the source level picker. Next course provides sequential progression.

## Reliability adaptations and scope

- Fixed 240 Hz simulation replaces variable frame substeps. Projection uses separating contact normals, and all forces/collisions respect the speed cap. Obstacle contact velocity follows its actual difficulty-scaled motion.
- Aiming uses the drag displacement from the initial pointer rather than requiring the finger to cover the tiny ball. It preserves power units and makes the same controls practical on mobile.
- Focus is optional; the overview always shows the complete course. The ball has a visibility halo without enlarging its collision radius.
- UFO carrying suspends ground/hazard checks until release, avoiding the source's potential mid-carry reset. Invalid numerical states recover to a safe point; ordinary slow/stationary balls do not trigger a reset.
- Aim dots retain the original difficulty-dependent preview: a short direction/friction estimate in three courses and a bounded physics/gravity preview in Event Horizon. The latter uses a disposable simulation snapshot, never mutates the live ball and stops at collisions, portals or hazards. Moving hazards can still change before release.
- The third source portal exited into the void. Its destination moved from (960,250) to (960,310), so the 35-unit exit offset lands inside the intended platform with ball clearance. No difficult obstacle was removed.
- Horizon UFO visits begin at 11.5 obstacle seconds and repeat every 28; warning 1.5 s, speed 170, active duration 13 s, hover 1 s, carry 0.8 s, cooldown 8 s. These values live in course data. Seed/event hashing makes independent competitors reproducible.
- Persistent contact oscillation (8 seconds, under 55 world units, over 24 impacts, still moving) recovers to a safe last shot. Legitimate resting/slow balls do not trigger this detector.
- Original named-player score files, desktop intro/credits screens and original art/audio are replaced by Pocket Rivals' local records, navigation and procedural effects.
- The single existing `mini-golf` registry identity now launches this faithful solo port in Arcade. The previous five-course duel source is retained but unregistered, with no duplicate menu card. Old golf duel checkpoints/tournament rounds cannot resume as Ultimate Golf; create a new tournament. Other game saves and scores remain intact. Golf has dedicated AI/local races, separate from the global duel tournament.
- Course records persist; an interrupted active golf course restarts. Android hardware and iOS Safari still require physical-device verification.

## Evidence

`tests/fixtures/golf-solutions.ts` contains reproducible **legal Easy-mode shots from each original tee to its cup**, without teleporting, bypassing hazards or resetting positions: Foundry 15, Shoreline 15, Event Horizon 13, Lost Temple 11. These replay against the same simulation used in the browser. The optional route-search source in `tests/fixtures/golf-route-search.ts` documents how those fixtures were found; it is not shipped or run by default.

Additional targeted tests cover collision projection/tunneling, 30/60/120 FPS equivalence, stroke limits, all cup completions, tides, currents, portals, UFO release, bridges, door plates, quicksand, three-difficulty stress, and coordinate inversion. Browser tests exercise real mouse/touch events, cancellation, pause, all courses, zoom, resizing, restarts and disposal. A complete Lost Temple browser run also reaches the cup in 14 strokes through real touch events, then verifies victory, score banking and persistence after reload. See `QA.md` for full-suite results and `performance-report.json` for measured desktop Chrome samples.

The upstream checkout contains no LICENSE file. No claim of a redistribution license is made; confirm author permission for the mechanically derived port/course layouts before independent commercial publication. Nothing was published or pushed.

## Golf modes

- **Casual** retains all original challenge settings, stroke allowances, points and personal records.
- **2 Player** is hot-seat: Player 1 completes the selected course/tour, then Player 2 receives identical seeded initial conditions. Each course has a 180-second foreground timeout and Easy stroke allowance. Menus, help, handoffs and pause time are excluded. Completing the tour beats DNF; two DNFs draw. Otherwise total time wins, within 0.1 s fewer strokes wins, then draw.
- **vs AI** advances two independent physics worlds concurrently. A blue outlined ghost shows the real opponent position when on the same course. The first completed tour wins; a 0.1 s window handles effectively simultaneous finishes. Exceeding time/strokes or forfeiting loses, simultaneous failure draws. Results/rematch are module-owned.
- Competition counters use `pocket-rivals.golf-versus.v1`, never the casual record key.

`modes/` isolates clocks/progression/scoring; `ai/` contains navigation waypoints and the shot planner. The planner simulates candidate angles, powers and waiting times against a live physics snapshot in a cancellable worker. Medium/Hard/Impossible use 65/140/240 ms search budgets and 1.1/0.8/0.65 s decision delays; Medium has small periodic aiming errors. AI calls the same `shoot` API and uses the same limits. Impossible is bounded practical search, not optimal play. Waypoints are route guidance, not scripted shot velocities. Performance budgets can reduce candidate count on slower hardware.

Run `npx vitest run --config tests/fixtures/golf-audit.config.ts` for the optional full AI route audit. The tested seed (123), Impossible difficulty and simulated decision timing completed all four courses legally (15/15/10/13 shots in the recorded run); this is not a guarantee for every seed or difficulty. The normal route fixtures separately establish legal course completion and never alter ball positions. Full browser tests now use responsive DOM controls and verify focused touch input, mouse input, mobile/landscape footer spacing, hot-seat handoff, real worker shots, pause/cleanup, and a complete casual Temple run.
