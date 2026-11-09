import { planShot, type PlanInput } from "./PenAI";
self.onmessage = (e: MessageEvent<PlanInput>) =>
  self.postMessage(planShot(e.data));
