# Gravity Runner

One shared portrait corridor; cross-track physics y=0..170, progress scrolls vertically. Both runners share distance, hazards and legal flips. Orange Space/A/lower touch half; Blue Up/Enter/L/upper half. First five survival points; simultaneous deaths replay. Runs have no time limit or forced reset: they end only on collision. An eight-second warm-up precedes smooth three-second speed ramps every twenty seconds, from 120 toward a validated 264 maximum.

CourseStream owns bounded seeded endless generation. It chooses weighted map-specific motifs while excluding the previous two choices; there is no repeating pattern cycle. Widths, sides, counts, spacing and phases vary. Later sections are denser, with at least 245 units of clearance between independent hazards. One early rail teaches the transfer. Rail gaps begin/end 180 units inside the support; pinches/islands use intact outer walls. Retire geometry behind the camera; keep history capped at 16.

Map trap families: ice icicles/frost blocks; green roots/brambles; blue sinusoidal water jets/octagonal buoys; purple crystals/timed phase gates. Maps.ts contains lightweight metadata/previews only. CourseStream and physics stay lazy. Do not add other games' logic here.

ObstacleGeometry is authoritative for rendering and collision: triangle/trapezoid/convex silhouettes use SAT against the 26×18 runner footprint; jets change depth with seeded time and phase gates actually open. Pass the same round age to gameplay, renderer and AI forecasts. Open phase gates warn before activation. Runnable platform faces use swept landing; front penetration and returning-wall rescue are rejected. 120 Hz integration, gravity 900, 160 ms legal flip lock. No runner-to-runner collision or AI exemptions.

AI forecasts use the same advanceRunner, age-dependent speed and moving trap phases. Difficulty controls reaction distribution, visible lookahead and one/two-flip search. Safe movement remains stable. Seeded replay uses MatchRandom.

GravityView interpolates presentation only. GravityArt/TrapArt retain one masked Graphics; no extra RAF/textures. Round numbers are removed from the rail. Dispose graphics and mask; host owns input cleanup.

Tests: gravity-runner.test.ts, gravity-variation.test.ts, expansion-framerate.test.ts, premium-motion.test.ts; gravity-landscapes.spec.ts, gravity-shared.spec.ts and expansion/tournament browser regressions. Preserve independent automatic registration and lazy loading.
