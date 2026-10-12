import Phaser from 'phaser';
import {App} from '@capacitor/app';
import {Capacitor} from '@capacitor/core';
import {SplashScreen} from '@capacitor/splash-screen';
import {StorageManager} from './StorageManager';
import {ScoreManager} from './ScoreManager';
import {AudioManager} from './AudioManager';
import {TournamentManager} from './TournamentManager';
import {GameHost} from '../scenes/GameHost';
import {MainMenu} from '../scenes/MainMenu';
import {Settings} from '../scenes/Settings';
import {GameSetup} from '../scenes/GameSetup';
import {TournamentScene} from '../tournament/TournamentScene';
import {Modal} from '../shared/components/Modal';
import {resultsContent} from '../scenes/Results';
import {getGame} from './GameRegistry';
import {defaultOptions,type MatchOptions,type MatchSpec,type GameResult} from '../shared/contracts/GameModule';
const MATCH_KEY='pocket-rivals.match.v1';
export class GameManager {
 readonly storage:StorageManager;readonly scores:ScoreManager;readonly audio:AudioManager;readonly tournament:TournamentManager;
 readonly modal=new Modal();readonly renderScale=Math.min(window.devicePixelRatio||1,2);readonly host:GameHost;readonly game:Phaser.Game;
 private menu:MainMenu;private tournamentView:TournamentScene;private active:MatchSpec|null=null;private token:string|null=null;private run=0;
 private state:'menu'|'playing'|'paused'|'results'|'loading'='menu';private menuRoot=document.querySelector<HTMLElement>('#menu')!;private disposers:(()=>void)[]=[];
 constructor(){
  let storage:Storage|undefined;try{storage=localStorage;}catch{}this.storage=new StorageManager(storage);this.scores=new ScoreManager(this.storage);this.audio=new AudioManager(this.storage);this.tournament=new TournamentManager(this.storage);this.tournamentView=new TournamentScene(this);this.host=new GameHost(this);
  this.game=new Phaser.Game({type:Phaser.AUTO,parent:'game-stage',width:420*this.renderScale,height:760*this.renderScale,backgroundColor:'#f8f5eb',antialias:true,roundPixels:false,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH,expandParent:false,resizeInterval:50},input:{activePointers:4},fps:{target:60,smoothStep:true},render:{powerPreference:'high-performance'},callbacks:{postBoot:game=>{game.scene.add('GameHost',this.host,false);if(this.state==='menu')game.loop.sleep();}}});
  const resize=new ResizeObserver(()=>{if(this.game.isBooted){this.game.scale.getParentBounds();this.game.scale.refresh();this.host.controls?.clear();}});resize.observe(document.querySelector('#game-stage')!);this.disposers.push(()=>resize.disconnect());
  this.menu=new MainMenu(this,this.menuRoot);this.menu.render();
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();this.back();}this.modal.trapFocus(e);};const visibility=()=>{if(document.hidden)this.background();};const blur=()=>this.background();
  window.addEventListener('keydown',key);document.addEventListener('visibilitychange',visibility);window.addEventListener('blur',blur);this.disposers.push(()=>window.removeEventListener('keydown',key),()=>document.removeEventListener('visibilitychange',visibility),()=>window.removeEventListener('blur',blur));if(Capacitor.isNativePlatform())void this.nativeLifecycle();
 }
 private async nativeLifecycle(){const back=await App.addListener('backButton',()=>{if(this.state==='menu'&&!this.modal.isOpen)this.modal.show('<h2 id="dialog-title">Calling it a day?</h2><p>Your progress is saved.</p><button class="primary-button" data-action="stay">Keep playing</button><button class="text-button" data-action="exit">Close Pocket Rivals</button>',{stay:()=>this.modal.close(),exit:()=>void App.exitApp()});else this.back();});const state=await App.addListener('appStateChange',({isActive})=>{if(!isActive)this.background();});this.disposers.push(()=>void back.remove(),()=>void state.remove());await SplashScreen.hide();}
 selectGame(id:string){this.audio.play('tap');new GameSetup(this.modal,options=>void this.play(id,options)).open(getGame(id));}
 async play(id:string,options:MatchOptions=defaultOptions(),restoredState?:unknown,token:string|null=null){
  const meta=getGame(id);if(options.mode==='ai'&&!meta.supportedModes.includes('single-player'))throw Error('AI is unavailable for this game');
  this.audio.play('tap');this.modal.close();this.active={gameId:id,options:structuredClone(options)};this.token=token;this.state='loading';this.scores.beginRound();this.run++;
  if(!token&&!restoredState)this.storage.writeRecord(MATCH_KEY,null);
  this.menuRoot.hidden=true;document.querySelector('#app')!.classList.add('in-game');this.game.loop.wake();this.game.scale.refresh();if(this.game.scene.isActive('GameHost'))this.game.scene.stop('GameHost');this.game.scene.start('GameHost',{id,options,restoredState,run:this.run});
 }
 onReady(){if(this.state==='loading'){this.state='playing';if(document.hidden)this.background();}}
 checkpoint(run:number,data:unknown){if(run!==this.run||!this.active)return;if(this.token)this.tournament.checkpoint(this.token,data);else this.storage.writeRecord(MATCH_KEY,{version:1,spec:this.active,state:data});}
 savedMatch(){const d=this.storage.readRecord(MATCH_KEY) as {version:number;spec:MatchSpec;state:unknown}|null;try{if(d?.version!==1||!d.spec||!['local','ai'].includes(d.spec.options.mode)||!['medium','hard','impossible'].includes(d.spec.options.difficulty))return null;getGame(d.spec.gameId);return d;}catch{return null;}}
 resumeSaved(){const d=this.savedMatch();if(d)void this.play(d.spec.gameId,d.spec.options,d.state);}
 finish(result:GameResult,run:number){
  if(run!==this.run||this.state==='results')return;if(this.token&&!this.tournament.finish(this.token,result))return;if(!this.scores.record(result.winner))return;
  if(!this.token)this.storage.writeRecord(MATCH_KEY,null);this.state='results';this.audio.play(result.winner==='draw'?'draw':'win');
  if(this.token){this.tournamentView.show();return;}
  this.modal.show(resultsContent(result,this.active!.options),{rematch:()=>void this.play(this.active!.gameId,this.active!.options),menu:()=>this.goMenu()},'result-modal',()=>this.goMenu());
 }
 pause(reason='pause'){
  if(this.state!=='playing'&&this.state!=='loading')return;this.host.pauseGame();this.state='paused';this.audio.play('tap');
  this.modal.show(`<div class="pause-symbol">Ⅱ</div><div class="eyebrow">TAKE YOUR TIME</div><h2 id="dialog-title">${reason==='leave'?'A little timeout?':'Rivalry on hold.'}</h2><p>${getGame(this.active!.gameId).instructions}</p><button class="primary-button" data-action="resume">Keep playing →</button><button class="secondary-button" data-action="restart">Start a fresh match</button><button class="text-button" data-action="menu">${this.token?'Save & return to menu':'Back to all games'}</button>`,{resume:()=>this.resume(),restart:()=>this.restart(),menu:()=>this.goMenu()},'',()=>this.resume());
 }
 private restart(){if(this.token){const round=this.tournament.restartRound();if(round)void this.play(round.spec.gameId,round.spec.options,undefined,round.token);}else if(this.active)void this.play(this.active.gameId,this.active.options);}
 private resume(){this.modal.close();this.audio.unlock();this.state='playing';this.host.resumeGame();}
 private background(){if(this.state==='playing'||this.state==='loading')this.pause();this.audio.suspend();this.host.controls?.clear();}
 back(){if(this.state==='playing'||this.state==='loading')this.pause('leave');else if(this.modal.isOpen)this.modal.back();else this.goMenu();}
 goMenu(){this.modal.close();this.game.scene.stop('GameHost');this.game.loop.sleep();this.active=null;this.token=null;this.state='menu';document.querySelector('#app')!.classList.remove('in-game');this.menuRoot.hidden=false;this.menu.render();}
 refreshMenu(){this.menu.render();}
 openTournament(){if(this.tournament.state)this.showTournament();else this.tournamentView.setup();}
 newTournament(){this.tournamentView.setup();}
 showTournament(){this.goMenu();this.tournamentView.show();}
 startTournamentRound(){const round=this.tournament.startRound();if(!round)return;try{getGame(round.spec.gameId);void this.play(round.spec.gameId,round.spec.options,round.checkpoint,round.token);}catch(error){this.showError(error);}}
 toggleSound(){this.storage.data.sound=!this.storage.data.sound;this.storage.save();this.audio.play('tap');}
 settings(){new Settings(this).show();}
 showError(error:unknown){console.error(error);this.host.pauseGame();this.modal.show('<h2 id="dialog-title">That game took a break.</h2><p>Return to the collection and try again.</p><button class="primary-button" data-action="menu">Back to games</button>',{menu:()=>this.goMenu()},'',()=>this.goMenu());}
 snapshot(){return {state:this.state,saved:structuredClone(this.storage.data),tournament:structuredClone(this.tournament.state),scene:this.host.snapshot()};}
 dispose(){this.disposers.forEach(fn=>fn());this.audio.dispose();this.game.destroy(true);}
}
