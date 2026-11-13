# Pocket Pinball

Rules.ts owns deterministic game state and mechanics; Game.ts binds input and original vector rendering. Shared ArcadeGame owns lifecycle only. Fixed 120Hz steps, bounded object counts, no extra timers. Pause clears held gestures. Report finishArcade, never duel scores. Keep this module lazy and independently removable. Test with solo-expansion.test.ts and solo-expansion.spec.ts.
