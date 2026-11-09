# Penfight

This independent module implements alternate flicks of equal rigid capsule pens. `PenPhysics.ts` owns capsule contact geometry, parallel contact midpoint, impulses, torque, dry friction, bounds and power limits. `PenRules.ts` owns the settle gate, turns, knockouts and first-to-three match. Both gameplay and AI use identical 240 Hz physics substeps. Never add walls to the desk edge or move pens directly for AI.

`PenGame.ts` binds one host-owned mouse/touch drag and handles worker cancellation, pause and result reporting. `PenArt.ts` draws original vector pens/table with the current player's background; keep instructions in setup. Dragging backwards creates a forward impulse; off-centre contact adds torque. A cancelled/short gesture is not a shot.

`PenAI.ts` samples legal simulated shots with seeded personalities and bounded one-reply lookahead at the strongest setting. `ai.worker.ts` isolates search. Minimum decision delays remain independent of computation time. Existing internal difficulty keys map to **Easy/Medium/Hard** through metadata labels; do not rename global difficulty values or other games. Workers must terminate on pause/exit; late results must fail generation/shot guards.

Centre crossing the desk boundary counts as out. Evaluate both pens after the same shot settles: one out loses, both out replay. Alternate the starting player each round. Thirty-six shots draw a round; three consecutive drawn rounds end a drawn match. Runtime matches restart after closing; no checkpoint support is claimed. Standard match results make this game tournament-compatible automatically.

Checks: `tests/unit/penfight.test.ts`, `tests/browser/penfight.spec.ts`, `test:modules`, production build and bundle guard. Keep source rules, AI and graphics here; no assets or implementation were copied from the reference site. Reference analysis and test results: `docs/PENFIGHT.md`.

Flick energy is bounded at a 350-unit centre speed: offset shots distribute that budget between translation and angular velocity. Do not restore free tip-spin energy. A separate 120-second foreground clock draws an unfinished match, including idle aiming; pass uncapped host elapsed time to advanceClock, never fixed-step catch-up time.

Aiming opts into InputManager pointer capture (`outside: true`). Drag deltas start at the actual finger position, independently of the projected contact offset, preventing a power jump on padded hit targets. Outside releases shoot once; pause, lost capture and canceled touches never shoot.
