# Lost Temple AI correction — 16 October 2026

The replay audit reproduced repeated shots around the bumper at (1060,960). One route aimed at the bumper center, which cannot satisfy its 25-unit waypoint radius around a radius-22 collider plus the radius-seven ball. Other variants aimed just behind it and approached from the obstructed side. New approach points clear the bumper instead of attempting to stop inside its collision bounds.

The audit also found repeated returns to the moving-boulder corridor: route progress was checked only after predicting reaction delay, so a mover could erase a waypoint already reached in the real state. The planner now records reached points before predicting that delay. Temple resting points also clear the moving-boulder sweep and quicksand; a two-stage upper approach crosses the quicksand instead of waiting inside it. Original course geometry, hazards, limits and human/AI physics remain unchanged. AI still executes only legal simulated shots through its existing cancellable worker.

Verification:

- Eleven targeted unit tests pass: static waypoint clearance, the reaction-delay regression, and nine full legal tee-to-cup simulations covering Medium/Hard/Impossible at seeds 11, 42 and 123. Both outer plates are required and verified; repeated ineffective shots are rejected by the regression.
- Three actual browser worker runs completed Lost Temple at seed 123: Medium 15 strokes, Hard 18, Impossible 12, all within the ordinary 27-stroke limit. No position resets, fabricated scores or authored shot velocities were used. These are bounded practical planners, not a guarantee for every possible seed.
- The complete 276-test unit suite and production build passed. Golf navigation, SVG course previews and mobile course selection were also checked. The four portrait previews are generated from the actual course geometry without initializing gameplay.
- Happy Birds received a presentation-only pass: round bodies, oval wings, soft sky/clouds and removal of the nested box frame. Shared-arena physics, controls, timer and AI remain intact; existing touch/pause/deadlock browser checks pass and final visuals were inspected.

No Math Quiz module changes, publication, physical Android testing or controller hardware testing occurred.
