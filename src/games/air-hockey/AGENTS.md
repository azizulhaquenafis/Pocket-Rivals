# Air Hockey module

AirHockeyPhysics.ts integrates at 120 Hz with three collision substeps. rink.ts owns rounded rails, goals and reachability. Resolve only approaching normals; project penetration consistently, preserve tangent motion, and interpolate mallets over all substeps. The watchdog repairs only unreachable/invalid states after 0.75 seconds, never a reachable stationary puck. PossessionClock.ts uses center ±3 hysteresis; contacts do not reset it. HockeyState.ts validates clock/physics checkpoints. AirHockeyAI.ts must use the legal motion controller.

Read only this folder, the shared contract and required shared helpers. Do not import other games or put rules in core. Own and dispose workers/graphics; use host-owned input. Relevant checks: `tests/unit/engine.test.ts, phase2.test.ts and phase3.test.ts` (browser paths are under tests).
