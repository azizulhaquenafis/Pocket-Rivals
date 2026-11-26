import type { GameResult, MatchOptions } from "../shared/contracts/GameModule";
import { escapeHtml } from "../core/StorageManager";
import { icons } from "../shared/components/icons";
export function resultsContent(
  result: GameResult,
  options?: MatchOptions,
  names?: readonly [string, string],
) {
  const draw = result.winner === "draw";
  const side = result.winner === 1 ? "orange" : "blue";
  const p1 = names?.[0] || "Orange";
  const p2 =
    names?.[1] || (options?.mode === "ai" ? "Blue AI" : "Blue");
  const winnerLabel = escapeHtml(result.winner === 1 ? p1 : p2);
  return `<div class="result-confetti"><i></i><i></i><i></i><i></i><i></i><i></i></div><span class="result-emblem ${draw ? "draw" : side}">${draw ? "=" : icons.cup}</span><h2 id="dialog-title">${draw ? "Evenly matched." : `${winnerLabel} takes it!`}</h2><div class="result-score"><span>${Number(result.scores[0].toFixed(2))}</span><small>—</small><span>${Number(result.scores[1].toFixed(2))}</span></div><button class="primary-button" data-action="rematch">Rematch ${icons.arrow}</button><button class="text-button" data-action="menu">Back to all games</button>`;
}
