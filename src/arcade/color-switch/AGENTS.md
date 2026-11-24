# Color Switch

Rules.ts owns deterministic state and mechanics. Game.ts binds input and renders the original vector art. Shared ArcadeGame owns lifecycle. Keep the module lazy and independently removable, with fixed 120Hz steps, bounded obstacle counts and no separate timers. Report finishArcade.

One press of touch, Space, Up, or W supplies one hop. Gravity continues between presses. A horizontal drag sets an aim that persists through later taps. Left/right arrows or A/D steer directly. Pause or cancellation clears steering, and pause discards buffered hops.

The camera follows a continuous course of recurring shapes. Crossing the visible switch line upward adds score and changes color while preserving velocity. Cleared shapes no longer collide. A wrong-color hit or fall costs one life, then places the ball below the active obstacle on its safe path. The retry can buffer one hop. Keep the obstacle contours fixed in world space. Move every color by the same distance along its contour. Draw and collide against the same arc-length bands. Retain fixed outlines and only update visible paint.

Use one matching band around each closed shape. The entry and exit open at different times. Offset the two shutter openings, and time the single crossing on the wave. Medium has slower movement, wider bands and an open-crossing guide. Hard and Impossible progressively tighten the timing and leave less room between obstacles. Verify timed routes and periods of legal bouncing inside the shapes with ordinary taps, without changing ball physics or stalling the camera.
