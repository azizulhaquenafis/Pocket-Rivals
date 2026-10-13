# Light Fingers

Rules owns waiting/signal/active/between/done and first-to-five. Signal becomes claimable only after the render update presents it. FirstResponse arbitrates the first tap per player; same-frame ties replay, early taps give the opponent one point. AI starts its calibrated delay only after the shared visible signal (minimum 120ms); no hidden activation access or premature response. Pause freezes model time.
