# Lumberjack

Rules owns identical seeded branch streams, each player's chop index and side. First to 100 valid chops wins; hitting a branch immediately awards the opponent the match. There are no idle or round timers. The 85ms contact debounce prevents duplicate input. Adjacent segments never carry opposing branches, leaving a legal choice. Check current/next branches before every chop. AI uses the same chop API. Blue's local field rotates only on touch-primary devices. Desktop remains upright.

AI identities use the lazy `shared/ai/MatchRandom.ts` utility; keep tactical parameters inside this module and preserve personality across rounds. See `docs/AI_REFINEMENT.md` for seeded replay and audit commands. Preserve legal actions and bounded worker/motion behavior when adding variety.

LumberArt owns the original leafy trees/characters. Each half reserves a sky panel and a central goal strip. Branch slots are 28 units apart, offset 36 units above the old baseline so safe branches clear the head. Off-panel branches are culled. A lethal next branch advances visually with hitNext, without awarding a chop. Chop offsets are capped at 28 units and decay exponentially; character sides change immediately so they never interpolate through the trunk. Axes swing outside branch lanes; the host scores provide progress without extra meters. No core/rule changes for presentation.
