import { planGolfShot } from "./GolfAI";
self.onmessage = (e) =>
  self.postMessage(planGolfShot(e.data.course, e.data.ball, e.data.difficulty));
