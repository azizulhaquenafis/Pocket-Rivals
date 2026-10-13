# Ultimate Golf

- `courses/` contains the four original layouts in unscaled 1920×1080 source coordinates. Do not replace courses with invented layouts. The reference repository is read-only.
- `GolfRules` owns original difficulty, stroke limits and score formula. `GolfPhysics` owns the 240 Hz ball simulation, capture and terminal states. `GolfCollision` owns separating normals and velocity limits. `GolfDynamics` owns timed obstacles, tides, portals, UFO, bridges and doors.
- `GolfInput/GolfView` rotate world coordinates clockwise into a 288×512 (9:16) viewport; inverse transforms must stay exact at both zoom levels. Drag ownership/cancellation comes from host InputManager. One gesture may shoot once only while stopped.
- `GolfRenderer` owns one retained masked Graphics and original vector artwork. Never change collision rules to fit the display. The ball halo is visual only. `UltimateGolfGame` owns selection/help/results and lifecycle; `GolfProgress` validates per-course local records.
- Pause cancels aiming and clears the fixed accumulator. Dispose UI objects, masks and graphics. No additional RAF/timers/workers. Retain source units regardless of screen resolution.
- Tests: `tests/unit/ultimate-golf.test.ts`, `golf-routes.test.ts` (four legal tee-to-cup fixtures), `tests/browser/ultimate-golf.spec.ts`. Full routes are deterministic Easy-mode evidence, not claims that all strategies or devices were tested.
- See `docs/ULTIMATE_GOLF.md` for source provenance, mechanics and intentional differences. No AI/tournament logic belongs in this solo port.
