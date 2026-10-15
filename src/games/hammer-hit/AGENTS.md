# Hammer Hit

Rules.ts owns exactly three integer strike scores per player. Compare integer totals; divide by three only for display/result averages. Never use best strike or rounded averages to choose a winner. The controller runs alternating full-field turns; the rule engine retains separate sine gauges. Reset the active gauge after handoff and block input until the strike animation finishes. Local Blue turns rotate module-owned content through TurnView while host navigation stays fixed. AI watches the same legal needle after a 1.2–1.5 second preparation delay. Pause freezes handoff and gauge clocks. Defaults: score 0–100, reveal cooldown 1.1s. No frame-count timing.

AI identities use the lazy `shared/ai/MatchRandom.ts` utility; keep tactical parameters inside this module and preserve personality across rounds. See `docs/AI_REFINEMENT.md` for seeded replay and audit commands. Preserve legal actions and bounded worker/motion behavior when adding variety.

User-requested precision variation: Impossible samples a legal target once per strike: 70% 97–100, 25% 90–96, 5% 75–89 (97 belongs to the top band). Never assign scores directly. Gauge/AI run at 600Hz inside the bounded fixed-step update. The hammer rotates around a fixed grip; do not translate its pivot between animation phases.

StrikePhysics owns presentation-only ballistic puck flight and bell contact; ImpactRing is a damped spring. Both use the existing bounded fixed-step loop. A perfect score reaches the bell; non-perfect trajectories peak below it. Scores still come exclusively from Rules. Scale labels alternate lanes. Popup and ring motion pause with gameplay and have no independent timers.
