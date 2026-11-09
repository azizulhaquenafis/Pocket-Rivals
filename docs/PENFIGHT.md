# Penfight

Reference: [Pen Fight rules](https://www.penfight.xyz/blog/how-to-play-pen-fight/). Its playable page was blocked by a security challenge, so live mechanics/screenshots could not be verified. The accessible rules describe alternating flicks, waiting for both pens to stop, knockouts and first-to-three matches. This implementation uses those core rules with original Pocket Rivals artwork and code; no external assets, bundles or branded pens were copied.

## Play

Choose two local players or Easy, Medium or Hard AI. Touch/click your highlighted pen, pull back and release. The arrow shows the shot direction; the small bar shows power. Pulling near a pen's tip trades forward travel for spin under a constant energy budget. Centre hits push the rival; end hits rotate it. Maximum centre-flick speed is 350, so the initial separation requires positioning instead of an opening straight knockout. Let both pens settle before the next turn. Cancelled/very short drags do not count as shots.

Both pens have equal mass, shape, friction and impulse limits. Their centre crossing the desk edge counts as out, with no invisible surrounding wall. A self-out loses; double-outs replay without points. The first to three round wins takes the match. An unfinished match draws at 120 foreground seconds, including aiming; pause/background time is excluded. Round starters alternate. At 36 shots a round draws, and three consecutive drawn rounds draw the match, preventing unending no-contact matches. Current player and round winner use the existing orange/blue background and result screen.

## Implementation

`src/games/penfight/` contains rules, rigid capsule physics, vector rendering, pointer handling, AI and worker. Capsule contacts transfer linear/angular momentum; broad parallel contacts use their overlap midpoint to avoid false tip torque. Friction dissipates energy at fixed 240 Hz substeps, shared by play and candidate simulation. Only settled pens can be shot. Presentation interpolates between fixed states and clips falling pens to the playfield. Pause cancels gestures/search and freezes simulation.

AI settings vary candidate count, reaction delay and evaluation quality; Hard also checks a bounded set of opponent replies. Search runs in a cancellable worker with a bounded time/node budget and legal analytic fallback if workers are unavailable. It cannot teleport, change scores, or alter the physics. Internal existing difficulty keys retain saved-data/tournament compatibility; optional metadata labels display Easy/Medium/Hard for this game alone.

The registry discovers the folder automatically, loads gameplay/AI only on selection and includes standard match results in tournaments. Mid-match checkpoint persistence is not implemented; closing a real-time round restarts it. Settings now loads on demand to keep startup within the existing shell budget while adding the new card; delayed imports cannot replace a newer game/modal.

## Verification

Targeted physics/rules tests cover legal ownership, invalid/power-capped shots, friction/settling, rotation-sensitive hit tests, collision momentum and tip spin, self/double-outs, scoring/terminal guards, round replay and long-match limits. They also run 100 seeded physical matches, 100 overlap/high-speed scenarios and legal candidate searches at all three difficulties. Browser checks cover touch and mouse shots, cancellation, turn gating, AI delays, pause/resume, a 320×568 viewport, cleanup, production launch, Settings and automatic tournament eligibility.

Physical Android hardware has not been tested. This is a local, offline-capable physics game; no networking, accounts or stake-based pen trading are included.

Initial integration checks: **10 dedicated Penfight unit tests and seven browser checks passed**. Automatic module-discovery check, TypeScript/Vite production build and bundle guard passed. The application shell measured **23,102 gzip bytes**, below its unchanged 24,000-byte budget; Penfight and its AI worker remain lazy. Updated mobile and desktop aiming screenshots were inspected.

Broader regression run: 310 of 312 tests passed; the existing Car Duel and Gravity Runner long simulations exceeded wall-time limits on this machine. Car Duel then passed its isolated rerun; Gravity Runner's 400-route stress test still exceeded its explicit 120-second allowance, with a worker-reporting timeout. No assertions failed in Penfight, and those unrelated modules/tests were not changed. Early browser runs used accelerated clocks and hit timing/transition races; the final checks use normal browser time and inspect recorded legal AI delay/candidate data.
