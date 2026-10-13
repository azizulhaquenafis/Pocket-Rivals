# Solo arcade module

SnakeRules.ts owns the grid, fixed movement interval, two-direction input queue, safe tail movement and food spawning. SnakeGame.ts only renders/interpolates and maps pad/swipe/keyboard input. Keep movement deterministic under different render rates. Pause clears queued directions. Report finishArcade; never duel points.

Use only this module and shared contracts/helpers. Phaser owns the render loop; use fixed stepping and host-cleaned inputs. Relevant checks: tests/unit/phase3.test.ts and tests/browser/phase3.spec.ts. Arcade metadata must exclude tournaments.
