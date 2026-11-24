# Paper Glider

- Own rules, vectors and controls in this module. Keep config lightweight and engine lazy.
- Use ArcadeGame fixed step, sub-step interpolation and guarded input; no extra timers or loops.
- Medium, Hard and Impossible keep distinct descent speeds, gate widths, wind strengths and landing tolerances.
- Endless level progression with 3 hearts: each level narrows obstacle gates (`gap`) and landing strip width (`landingWidth`) down to fair playable floors.
- Aerodynamic air resistance computes linear + quadratic drag relative to crosswind (`vx - wind`), giving faster tailwind glide and slower headwind push; crosswind shifts randomly and slowly (holding 2.6–6.0s per gust with gradual easing) rather than oscillating rhythmically, shown by the moving top wind bar and sky breeze streaks.
- Landing zone renders a green runway flanked by red dotted miss lines for clear game-over boundaries.
- Preserve pure rule tests and touch/keyboard parity. No duel scoring.
