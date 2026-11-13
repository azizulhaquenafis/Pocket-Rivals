import type {
  GameExports,
  MatchOptions,
  TutorialUI,
} from "../shared/contracts/GameModule";
import { modulePath } from "./GameRegistry";
const modules = import.meta.glob<GameExports>([
  "../games/*/index.ts",
  "../arcade/*/index.ts",
]);
const pending = new Map<string, Promise<GameExports>>();
function exportsFor(id: string) {
  const load = modules[modulePath(id)];
  if (!load) throw Error(`Missing game factory: ${id}`);
  let task = pending.get(id);
  if (!task) {
    task = load().catch((error) => {
      pending.delete(id);
      throw error;
    });
    pending.set(id, task);
  }
  return task;
}
export async function loadGame(id: string, options: MatchOptions) {
  return (await exportsFor(id)).default(options);
}
export async function loadTutorial(
  id: string,
  variant: string,
  ui: TutorialUI,
) {
  await (await exportsFor(id)).tutorial?.(variant, ui);
}

/** Fetch only the selected game while its setup is open. No factory or listeners yet. */
export async function preloadGame(id: string) {
  await exportsFor(id);
}
