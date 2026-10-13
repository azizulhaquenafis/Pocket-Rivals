import { planShot, type PlanInput } from "./ShotPlanner";
self.onmessage = (event: MessageEvent<PlanInput>) =>
  self.postMessage(planShot(event.data));
