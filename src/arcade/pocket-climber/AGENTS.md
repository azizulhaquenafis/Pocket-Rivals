# Pocket Climber

Rules.ts owns deterministic game state and mechanics (including the 3-use-per-run rescue spring boosting 2 ledge tiers); Game.ts binds input (drag/keys steering + Space/Up/W or bottom Spring button) and original vector rendering. Shared ArcadeGame owns lifecycle only. Fixed 120Hz steps, bounded object counts, no extra timers. Pause clears held gestures. Report finishArcade, never duel scores. Keep this module lazy and independently removable. Test with solo-expansion.test.ts and solo-expansion.spec.ts.
