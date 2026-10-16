# Gravity Runner: map-specific endless courses

The fixed five-pattern loop is replaced by a seeded weighted stream. Each map has its own trap pool and motif weights. The previous two motifs are excluded from selection; side, count, width, depth, spacing and dynamic phase vary. Only an early rail lesson is guaranteed. New sections continue indefinitely; old geometry and history are bounded. First-five survival match scoring remains unchanged; a run has no timer or scripted ending.

| Map | Traps |
| --- | --- |
| Icy Heights | Triangular icicles, faceted frost blocks, broken outer paths |
| Green Valley | Sloped roots, convex brambles, clusters and log rails |
| Blue Lagoon | Water jets with smoothly pulsing physical reach, octagonal buoys |
| Violet Night | Faceted diamond crystals, timed phase gates with a closing warning |

Eight motifs cover isolated hazards, switchbacks, clusters, gaps, slaloms, double-wall rail sections, rail pinches and separated middle islands. Later spacing contracts while preserving at least 245 units between independent hazards. Rail transfers retain 180 units of entry/exit overlap. The course uses the shared middle supports whenever both outside walls disappear.

Speed stays at 120 for eight seconds. Each twenty-second stage then adds 24 units/second through a smooth three-second ramp, up to 264. The ceiling preserves reachable transfers; endless refers to generated course length, not unbounded speed. Pausing freezes the simulation, speed stages and trap phases.

ObstacleGeometry supplies the exact convex outlines to both rendering and SAT collision. Jet reach and gate activation use round age, seeded period and phase. AI forecasts advance the same age-dependent physics, speed and trap states; there are no AI-only safe zones. The obsolete round number on the rail is removed. Vector previews describe each map's own traps.

Validation:

- Full suite: 284 tests passed, including 100 Impossible two-minute routes on EACH map, 300 difficulty/seed routes,300 real AI wins against idle players, six-minute bounded streaming, deterministic 30/60/120 FPS simulation and existing game/tournament checks.
- Variation checks cover 100 seeds per map, 80 motifs per seed, reproducible geometry, distinct trap pools, nonperiodic sequences and bounded history.
- Collision checks cover empty triangular corners, jet depth extrema, real open/closed phase gates, legal platform landings and staged speed continuity.
- 14 Chrome browser checks passed: four map launches/previews, touch and keyboard controls, rail transfer, phone/landscape layout, pause/cleanup and tournament regression. Representative screens are gravity-ice.png, gravity-green.png, gravity-blue.png, gravity-purple.png and gravity-middle-rail.png.
- Production Vite build and lazy-bundle checks pass. Physics and AI remain lazy; no dependency, Math Quiz, deployment or shared controller changes.

These are seeded simulation and desktop Chrome/touch-emulation checks. They establish tested playable routes, not a proof of every possible generated route. Physical Android testing remains outstanding.
