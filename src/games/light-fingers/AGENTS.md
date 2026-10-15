# Light Fingers

Rules owns waiting/signal/active/between/done and first-to-five. Signal becomes claimable only after the render update presents it. FirstResponse arbitrates the first tap per player; same-frame ties leave the gem available and lock both players briefly. Early/missed grabs impose a 1.25s cooldown with no score changes; a successful steal gives only its owner a point. Only an attempted failed grab triggers cooldown; an idle rival is not penalized. AI starts its calibrated delay only after the shared visible signal (minimum 120ms); no hidden activation access or premature response. Pause freezes model time.

AI identities use the lazy `shared/ai/MatchRandom.ts` utility; keep tactical parameters inside this module and preserve personality across rounds. See `docs/AI_REFINEMENT.md` for seeded replay and audit commands. Preserve legal actions and bounded worker/motion behavior when adding variety.

LightArt draws original outlined gloves, an orange forearm and a gem plinth; Blue has no visible hand. The gem travels toward the successful player. Reach animations follow taps/results without delaying signal presentation or changing arbitration. Round results tint the field by winner; keyboard instructions stay in setup.
