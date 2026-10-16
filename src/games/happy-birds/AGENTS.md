# Happy Birds

One shared 320×460 arena; auto-flying birds bounce on safe walls and flap through ordinary input. First to 15 collected stars wins, with a draw for equal same-step finishes. No survival points, score penalties, round resets or match deadline. One 1.1-second opening beat precedes the continuous race.

Rules owns seeded wall patterns and defers telegraphed changes until active birds clear the wall. Stars owns exactly one shared collectible and swept pickup distances. Spawn candidates cover x 58–262/y110–350, with at least 65 units from active birds and 80 from the previous star; bounded rejection sampling has a farthest-candidate fallback. No fixed player slots or alternating sides. The nearest eligible bird collects; exactly tied contacts share credit. Replacement stars have a brief birth animation. Never award points without actual contact or let recovering birds collect. Bursts are bounded and expire.

ArenaPhysics owns radius 15 bird collision with wall triangles; 120 Hz simulation, 140 ms flap lock. No bird-to-bird collision. Recovery owns the independent three-second knockout: gray at impact, eased curved return to middle positions 140/180×230, gradual recoloring and automatic upward relaunch. During recovery, collision, collection and human/AI flaps are disabled for that bird only. Pause freezes recovery. There is no numeric cooldown label or timer object.

AI routes toward visible stars and safe wall openings using legal flaps, difficulty-specific reactions and seeded personalities. It must collect the same physical stars as humans. BirdView interpolates position, turns and saturation; per-bird reset clears respawn trails without interrupting the opponent. BirdArt owns round vector birds, hinged wings, gold stars and collection bursts. One retained masked Graphics plus two compact target labels; dispose all module resources. No extra RAF, textures or unowned timers.

Orange Space/A or lower touch half; Blue arrows/Enter/L or upper half. In AI mode arrows control Orange. Host input subscriptions reject repeat, pause and clean up on exit. Keep keyboard instructions in setup, not the arena. Thumbnail should depict this shared star arena, never pipes.

Checks: happy-birds.test.ts, premium-motion.test.ts, expansion-framerate.test.ts; birds-stars.spec.ts, premium-motion.spec.ts, gravity-landscapes.spec.ts, expansion-phase2.spec.ts and tournament regression in clean-ui.spec.ts.
