# Gravity Runner / Happy Birds refinement

Details below record an earlier milestone. See GRAVITY_TRAP_VARIATION.md for later Gravity changes and HAPPY_BIRDS_STARS.md for the subsequent star race and recovery rules.

Gravity Runner now offers Random, Icy Heights, Green Valley, Blue Lagoon and Violet Night through ordinary metadata variants, each with a small original SVG preview. The four landscapes change scenery and colors, with identical fair physics. No framework, dependency or shared game controller changed.

The match deadline and forced 100-second round reset are removed. First five survival points still wins; simultaneous deaths replay. Speed increases smoothly from 120 toward a safe limit of 230 world units/second within each run. Five streamed patterns add denser staggered hazards and long middle rails where both outside walls disappear. Rail entry and exit each have 180 units of overlap with the outside walls. Either face supports a runner through swept collision resolution; front penetration remains lethal. A returning wall cannot teleport a fallen runner back onto the course. Generated geometry is retired behind the camera; six-minute traversal stays below 30 active geometry objects.

AI uses the same physics and legal flip cooldown as humans. Medium uses a shorter forecast and slower, varied reactions; Hard and Impossible evaluate an additional future flip with progressively longer lookahead and finer decision intervals. Stable safe movement is preferred. Computation is bounded by visible lookahead and a fixed number of candidate transfers, with no extra render loop or physics engine. All three difficulties completed 100 seeded two-minute routes, including rail landings; 300 separate matches against idle humans finished with real survival points. This establishes tested routes, not a mathematical guarantee for every possible seed or human action.

Happy Birds keeps the shared arena but uses larger round bodies, expressive eyes, cream hinged wings, outlined beaks and an open cyan sky. Collision radius matches the new body size. Local controls: Orange Space/A, Blue arrow keys (Enter/L retained). In solo mode arrows control the human. Touch and host-owned cleanup remain intact. Its separate two-minute deadline is preserved.

## Verification

- `npm test -- --maxWorkers=2 --testTimeout=120000`: 279 tests pass, including rules, seeded AI routes, face collisions, no wall rescue, streaming bounds and 30/60/120-FPS consistency.
- 20 focused Playwright checks passed against the live localhost app. They cover local keyboard independence, simultaneous touch, all four themes, map previews, real rail landings, pause/resume, phone/landscape resizing, cleanup, existing tournaments, Golf previews and roster regression.
- `npm run build`: succeeds. The existing Phaser chunk-size warning remains.
- `npm run test:bundle`: succeeds; 18 game entries remain lazy. Initial compressed JavaScript totals 359,668 bytes, including Phaser.
- `npm run test:modules`: automatic discovery check passes.

Initial unrestricted concurrent tests exceeded heavy simulation timeouts; a bounded-worker run with an explicit simulation timeout passed. Browser pause tests blur the focused Resume button before sending Space, because Space legitimately activates that native button. Gameplay input itself stays disabled while paused.

Browser verification uses installed desktop Chrome with touch emulation; physical Android and controller testing are not claimed. No Math Quiz files, remote deployments or Git pushes were involved.
