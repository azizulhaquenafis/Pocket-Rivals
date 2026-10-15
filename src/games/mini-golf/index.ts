import type { MatchOptions } from "../../shared/contracts/GameModule";
import { UltimateGolfGame } from "./ultimate/UltimateGolfGame";
export default (options?: MatchOptions) => new UltimateGolfGame(options);

