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
async function exportsFor(id: string) {
  const load = modules[modulePath(id)];
  if (!load) throw Error(`Missing game factory: ${id}`);
  return load();
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
