# Light Fingers

Rules owns waiting/signal/active/between/done and first-to-five. Signal becomes claimable only after the render update presents it. FirstResponse arbitrates the first tap per player; same-frame ties leave the gem available and lock both players briefly. Early/missed grabs impose a 1.25s cooldown with no score changes; a successful steal gives only its owner a point. Only an attempted failed grab triggers cooldown; an idle rival is not penalized. AI starts its calibrated delay only after the shared visible signal (minimum 120ms); no hidden activation access or premature response. Pause freezes model time.

AI identities use the lazy `shared/ai/MatchRandom.ts` utility; keep tactical parameters inside this module and preserve personality across rounds. See `docs/AI_REFINEMENT.md` for seeded replay and audit commands. Preserve legal actions and bounded worker/motion behavior when adding variety.

LightArt draws two opposing original outlined gloves with orange/blue cuffs around a central gem plinth, in both local and AI modes. HandMotion derives reach, recoil, grayscale recovery and carrying poses from model time; input cooldown deadlines determine when the hand returns fully colored to rest. Never add countdown text. A successful hand closes and carries the gem home; interrupted/failed animations must not restore a stolen gem. Round results tint the field by winner; keyboard instructions stay in setup.

Checks: tests/unit/light-fingers.test.ts, tests/unit/light-hands.test.ts, tests/browser/light-hands.spec.ts and the existing light-lumber-polish browser regression. Keep scoring, signal presentation and AI delays independent of animation. See docs/LIGHT_FINGERS.md.
