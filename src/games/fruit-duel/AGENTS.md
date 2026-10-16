# Fruit Duel

Rules owns seven real-fruit IDs (0–6), three decoys (7 gift, 8 medal, 9 flower), reveal timing, cooldowns and first-to-ten. Real fruit is guaranteed within three reveals. Any real fruit scores; there is no target-memory task. Empty/decoy swings cause 1.35s recovery and never give points to the rival. Successful swings recover for .72s; FirstResponse arbitrates ties. Capture the object ID at input time, before another reveal. AI sees only presented objects, uses the same tap/cooldown API, and Impossible never intentionally attacks decoys.

FruitArt owns original fruit, decoys, curved swords and cut interiors. FruitGame uses retained graphics, bounded split halves/droplets, short swing motion and edge cooldown arcs. Slice visuals/sound wait .15s for blade impact. No live instructions or keyboard labels. Pause freezes all clocks and animation; host input and global audio handle lifecycle. No new textures, workers, RAF or cross-game imports. MatchRandom supplies seeded match replay.

Tests: fruit-duel.test.ts (300 seeded AI completions plus invalid inputs/cooldown/ties/object changes), fruit-timer-effects.spec.ts, existing complete-match expansion browser check.

SwordMotion defines mirrored windup, impact, follow-through and slow return paths. Each sword returns to its original backed-away resting position after every strike. Rules and rendering share the same recovery duration/start time; input unlocks exactly when the sword reaches rest. No separate shake/tween/arc timer.
