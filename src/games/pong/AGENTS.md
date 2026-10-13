# Pong module

PongPhysics.ts owns swept paddle collisions; PongAI.ts owns prediction; PongState.ts validates saved rallies. Game registration ID is ping-pong: do not rename it. PongGame.ts connects MatchClock to physics and HUD. Never reset the match clock on a goal.

Read only this folder, the shared contract and required shared helpers. Do not import other games or put rules in core. Own and dispose workers/graphics; use host-owned input. Relevant checks: `tests/unit/engine.test.ts and phase3.test.ts` (browser paths are under tests).
