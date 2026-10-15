import type { GameResult, MatchOptions } from "../shared/contracts/GameModule";
import { icons } from "../shared/components/icons";
export function resultsContent(result: GameResult, options?: MatchOptions) {
  const draw = result.winner === "draw",
    name = result.winner === 1 ? "Orange" : "Blue";
  return `<div class="result-confetti"><i></i><i></i><i></i><i></i><i></i><i></i></div><span class="result-emblem ${draw ? "draw" : name.toLowerCase()}">${draw ? "=" : icons.cup}</span><h2 id="dialog-title">${draw ? "Evenly matched." : `${name}${options?.mode === "ai" && result.winner === 2 ? " AI" : ""} takes it!`}</h2><div class="result-score"><span>${Number(result.scores[0].toFixed(2))}</span><small>—</small><span>${Number(result.scores[1].toFixed(2))}</span></div><button class="primary-button" data-action="rematch">Rematch ${icons.arrow}</button><button class="text-button" data-action="menu">Back to all games</button>`;
}
