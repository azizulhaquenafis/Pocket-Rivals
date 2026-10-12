import type {MatchOptions,TutorialUI} from '../../shared/contracts/GameModule';
export default async(options:MatchOptions)=> options.variant==='ultimate'?new (await import('./ultimate/UltimateGame')).UltimateGame():new (await import('./classic/ClassicGame')).TicTacToe();
export async function tutorial(variant:string,ui:TutorialUI){if(variant==='ultimate')(await import('./ultimate/UltimateTutorial')).ultimateTutorial(ui);}
