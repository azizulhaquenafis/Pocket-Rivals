# Lumberjack

Rules owns identical seeded segment streams, each player's chop index, side, idle budget and three-round totals. Adjacent segments never carry branches on opposite sides, ensuring a legal choice exists. Check both current/next branches before a chop. Defaults: 20-second round cap, 85ms input cooldown, idle allowance falls from 1.5s to 0.32s; ties add rounds until cumulative scores differ. These are documented balancing choices, not reference-PDF claims. AI reads visible segments and uses the same chop API. Game draws two independent trees and flips Blue for opposite-side local play.

AI identities use the lazy `shared/ai/MatchRandom.ts` utility; keep tactical parameters inside this module and preserve personality across rounds. See `docs/AI_REFINEMENT.md` for seeded replay and audit commands. Preserve legal actions and bounded worker/motion behavior when adding variety.

LumberArt owns the original leafy trees/characters. Each half reserves a sky panel and a central round strip. Seven 28-unit segments remain visible to match AI lookahead. Chop offsets are capped at 28 units and decay exponentially; character sides change immediately so they never interpolate through the trunk. Axes swing and edge meters remain outside branch lanes. No core/rule changes for presentation.
