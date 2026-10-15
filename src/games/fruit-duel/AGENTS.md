# Fruit Duel

Rules owns seven fruit IDs, target/decoys, randomized reveal duration and first-to-ten. A target is guaranteed within three reveals. Snapshot correctness at tap time; never judge against the next icon. Shared FirstResponse handles duplicate/simultaneous inputs. AI reacts only after presentation, with calibrated errors/delay. FruitArt draws all seven original silhouettes without textures. No cross-game imports.

AI identities use the lazy `shared/ai/MatchRandom.ts` utility; keep tactical parameters inside this module and preserve personality across rounds. See `docs/AI_REFINEMENT.md` for seeded replay and audit commands. Preserve legal actions and bounded worker/motion behavior when adding variety.
