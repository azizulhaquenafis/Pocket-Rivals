# Ultimate Golf

- `courses/` contains the four original layouts in unscaled 1920×1080 source coordinates. Do not replace courses with invented layouts. The reference repository is read-only.
- `GolfRules` owns original difficulty, stroke limits and score formula. `GolfPhysics` owns the 240 Hz ball simulation, capture and terminal states. `GolfCollision` owns separating normals and velocity limits. `GolfDynamics` owns timed obstacles, tides, portals, UFO, bridges and doors.
- `GolfInput/GolfView` use one uniform responsive transform: clockwise in portrait, unrotated in landscape; inverse transforms must stay exact during focus/resize. Drag ownership/cancellation comes from host InputManager. One gesture may shoot once only while stopped.
- `GolfRenderer` owns one retained masked Graphics and original vector artwork. Never change collision rules to fit the display. The ball halo is visual only. `UltimateGolfGame` owns selection/help/results and lifecycle; `GolfProgress` validates per-course local records.
- Pause cancels aiming and clears the fixed accumulator. Dispose UI objects, masks and graphics. No additional RAF loops. Cancel the shot-planning worker on pause/disposal. Retain source units regardless of screen resolution.
- Tests: `tests/unit/ultimate-golf.test.ts`, `golf-routes.test.ts` (four legal tee-to-cup fixtures), `tests/browser/ultimate-golf.spec.ts`. Full routes are deterministic lowest-tier evidence, not claims that all strategies or devices were tested.
- See `docs/ULTIMATE_GOLF.md` for source provenance, mechanics and intentional differences. `modes/` isolates casual, hot-seat and real AI race progression; `ai/` owns bounded worker shot planning. Competitive storage never changes casual records. Global tournament participation remains disabled.

AI identities use the lazy `shared/ai/MatchRandom.ts` utility; keep tactical parameters inside this module and preserve personality across rounds. See `docs/AI_REFINEMENT.md` for seeded replay and audit commands. Preserve legal actions and bounded worker/motion behavior when adding variety.

Temple AI waypoints must remain outside bumpers, quicksand and the moving-boulder sweep. Record reached route points before forecasting reaction delay; a mover must not erase completed progress. Keep original course geometry and human/AI physics identical. `golf-temple-ai.test.ts` verifies full planned completions at every AI difficulty; the browser regression runs the real planning worker.

CourseArt generates static portrait overviews from actual course data for the picker. It must not create physics/AI instances. Keep course cards readable within the app container (two columns in portrait, not a viewport-wide four-column assumption).

Golf aiming opts into host pointer capture (`outside: true`). A gesture starts inside the course, then may continue beyond the viewport/canvas and across DOM footer controls without clicking them. Keep world unprojection unclamped and the camera fixed while aiming. Test full/focused touch, outside mouse releases and cleanup in `tests/browser/outside-aim.spec.ts`.

Display tiers are Medium / Hard / Impossible. Internal 0/1/2 values, tuning and stored casual record indices stay unchanged.
