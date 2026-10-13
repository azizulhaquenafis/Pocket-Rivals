const KEY = "pocket-rivals.golf-versus.v1";
export function recordCompetition(
  mode: "local" | "ai",
  result: 1 | 2 | "draw",
) {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null");
    const data: Record<string, number> = {
      localMatches: 0,
      aiMatches: 0,
      one: 0,
      two: 0,
      draws: 0,
    };
    for (const key of Object.keys(data)) {
      const n = raw?.[key];
      if (Number.isSafeInteger(n) && n >= 0) data[key] = n;
    }
    data[mode === "local" ? "localMatches" : "aiMatches"]++;
    data[result === "draw" ? "draws" : result === 1 ? "one" : "two"]++;
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* Session gameplay never depends on persistence. */
  }
}
