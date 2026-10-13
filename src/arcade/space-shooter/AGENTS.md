# Solo arcade module

ShooterWorld.ts owns formations, waves, swept projectile collisions, damage immunity and a fixed 80-projectile pool. SpaceShooterGame.ts maps touch/keyboard controls and draws original geometric assets. Bounds, legal player speed and projectile recycling belong in the world. Report finishArcade; never duel points.

Use only this module and shared contracts/helpers. Phaser owns the render loop; use fixed stepping and host-cleaned inputs. Relevant checks: tests/unit/phase3.test.ts and tests/browser/phase3.spec.ts. Arcade metadata must exclude tournaments.
