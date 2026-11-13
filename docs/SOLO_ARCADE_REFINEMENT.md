# Solo Arcade refinement

Active games: Snake, Star Patrol, Tower Stack, Orbit Hop, Color Switch, Perfect Pour and Pocket Climber. Ricochet, Pocket Pinball and Slide Escape are preserved under `src/future-games/`; unit tests still exercise their rules. Their old browser completion test is preserved under `tests/future/`.

## Gameplay

- **Orbit Hop:** resolves a miss on the first 120Hz physics step outside the visible arena, before off-screen planet capture. Three lives, one deduction per miss, a brief protected respawn pulse. New planetary art, comet trail and original card illustration. Medium previews the actual gravity simulation; Hard uses a short tangent; Impossible relies on timing. Orbital speeds are 1.05/1.4/1.75 rad/s; landing radii shrink by tier. A five-second flight watchdog still recovers unresolved visible flights. The landing camera follows smoothly; route validation allows it to settle between shots.
- **Color Switch:** ring rests at logical y=350 rather than 440. Clearing a ring creates a safe checkpoint and resets vertical momentum. A 700ms smooth camera transition freezes hopping and collisions, preventing accidental transition damage. Matching-color indicators on Medium, faster ring motion at higher tiers. Artwork uses soft overlapping pastel shapes, colored particles, a glossy ball and consistent outlined arcs. Ring contact uses its visible radius plus the ball radius.
- **Pocket Climber:** narrower ledges and larger vertical gaps by tier; more frequent moving ledges, crumbling ledges and telegraphed falling rocks starting after ledge two. Hard/Impossible rocks also drift sideways. Warnings last 1.35/1.15/1 seconds; spawn intervals start at 3.2/2.6/2.05 seconds and shorten with progress. Pools remain bounded. Medium marks the next ledge. Ledge widths, gap limits and motion amplitudes remain within physical jump reach. New helmet, backpack, stone and ledge detailing match the vector style.
- **Tower Stack:** increasing tier speeds, perfect-alignment tolerances of 5/3/1.5 logical pixels, alignment guides on Medium.
- **Perfect Pour:** faster flow and longer residual arrival at higher tiers; tighter scoring allowance. Medium shows where the pending water will settle. All ten glass profiles remain unchanged.
- **Star Patrol:** Medium preserves existing balance. Hard/Impossible increase formation speed (1.2/1.4x), projectile speed (1.15/1.3x), attack frequency and shorten charge warnings. Life/loot rules and per-level gear resets remain unchanged.
- **Water Guess:** new original water-vessel preview with player/percentage markers and a droplet. Packaged as a lazy local SVG asset rather than added to the startup JavaScript.

Difficulty selection pauses simulation until a choice is made, works with native buttons, and is disposed on exit/restart. Physics stays game-local. Scores retain the existing per-game personal best storage; they are not separated by difficulty.

## Verification

- Unit routes: three Color Switch rings without damage at every difficulty; five successive Orbit landings across 20 seeds per tier; 25 Climber ledges across 30 seeds per tier. Climber route tests isolate jump geometry from random rocks, with independent rock telegraph/collision and crumble checks. They do not claim every arbitrary hazard sequence is survivable.
- Boundary, repeated-life-loss, transition safety, difficulty parameter, deterministic timestep, bounded pool and existing gameplay checks.
- Browser checks: native touch and mouse at 320×568, 844×390 and 1280×800; difficulty selection, input, pause/resume, restart, disposal, preview assets and hidden deferred cards. Real-input Perfect Pour completion and Tower Stack game-over. Regression coverage includes Snake, Star Patrol, Connect Four and tournament exclusions.
- Production Vite build, module-discovery check and startup bundle budget.

Physical Android hardware is not available. Browser mobile emulation is not physical-device verification.

Final results: **80 targeted unit checks and 22 browser tests passed** across the affected suites and corrected reruns. The Vite production build, copied-module discovery check and unchanged bundle budget passed. Application entry is **23,374 bytes gzip**, down from 23,994; all 23 registered game engines remain lazy. Local server responds at `http://127.0.0.1:5173/`. No deployment or push was performed.
