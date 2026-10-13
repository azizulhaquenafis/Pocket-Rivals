# Ultimate Golf port

Source studied: [abdullah-b41/L1T1-Game-Project](https://github.com/abdullah-b41/L1T1-Game-Project), commit `06dcdc65b06e9767e9089a032f1e465fe8ee931b`, local `~/Documents/Game-References/Ultimate-Golf/the_ultimate_golf/the_ultimate_golf.c` (6,015 lines). The source credits Abdullah Al Nafi and Syed Abdul Fahim. The reference repository was not modified; its pre-existing untracked `.DS_Store` and `the_ultimate_golf/game` remain unchanged.

This is a native TypeScript/Phaser rewrite, with no C executable, raylib dependency, original textures, music or sounds. Original course geometry and mechanics are expressed as data and small simulation classes. All displayed artwork is original Phaser Graphics/SVG, using Pocket Rivals' palette, type and UI.

## Courses and mechanics

| Original course | Ported elements |
| --- | --- |
| Foundry | Six serpentine lanes, crate, diamond, alternating girders, bumpers, oil, two conveyor belts, rotating cross, three moving beams, magnetic attraction/core, extending piston, three lava pools, timed laser |
| Shoreline | Ten islands/paths, soft and wet sand, tidal bridges and opposing currents, flowing ford, whirlpools, four moving crabs, palms, spring bumpers |
| Event Horizon | Eleven platforms, low-friction vacuum strips, solar wind, two gravity planets and black-hole field, three directed portal pairs, four asteroids, phased lasers, rotating cross, bumpers, one UFO encounter with lift and adjacent-platform drop |
| Lost Temple | Thirteen walls, river and two five-plank bridges with different collapse delays/regeneration, mud, moss, quicksand, three rolling boulders, four phased dart gates, rotating cross, bumpers, six-second entrance plate/gate, two latched plates and inner gate |

Course coordinates, tee/cup positions and obstacle dimensions retain the source's 1920×1080 units. The view rotates clockwise into an exact **9:16 portrait course**, with optional 2.5× ball-follow focus. The application letterboxes on wide screens; geometry and physics never stretch. The thin source HUD strip becomes an unused edge of the rotated map; the actual controls remain outside the course.

Mouse and touch share one pointer-owned drag path. Pull back anywhere inside the course and release; drag displacement determines direction and power. Use Focus or F for detail, Retry or R to restart, ? for course help, and Escape/back for the shared pause menu. A canceled/interrupted gesture never shoots.

## Original rules retained

Ball radius 7; maximum speed 650; pullback multiplier 3.125; minimum pullback 14 world units; normal friction 110; stop threshold 6. Special surfaces and forces override these as in the source. The cup captures within the original 16.5×16.5 box; no invented speed condition is added. Moving obstacles transfer legal relative momentum. Hazards return the ball to a safe last-shot position and do not add another stroke.

| Challenge | Obstacle speed | Stroke factor | Preview | Completion scoring |
| --- | --- | --- | --- | --- |
| Easy | 0.7× | 1.5× | 0.6 s | 100 + 10 per unused stroke |
| Normal | 1× | 1.1× | 0.3 s | 250 + 25 per unused stroke |
| Hard | 1.3× | 0.75× | Off | 500 + 50 per unused stroke |

Base limits are 18, 25, 20, 18; rounding follows the C implementation. Winning on the last stroke succeeds before the exhausted-stroke check. Best scores for each course persist under `pocket-rivals.ultimate-golf.v1`; Finish run records their sum through the shared Arcade result screen. All four courses are available immediately, matching the source level picker. Next course provides sequential progression.

## Reliability adaptations and scope

- Fixed 240 Hz simulation replaces variable frame substeps. Projection uses separating contact normals, and all forces/collisions respect the speed cap. Obstacle contact velocity follows its actual difficulty-scaled motion.
- Aiming uses the drag displacement from the initial pointer rather than requiring the finger to cover the tiny ball. It preserves power units and makes the same controls practical on mobile.
- Focus is optional; the overview always shows the complete course. The ball has a visibility halo without enlarging its collision radius.
- UFO carrying suspends ground/hazard checks until release, avoiding the source's potential mid-carry reset. Invalid numerical states recover to a safe point; ordinary slow/stationary balls do not trigger a reset.
- Aim dots are a short directional/friction estimate, not a guaranteed path. Event Horizon currently uses the same lightweight estimate instead of the source's collision/gravity-simulated preview. Actual ball gravity/collisions/portals are simulated.
- The third source portal exits into the void and can return a shot; this source behavior is retained, rather than silently moving its exit.
- Original named-player score files, desktop intro/credits screens and original art/audio are replaced by Pocket Rivals' local records, navigation and procedural effects.
- The single existing `mini-golf` registry identity now launches this faithful solo port in Arcade. The previous five-course duel source is retained but unregistered, with no duplicate menu card. Old golf duel checkpoints/tournament rounds cannot resume as Ultimate Golf; create a new tournament. Other game saves and scores remain intact. Golf has no AI or tournament participation in this port.
- Course records persist; an interrupted active golf course restarts. Android hardware and iOS Safari still require physical-device verification.

## Evidence

`tests/fixtures/golf-solutions.ts` contains reproducible **legal Easy-mode shots from each original tee to its cup**, without teleporting, bypassing hazards or resetting positions: Foundry 15, Shoreline 15, Event Horizon 13, Lost Temple 11. These replay against the same simulation used in the browser. The optional route-search source in `tests/fixtures/golf-route-search.ts` documents how those fixtures were found; it is not shipped or run by default.

Additional targeted tests cover collision projection/tunneling, 30/60/120 FPS equivalence, stroke limits, all cup completions, tides, currents, portals, UFO release, bridges, door plates, quicksand, three-difficulty stress, and coordinate inversion. Browser tests exercise real mouse/touch events, cancellation, pause, all courses, zoom, resizing, restarts and disposal. See `QA.md` for full-suite results and `performance-report.json` for measured desktop Chrome samples.

The upstream checkout contains no LICENSE file. No claim of a redistribution license is made; confirm author permission for the mechanically derived port/course layouts before independent commercial publication. Nothing was published or pushed.
