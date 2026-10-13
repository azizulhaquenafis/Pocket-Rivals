import { DotsBoard } from "./Rules";
import { chooseEdge } from "./AI";
self.onmessage = (e) =>
  self.postMessage(
    chooseEdge(DotsBoard.restore(e.data.state), e.data.difficulty),
  );
