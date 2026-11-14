# Orbit Hop: gravity journey refinement

Planet spacing increases from the old 145–170 world pixels to 188–216 (Medium), 204–232 (Hard), or 218–246 (Impossible). Seeded lateral changes create diagonal transfers; radii shrink from 27–31 to 23–27 to 19–23 pixels. The starting planet has the same tier scale.

Each visible halo now exactly describes a finite gravity field. Flight remains ballistic outside it. Inside, inward acceleration smoothly increases toward the surface, with no boundary impulse or teleport. The launch planet briefly releases the ball so the player can escape. A surface contact attaches the ball to its orbit; entering a halo alone does not. Speed remains capped at 400 pixels/s; the existing 120Hz host simulation remains unchanged. Screen-boundary misses still cost a life on the first fixed step and reset safely.

Medium has a wider 62px field beyond the surface and the curved trajectory preview. Hard reduces it to 48px with only a tangent arrow. Impossible has 36px fields, faster orbit timing, smaller planets and no guide. All tiers use the same legal rules. Planet-specific vector colors, rings/craters, subtle halo markers, landing ripples and a bounded flight trail improve feedback. No assets, dependencies or loops are added.

Verification executed:

- 34 unit tests passed across `orbit-refinement`, `solo-refinement`, and `solo-expansion`.
- New tests simulate 80 seeds × 10 sequential legal hops × 3 tiers (2,400 transfers), with bounded planet storage and speed. Existing route checks also pass.
- Force tests establish zero acceleration outside the field, continuous bounded inward pull, and a real near-miss trajectory that only lands with gravity enabled. Halo entry does not teleport. Preview generation is deterministic and leaves the live state unchanged.
- Existing instant boundary-miss tests pass on every screen edge and tier.
- Browser Orbit Hop launch, keyboard action, pause, restart and cleanup test passed. Portrait screenshot inspected and the planet label moved into its own small corner badge to avoid overlapping planet graphics.

These are deterministic scenario and desktop-browser checks, not physical Android validation. The random generator remains lightweight; it does not run a route solver during gameplay.
