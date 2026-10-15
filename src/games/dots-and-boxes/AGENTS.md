# Dots and Boxes

Rules.ts owns 40 edges and 16 boxes. Horizontal edges 0–19, vertical 20–39. Only completed boxes score; capture retains turn, including double captures. Saves replay legal history. AI is cancellable worker alpha-beta with extra-turn awareness, capture/chain ordering and bounded endgame search; no perfect-play claim. Game owns only rendering/input/feedback and reports one result. Test rules and worker legality before changing edge numbering or scoring.

AI identities use the lazy `shared/ai/MatchRandom.ts` utility; keep tactical parameters inside this module and preserve personality across rounds. See `docs/AI_REFINEMENT.md` for seeded replay and audit commands. Preserve legal actions and bounded worker/motion behavior when adding variety.
