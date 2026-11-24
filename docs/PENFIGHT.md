# Penfight

A schoolyard field study describes the aim as flicking your own pen to dislodge the other pen without overshooting the table. The browser rulebook also describes alternating flicks, centre-of-pen knockouts, and replaying double-outs. [Field study](https://www2.eecs.berkeley.edu/Pubs/TechRpts/2008/EECS-2008-155.pdf) · [Pen Fight rulebook](https://penfight.net/how-to-play/)

## Play

Choose two local players or Easy, Medium or Hard AI. Pull back from your highlighted pen and release. The dotted path previews the pen's travel up to the first contact. Centre flicks push and tip flicks trade distance for spin. The first two flicks have the same power cap. Cancelled and short drags leave the turn available.

A pen is out once its centre crosses the visible edge. A self-out loses and a double-out replays. The play area narrows after 6 and 12 flicks, with the next edge marked in advance. If both pens reach 18 flicks, the round goes to the player whose flicks drove the other pen closer to the edge by the greater total distance. An even round replays. Starters alternate and each round uses a symmetric starting layout.

First to three round wins takes the match. At 120 foreground seconds, the current flick resolves and the score leader wins. A tied score draws. Pause excludes time spent away from play.

## Implementation

`src/games/penfight/` contains rules, rigid capsule physics, vector rendering, pointer handling, AI and worker. Capsule contacts transfer linear/angular momentum; broad parallel contacts use their overlap midpoint to avoid false tip torque. Friction dissipates energy at fixed 240 Hz substeps, shared by play and candidate simulation. Only settled pens can be shot. Both the worker and the live match apply the same opening cap and desk changes. Presentation interpolates between fixed states and clips falling pens to the playfield. Pause cancels gestures/search and freezes simulation.

AI settings vary candidate count, reaction delay and evaluation quality; Hard also checks a bounded set of opponent replies. Search runs in a cancellable worker with a bounded time/node budget and legal analytic fallback if workers are unavailable. It cannot teleport, change scores, or alter the physics. Internal existing difficulty keys retain saved-data/tournament compatibility; optional metadata labels display Easy/Medium/Hard for this game alone.

The registry discovers the folder automatically, loads gameplay/AI only on selection and includes standard match results in tournaments. Mid-match checkpoint persistence is not implemented; closing a real-time round restarts it. Settings now loads on demand to keep startup within the existing shell budget while adding the new card; delayed imports cannot replace a newer game/modal.

## Verification

Targeted physics/rules tests cover legal ownership, invalid/power-capped shots, friction/settling, rotation-sensitive hit tests, collision momentum and tip spin, self/double-outs, scoring/terminal guards, round replay and long-match limits. They also run 100 seeded physical matches, 100 overlap/high-speed scenarios and legal candidate searches at all three difficulties. Browser checks cover touch and mouse shots, cancellation, turn gating, AI delays, pause/resume, a 320×568 viewport, cleanup, production launch, Settings and automatic tournament eligibility.

Physical Android hardware has not been tested. This is a local, offline-capable physics game; no networking, accounts or stake-based pen trading are included.

Initial integration checks: **10 dedicated Penfight unit tests and seven browser checks passed**. Automatic module-discovery check, TypeScript/Vite production build and bundle guard passed. The application shell measured **23,102 gzip bytes**, below its unchanged 24,000-byte budget; Penfight and its AI worker remain lazy. Updated mobile and desktop aiming screenshots were inspected.

Broader regression run: 310 of 312 tests passed; the existing Car Duel and Gravity Runner long simulations exceeded wall-time limits on this machine. Car Duel then passed its isolated rerun; Gravity Runner's 400-route stress test still exceeded its explicit 120-second allowance, with a worker-reporting timeout. No assertions failed in Penfight, and those unrelated modules/tests were not changed. Early browser runs used accelerated clocks and hit timing/transition races; the final checks use normal browser time and inspect recorded legal AI delay/candidate data.
