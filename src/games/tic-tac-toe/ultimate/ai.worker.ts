import { UltimateBoard } from "./UltimateRules";
import { ultimateMove } from "./UltimateSearch";
self.onmessage = ({ data }) => {
  const board = UltimateBoard.restore(data.state);
  const start = performance.now(),
    result = ultimateMove(board, data.difficulty, data);
  self.postMessage({
    id: data.id,
    ...result,
    milliseconds: performance.now() - start,
  });
};
