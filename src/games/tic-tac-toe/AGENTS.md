# Tic-Tac-Toe module

The entry factory lazily imports classic/ClassicGame.ts or ultimate/UltimateGame.ts. Each variant owns its rules and AI. shared/lines.ts contains only module-local winning lines. UltimateRules is authoritative for routing/closed boards and restores legal move histories. UltimateGame maps board*9+cell into normal/focus coordinates; preserve that mapping. Expensive Ultimate search runs in a cancellable worker; Classic Impossible is exhaustively tested as unbeatable. Do not claim perfect Ultimate play.

Read only this folder, the shared contract and required shared helpers. Do not import other games or put rules in core. Own and dispose workers/graphics; use host-owned input. Relevant checks: `tests/unit/engine.test.ts, phase2.test.ts and browser/phase2.spec.ts` (browser paths are under tests).

AI identities use the lazy `shared/ai/MatchRandom.ts` utility; keep tactical parameters inside this module and preserve personality across rounds. See `docs/AI_REFINEMENT.md` for seeded replay and audit commands. Preserve legal actions and bounded worker/motion behavior when adding variety.
