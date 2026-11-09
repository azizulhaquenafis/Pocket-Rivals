# Water Guess

Preserve the minimalist tube/keypad layout. Rules own integer precision, submissions, idempotent resolution and five-round/sudden-death progression; reject nonfinite input. AI is seeded per match and stays inside this folder. Controllers own scene objects; host input subscriptions are automatically removed. Pause/terminal guards must prevent actions after completion. Active matches restart after process closure.

The 310-unit tube height is shared through Geometry.ts. Impossible estimates the visible level at one logical pixel resolution; lower difficulties add a persistent estimation bias and bounded perceptual variation. Only whole percentages are valid (internal units remain hundredths). Reject fractions, out-of-range values and occupied guesses. AI selects a legal adjacent guess if its estimate is occupied. Never re-roll repeatedly to improve accuracy.

Use the playfield background for the active player, with no tube ticks or empty glass foot and a compact round counter and no repeated turn/status instructions. TurnView rotates the full local Blue field and keypad; map pointer coordinates through its inverse and reject input during transitions. AI guesses only after its foreground preparation delay.

Round reveal shows only the actual integer percentage on the winner-colored field. No bottle, guess comparisons or explanatory labels during reveal.
