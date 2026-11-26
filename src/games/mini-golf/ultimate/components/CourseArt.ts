import type { Course } from "../courses";

/**
 * Compact 200×104 scenic theme postcards (matching .golf-course-preview aspect-ratio 200/104
 * so zero artwork is cropped on mobile or desktop). Two random scenes per theme.
 */
const THEME_POSTCARDS: Record<string, readonly string[]> = {
  foundry: [
    // Postcard A: Blazing molten furnace arch, lava pool & big brass gear
    `<rect width="200" height="104" fill="#ecdcc0"/>
     <rect x="0" y="72" width="200" height="32" fill="#4f5860"/>
     <path d="M0 72 H200" stroke="#242b32" stroke-width="3.5"/>
     <!-- Glowing molten forge arch -->
     <path d="M18 72 V42 A32 32 0 0 1 82 42 V72 Z" fill="#363d45" stroke="#242b32" stroke-width="3.5"/>
     <path d="M29 72 V45 A21 21 0 0 1 71 45 V72 Z" fill="#ec622e"/>
     <path d="M38 72 V51 A12 12 0 0 1 62 51 V72 Z" fill="#ffe16c"/>
     <!-- Glowing lava puddle -->
     <ellipse cx="50" cy="86" rx="34" ry="8.5" fill="#ec5b2d" stroke="#242b32" stroke-width="3"/>
     <ellipse cx="50" cy="85.5" rx="19" ry="4" fill="#ffe47a"/>
     <!-- Bold industrial gear -->
     <g transform="translate(124 36)">
       <circle r="17" fill="#dfa043" stroke="#242b32" stroke-width="3.5"/>
       <circle r="7" fill="#ecdcc0" stroke="#242b32" stroke-width="3"/>
       <path d="M0 -22 V-16 M0 16 V22 M-22 0 H-16 M16 0 H22 M-15 -15 L-11 -11 M11 11 L15 15 M15 -15 L11 -11 M-11 11 L-15 15" stroke="#242b32" stroke-width="4.8" stroke-linecap="round"/>
     </g>
     <!-- Steel tee platform, golf ball & flag -->
     <rect x="116" y="66" width="72" height="13" rx="4" fill="#77848e" stroke="#242b32" stroke-width="3"/>
     <path d="M164 66 V34" stroke="#242b32" stroke-width="3" stroke-linecap="round"/>
     <path d="M164 34 L184 41 L164 49 Z" fill="#f49b58" stroke="#242b32" stroke-width="2.6" stroke-linejoin="round"/>
     <circle cx="136" cy="61" r="5" fill="#fffdf5" stroke="#242b32" stroke-width="2.6"/>
     <!-- Floating forge sparks -->
     <circle cx="92" cy="20" r="3" fill="#ffda66"/><circle cx="84" cy="34" r="2.2" fill="#f06834"/><circle cx="152" cy="22" r="2.5" fill="#f49b58"/>`,

    // Postcard B: Steel truss beam, molten cauldron & orange chevron conveyor belt
    `<rect width="200" height="104" fill="#ead8b9"/>
     <rect x="0" y="76" width="200" height="28" fill="#464f57"/>
     <path d="M0 76 H200" stroke="#242b32" stroke-width="3.5"/>
     <!-- Overhead factory steel girder -->
     <rect x="0" y="7" width="200" height="13" fill="#5e6972" stroke="#242b32" stroke-width="3"/>
     <path d="M14 7 L30 20 L46 7 L62 20 L78 7 L94 20 L110 7 L126 20 L142 7 L158 20 L174 7 L190 20" stroke="#242b32" stroke-width="2.2" fill="none"/>
     <!-- Glowing molten crucible pot -->
     <path d="M18 46 H70 L64 76 H24 Z" fill="#5b656e" stroke="#242b32" stroke-width="3.5" stroke-linejoin="round"/>
     <ellipse cx="44" cy="46" rx="26" ry="7" fill="#f06630" stroke="#242b32" stroke-width="3"/>
     <ellipse cx="44" cy="46" rx="14" ry="3.4" fill="#ffe472"/>
     <circle cx="38" cy="30" r="3" fill="#ffe066"/><circle cx="52" cy="33" r="2.4" fill="#f49b58"/>
     <!-- Conveyor belt with bright orange chevrons -->
     <rect x="82" y="62" width="106" height="16" rx="8" fill="#3e454d" stroke="#242b32" stroke-width="3"/>
     <path d="M98 66 L105 70 L98 74 M120 66 L127 70 L120 74 M142 66 L149 70 L142 74" stroke="#f6b24c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
     <!-- Golf ball & flag -->
     <circle cx="114" cy="57" r="5" fill="#fffdf5" stroke="#242b32" stroke-width="2.6"/>
     <path d="M168 62 V32" stroke="#242b32" stroke-width="3" stroke-linecap="round"/>
     <path d="M168 32 L187 39 L168 46 Z" fill="#f49b58" stroke="#242b32" stroke-width="2.6" stroke-linejoin="round"/>`,
  ],
  shoreline: [
    // Postcard A: Sunny turquoise beach, tropical palm island, lifebuoy & flag
    `<rect width="200" height="104" fill="#bcecf5"/>
     <!-- Sun & soft cloud -->
     <circle cx="164" cy="24" r="14" fill="#ffe174" stroke="#242b32" stroke-width="3"/>
     <path d="M16 28 H48 A8 8 0 0 0 42 15 A10 10 0 0 0 22 18 A7 7 0 0 0 16 28 Z" fill="#fffdf5" stroke="#242b32" stroke-width="2.6" stroke-linejoin="round"/>
     <!-- Turquoise ocean waves -->
     <rect x="0" y="56" width="200" height="48" fill="#4eb0cb"/>
     <path d="M0 56 Q25 50 50 56 T100 56 T150 56 T200 56 V66 H0 Z" fill="#7dd8e8"/>
     <path d="M0 56 Q25 50 50 56 T100 56 T150 56 T200 56" stroke="#242b32" stroke-width="3" fill="none"/>
     <!-- Golden sand island -->
     <path d="M20 88 Q96 58 176 88 Q182 99 162 100 H34 Q14 99 20 88 Z" fill="#f6e09a" stroke="#242b32" stroke-width="3.5"/>
     <!-- Tropical palm tree -->
     <path d="M56 80 Q50 58 60 38" stroke="#9b6940" stroke-width="6" stroke-linecap="round" fill="none"/>
     <path d="M56 80 Q50 58 60 38" stroke="#242b32" stroke-width="2.2" stroke-linecap="round" fill="none"/>
     <path d="M60 38 Q40 31 32 44 Q48 42 60 38 Z M60 38 Q46 22 34 25 Q47 34 60 38 Z M60 38 Q78 24 88 34 Q73 37 60 38 Z M60 38 Q80 39 85 51 Q70 44 60 38 Z" fill="#68b065" stroke="#242b32" stroke-width="2.4" stroke-linejoin="round"/>
     <!-- Lifebuoy -->
     <circle cx="98" cy="84" r="9" fill="#fffdf5" stroke="#242b32" stroke-width="2.6"/>
     <path d="M93 77 L103 91 M103 77 L93 91" stroke="#ef6c4d" stroke-width="3.4"/>
     <circle cx="98" cy="84" r="3.6" fill="#f6e09a" stroke="#242b32" stroke-width="2.2"/>
     <!-- Golf flag & ball -->
     <path d="M142 82 V52" stroke="#242b32" stroke-width="3" stroke-linecap="round"/>
     <path d="M142 52 L162 59 L142 66 Z" fill="#f49b58" stroke="#242b32" stroke-width="2.6" stroke-linejoin="round"/>
     <circle cx="126" cy="83" r="4.8" fill="#fffdf5" stroke="#242b32" stroke-width="2.6"/>`,

    // Postcard B: Sunny sea, white sailboat & red-striped lighthouse headland
    `<rect width="200" height="104" fill="#c3eef6"/>
     <circle cx="34" cy="24" r="13" fill="#ffe174" stroke="#242b32" stroke-width="3"/>
     <!-- Ocean horizon & ripples -->
     <rect x="0" y="60" width="200" height="44" fill="#4ba7c4"/>
     <path d="M0 60 H200" stroke="#242b32" stroke-width="3"/>
     <path d="M18 78 Q30 73 42 78 T66 78" stroke="#c3f2fa" stroke-width="2.6" stroke-linecap="round" fill="none"/>
     <!-- Sailboat -->
     <path d="M36 60 H68 L62 68 H42 Z" fill="#f49b58" stroke="#242b32" stroke-width="2.6" stroke-linejoin="round"/>
     <path d="M52 60 V34 L69 55 H52 Z" fill="#fffdf5" stroke="#242b32" stroke-width="2.6" stroke-linejoin="round"/>
     <!-- Sandy headland & striped lighthouse -->
     <path d="M94 98 Q130 66 200 72 V104 H94 Z" fill="#f5de98" stroke="#242b32" stroke-width="3.5"/>
     <path d="M146 76 L152 28 H170 L176 76 Z" fill="#fffdf5" stroke="#242b32" stroke-width="3" stroke-linejoin="round"/>
     <path d="M150 43 H172 M148 58 H174" stroke="#ef6c4d" stroke-width="7"/>
     <path d="M146 76 L152 28 H170 L176 76 Z" fill="none" stroke="#242b32" stroke-width="3" stroke-linejoin="round"/>
     <rect x="151" y="20" width="20" height="9" rx="2.5" fill="#ffe174" stroke="#242b32" stroke-width="2.6"/>
     <path d="M149 20 L161 10 L173 20 Z" fill="#ef6c4d" stroke="#242b32" stroke-width="2.6" stroke-linejoin="round"/>
     <!-- Golf flag & ball -->
     <path d="M122 86 V58" stroke="#242b32" stroke-width="3" stroke-linecap="round"/>
     <path d="M122 58 L139 64 L122 70 Z" fill="#58addb" stroke="#242b32" stroke-width="2.5" stroke-linejoin="round"/>
     <circle cx="109" cy="87" r="4.8" fill="#fffdf5" stroke="#242b32" stroke-width="2.5"/>`,
  ],
  horizon: [
    // Postcard A: Deep space, iconic ringed Saturn planet, warp portal & lunar ridge
    `<rect width="200" height="104" fill="#211b3b"/>
     <circle cx="52" cy="36" r="40" fill="#7050bd" opacity=".3"/>
     <circle cx="158" cy="68" r="36" fill="#3a8eb0" opacity=".25"/>
     <!-- Stars -->
     <circle cx="20" cy="18" r="2" fill="#fffdf5"/><circle cx="96" cy="14" r="1.8" fill="#ffe174"/><circle cx="122" cy="24" r="2.2" fill="#fffdf5"/><circle cx="182" cy="16" r="2" fill="#9ee8fa"/><circle cx="26" cy="62" r="1.6" fill="#fffdf5"/>
     <!-- Ringed Saturn planet -->
     <g transform="translate(60 39)">
       <ellipse rx="34" ry="9" transform="rotate(-16)" fill="none" stroke="#9ee8fa" stroke-width="5"/>
       <circle r="18" fill="#da9ff2" stroke="#242b32" stroke-width="3.2"/>
       <path d="M-14 -4 Q0 -10 14 -3" stroke="#f2ccff" stroke-width="3.2" stroke-linecap="round" fill="none"/>
       <path d="M-31 6 A34 9 -16 0 0 31 -6" fill="none" stroke="#f49b58" stroke-width="4" stroke-linecap="round"/>
     </g>
     <!-- Glowing space portal -->
     <g transform="translate(154 40)">
       <circle r="17" fill="#1a1430" stroke="#58addb" stroke-width="3.5"/>
       <circle r="10" fill="none" stroke="#f49b58" stroke-width="3" stroke-dasharray="10 6"/>
       <circle r="4" fill="#fffdf5"/>
     </g>
     <!-- Lunar violet ridge & flag -->
     <path d="M0 84 Q58 66 118 80 T200 76 V104 H0 Z" fill="#dcd6f0" stroke="#242b32" stroke-width="3.5"/>
     <ellipse cx="52" cy="92" rx="14" ry="4.5" fill="#beb4dd"/>
     <path d="M122 80 V52" stroke="#242b32" stroke-width="3" stroke-linecap="round"/>
     <path d="M122 52 L143 59 L122 66 Z" fill="#f49b58" stroke="#242b32" stroke-width="2.6" stroke-linejoin="round"/>
     <circle cx="102" cy="79" r="5" fill="#fffdf5" stroke="#242b32" stroke-width="2.6"/>`,

    // Postcard B: Starry space, glowing UFO tractor beam, crescent moon & alien planet
    `<rect width="200" height="104" fill="#1c1733"/>
     <circle cx="152" cy="34" r="38" fill="#5e44a8" opacity=".32"/>
     <circle cx="24" cy="18" r="2" fill="#fffdf5"/><circle cx="76" cy="14" r="1.8" fill="#ffe174"/><circle cx="122" cy="18" r="2" fill="#9ee8fa"/><circle cx="182" cy="22" r="2.2" fill="#fffdf5"/>
     <!-- Crescent moon -->
     <path d="M160 16 A15 15 0 1 0 174 41 A11.5 11.5 0 1 1 160 16 Z" fill="#ffe27a" stroke="#242b32" stroke-width="3" stroke-linejoin="round"/>
     <!-- UFO & tractor beam -->
     <path d="M72 42 L54 84 H102 L84 42 Z" fill="#9ee8fa" opacity=".26"/>
     <g transform="translate(78 36)">
       <path d="M-13 0 A13 11 0 0 1 13 0 Z" fill="#9ee8fa" stroke="#242b32" stroke-width="3"/>
       <ellipse cx="0" cy="3" rx="25" ry="8" fill="#58addb" stroke="#242b32" stroke-width="3"/>
       <circle cx="-11" cy="3" r="2.3" fill="#ffe066"/><circle cx="0" cy="4.5" r="2.3" fill="#ffe066"/><circle cx="11" cy="3" r="2.3" fill="#ffe066"/>
     </g>
     <!-- Alien cryo surface & flag -->
     <path d="M0 82 Q70 70 134 84 T200 78 V104 H0 Z" fill="#cdeaf6" stroke="#242b32" stroke-width="3.5"/>
     <path d="M150 82 V54" stroke="#242b32" stroke-width="3" stroke-linecap="round"/>
     <path d="M150 54 L170 61 L150 68 Z" fill="#f49b58" stroke="#242b32" stroke-width="2.6" stroke-linejoin="round"/>
     <circle cx="78" cy="76" r="5" fill="#fffdf5" stroke="#242b32" stroke-width="2.6"/>`,
  ],
  temple: [
    // Postcard A: Stepped Mayan temple pyramid, emerald jungle canopy & golden rune
    `<rect width="200" height="104" fill="#cfe2b2"/>
     <!-- Jungle canopy leaves -->
     <circle cx="14" cy="16" r="22" fill="#77a362" stroke="#242b32" stroke-width="3"/>
     <circle cx="186" cy="15" r="24" fill="#689455" stroke="#242b32" stroke-width="3"/>
     <!-- Stepped temple pyramid -->
     <rect x="38" y="62" width="124" height="18" rx="3.5" fill="#a8b596" stroke="#242b32" stroke-width="3"/>
     <rect x="54" y="45" width="92" height="17" rx="3.5" fill="#b7c2a6" stroke="#242b32" stroke-width="3"/>
     <rect x="70" y="28" width="60" height="17" rx="3.5" fill="#c5ceb6" stroke="#242b32" stroke-width="3"/>
     <!-- Temple portal & sun rune -->
     <path d="M87 80 V56 A13 13 0 0 1 113 56 V80 Z" fill="#3a453c" stroke="#242b32" stroke-width="3"/>
     <circle cx="100" cy="36.5" r="7" fill="#f4d06b" stroke="#242b32" stroke-width="2.6"/>
     <circle cx="100" cy="36.5" r="2.8" fill="#58addb"/>
     <!-- Hanging vines -->
     <path d="M46 16 Q50 32 45 48 M154 16 Q149 32 153 49" stroke="#4f7c46" stroke-width="3.2" stroke-linecap="round" fill="none"/>
     <!-- Mossy lawn, flag & ball -->
     <rect x="0" y="79" width="200" height="25" fill="#8eb272"/>
     <path d="M0 79 H200" stroke="#242b32" stroke-width="3.5"/>
     <path d="M164 84 V56" stroke="#242b32" stroke-width="3" stroke-linecap="round"/>
     <path d="M164 56 L183 62 L164 69 Z" fill="#f49b58" stroke="#242b32" stroke-width="2.6" stroke-linejoin="round"/>
     <circle cx="44" cy="88" r="5" fill="#fffdf5" stroke="#242b32" stroke-width="2.6"/>`,

    // Postcard B: Twin-torch stone temple archway & turquoise jungle waterfall
    `<rect width="200" height="104" fill="#d4e6ba"/>
     <!-- Stone archway & pillars -->
     <rect x="30" y="26" width="18" height="54" rx="3" fill="#9faa8d" stroke="#242b32" stroke-width="3"/>
     <rect x="152" y="26" width="18" height="54" rx="3" fill="#9faa8d" stroke="#242b32" stroke-width="3"/>
     <rect x="22" y="18" width="156" height="12" rx="4" fill="#b4be9f" stroke="#242b32" stroke-width="3"/>
     <!-- Turquoise waterfall -->
     <rect x="74" y="30" width="52" height="50" fill="#8ad8cf" stroke="#242b32" stroke-width="2.8"/>
     <path d="M88 36 V74 M101 41 V76 M114 35 V72" stroke="#e4fbf8" stroke-width="3.4" stroke-linecap="round"/>
     <!-- Glowing twin temple torches -->
     <circle cx="39" cy="14" r="6.5" fill="#f49b58" stroke="#242b32" stroke-width="2.4"/>
     <circle cx="161" cy="14" r="6.5" fill="#f49b58" stroke="#242b32" stroke-width="2.4"/>
     <!-- Stone terrace & jade basin -->
     <rect x="0" y="79" width="200" height="25" fill="#89ad6e"/>
     <path d="M0 79 H200" stroke="#242b32" stroke-width="3.5"/>
     <ellipse cx="100" cy="90" rx="42" ry="8.5" fill="#8ad8cf" stroke="#242b32" stroke-width="2.8"/>
     <!-- Golf flag & ball -->
     <path d="M46 86 V58" stroke="#242b32" stroke-width="3" stroke-linecap="round"/>
     <path d="M46 58 L65 64 L46 70 Z" fill="#f49b58" stroke="#242b32" stroke-width="2.6" stroke-linejoin="round"/>
     <circle cx="158" cy="89" r="5" fill="#fffdf5" stroke="#242b32" stroke-width="2.6"/>`,
  ],
};

/** Random illustrated theme postcard per course (never spoils the actual hole layout). */
export function courseArt(c: Course) {
  const variants = THEME_POSTCARDS[c.id] ?? THEME_POSTCARDS.foundry;
  const pick = variants[Math.floor(Math.random() * variants.length)];
  return `<svg class="golf-course-preview" viewBox="0 0 200 104" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${pick}</svg>`;
}
