const svg = (body: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
export const icons = {
  settings: svg(
    '<path d="m9 3-.6 2.2-2 .9-2-.6-2 3.5 1.5 1.6v2.3l-1.5 1.6 2 3.5 2-.6 2 .9L9 21h4l.6-2.2 2-.9 2 .6 2-3.5-1.5-1.6v-2.3L19.6 9l-2-3.5-2 .6-2-.9L13 3Z"/><circle cx="11" cy="12" r="3"/>',
  ),
  sound: svg(
    '<path d="m11 4-5 4H3v8h3l5 4V4Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  ),
  muted: svg('<path d="m11 4-5 4H3v8h3l5 4V4Z"/><path d="m16 9 6 6m0-6-6 6"/>'),
  arrow: svg('<path d="M5 12h14m-6-6 6 6-6 6"/>'),
  close: svg('<path d="m6 6 12 12m0-12L6 18"/>'),
  cup: svg(
    '<path d="M7 3h10v7a5 5 0 0 1-10 0V3Zm0 2H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4m-5 3v6m-4 0h8"/>',
  ),
  people: svg(
    '<circle cx="8" cy="7" r="3"/><circle cx="17" cy="8" r="2.5"/><path d="M2 20v-3a6 6 0 0 1 12 0v3m2-7a5 5 0 0 1 6 5v2"/>',
  ),
  offline: svg(
    '<path d="M4 4 20 20M2 8a17 17 0 0 1 5-3m4-1a17 17 0 0 1 11 4M5 12a12 12 0 0 1 5-2m5 1a12 12 0 0 1 4 1m-11 4a6 6 0 0 1 7-1"/><circle cx="12" cy="20" r="1"/>',
  ),
  hand: svg(
    '<path d="M8 12V5a2 2 0 0 1 4 0v6-1a2 2 0 0 1 4 0v1a2 2 0 0 1 4 0v6c0 4-3 6-6 6-3 0-5-2-7-5l-3-4a2 2 0 0 1 3-2l1 1Z"/>',
  ),
};
