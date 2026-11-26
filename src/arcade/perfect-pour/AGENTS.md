# Perfect Pour

Rules.ts owns deterministic game state, single-commit pour locking, smooth residual drain, and rating; Game.ts binds input and renders the wall-mounted dispenser tap, continuous stream/pinch-off drops, living liquid waves, and vessel feedback. Shared ArcadeGame owns lifecycle only. Fixed 120Hz steps, bounded object counts, no extra timers. Pause clears held gestures. Report finishArcade, never duel scores. Keep this module lazy and independently removable. Test with solo-expansion.test.ts and solo-expansion.spec.ts.
