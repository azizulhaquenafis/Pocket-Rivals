# Penfight

This independent module implements alternate flicks of equal rigid capsule pens. `PenPhysics.ts` owns capsule contact geometry, parallel contact midpoint, impulses, torque, dry friction, bounds and power limits. `PenRules.ts` owns the settle gate, turns, knockouts and first-to-three match. Both gameplay and AI use identical 240 Hz physics substeps. Never add walls to the desk edge or move pens directly for AI.

`PenGame.ts` binds one host-owned mouse/touch drag and handles worker cancellation, pause and result reporting. `PenArt.ts` draws original vector pens/table with the current player's background; keep instructions in setup. Dragging backwards creates a forward impulse; off-centre contact adds torque. A cancelled/short gesture is not a shot.

`PenAI.ts` samples legal simulated shots with seeded personalities and bounded one-reply lookahead at the strongest setting. `ai.worker.ts` isolates search. Minimum decision delays remain independent of computation time. Existing internal difficulty keys map to **Easy/Medium/Hard** through metadata labels; do not rename global difficulty values or other games. Workers must terminate on pause/exit; late results must fail generation/shot guards.

Centre crossing the active desk edge counts as out. Let the flick settle before resolving both pens. A double-out replays. Alternate starters and use symmetric layouts. The first two flicks share a cap. Preview the new edge before it moves inward after flicks 6 and 12. At flick 18, if both survive, decide by accumulated pushes toward the edge. True ties replay. Three consecutive draws end the match. Runtime matches restart after closing. Standard results support tournaments.

Checks: `tests/unit/penfight.test.ts`, `tests/browser/penfight.spec.ts`, `test:modules`, production build and bundle guard. Keep source rules, AI and graphics here; no assets or implementation were copied from the reference site. Reference analysis and test results: `docs/PENFIGHT.md`.

Flick energy is bounded at a 410-unit centre speed. Offset shots distribute that budget between translation and angular velocity. The aim preview and AI use the same impulse and desk rules. At the 120-second foreground deadline, let an accepted flick settle, then take the score leader or draw an even match. Pass uncapped host elapsed time to advanceClock.

Aiming opts into InputManager pointer capture (`outside: true`). Drag deltas start at the actual finger position, independently of the projected contact offset, preventing a power jump on padded hit targets. Outside releases shoot once; pause, lost capture and canceled touches never shoot.
