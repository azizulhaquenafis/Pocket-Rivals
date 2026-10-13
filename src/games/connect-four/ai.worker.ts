import { ConnectFourBoard } from "./ConnectFourRules";
import { searchConnectFour } from "./ConnectFourAI";
import type { Difficulty } from "../../shared/contracts/AIController";
self.onmessage = (
  e: MessageEvent<{ state: unknown; difficulty: Difficulty }>,
) =>
  self.postMessage(
    searchConnectFour(
      ConnectFourBoard.restore(e.data.state),
      e.data.difficulty,
    ),
  );
