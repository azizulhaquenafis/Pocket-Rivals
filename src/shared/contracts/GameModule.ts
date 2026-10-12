import type Phaser from 'phaser';
import type {AudioManager} from '../../core/AudioManager';
import type {InputManager} from '../../core/InputManager';
import type {Difficulty} from './AIController';
export type {Player,Winner,GameResult} from './GameResult';
import type {GameResult} from './GameResult';
export interface MatchOptions {mode:'local'|'ai';difficulty:Difficulty;variant?:string}
export interface MatchSpec {gameId:string;options:MatchOptions}
export interface GameVariant {id:string;name:string;description:string;hasTutorial?:boolean;ai?:boolean}
export interface GameMetadata {
 id:string;name:string;description:string;instructions:string;color:string;accent:string;preview:string;order:number;tag:string;
 supportedModes:readonly ('local-two-player'|'single-player')[];
 variants?:readonly GameVariant[];
}
export interface GameContext {
 scene:Phaser.Scene;input:InputManager;audio:AudioManager;options:MatchOptions;restoredState?:unknown;
 saveState:(state:unknown)=>void;setScore:(one:number,two:number)=>void;setHint:(text:string)=>void;finish:(result:GameResult)=>void;
}
export interface MiniGame {initialize(context:GameContext):void;update(deltaSeconds:number):void;pause():void;resume():void;dispose():void;snapshot?():unknown}
export type GameFactory=(options:MatchOptions)=>MiniGame|Promise<MiniGame>;
export interface TutorialUI {show(content:string,actions:Record<string,()=>void>):void;done():void}
export interface GameExports {default:GameFactory;tutorial?:(variant:string,ui:TutorialUI)=>void|Promise<void>}
export const defaultOptions=():MatchOptions=>({mode:'local',difficulty:'medium'});
