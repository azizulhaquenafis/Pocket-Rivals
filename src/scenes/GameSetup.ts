import type {GameMetadata,MatchOptions} from '../shared/contracts/GameModule';
import {defaultOptions} from '../shared/contracts/GameModule';
import {loadTutorial} from '../core/GameLoader';
import type {Modal} from '../shared/components/Modal';
export const difficultyButtons=(selected:string)=>`<div class="choice-label">AI DIFFICULTY</div><div class="segmented difficulty" role="radiogroup" aria-label="AI difficulty">${['medium','hard','impossible'].map(d=>`<button role="radio" aria-checked="${selected===d}" class="${selected===d?'selected':''}" data-action="difficulty-${d}">${d[0].toUpperCase()+d.slice(1)}</button>`).join('')}</div>`;
export class GameSetup {
 constructor(private modal:Modal,private launch:(options:MatchOptions)=>void){}
 open(meta:GameMetadata,options:MatchOptions=defaultOptions()){
  const current={...options,variant:options.variant??meta.variants?.[0]?.id};
  const render=()=>{
   const variant=meta.variants?.find(v=>v.id===current.variant),ai=meta.supportedModes.includes('single-player')&&variant?.ai!==false;
   if(!ai)current.mode='local';
   const actions:Record<string,()=>void>={close:()=>this.modal.close(),local:()=>{current.mode='local';render();},ai:()=>{if(ai){current.mode='ai';render();}},start:()=>this.launch({...current}),help:()=>void loadTutorial(meta.id,current.variant!,{show:(html,actions)=>this.modal.show(html,actions,'',render),done:render})};
   for(const d of ['medium','hard','impossible'] as const)actions[`difficulty-${d}`]=()=>{current.difficulty=d;render();};
   for(const v of meta.variants??[])actions[`variant-${v.id}`]=()=>{current.variant=v.id;render();};
   this.modal.show(`<div class="eyebrow">PICK YOUR RIVAL</div><h2 id="dialog-title">${meta.name}</h2>${meta.variants?`<div class="variant-choices">${meta.variants.map(v=>`<button data-action="variant-${v.id}" class="variant-choice ${current.variant===v.id?'selected':''}" aria-pressed="${current.variant===v.id}"><b>${v.name}</b><small>${v.description}</small></button>`).join('')}</div>`:''}<div class="segmented players" role="radiogroup" aria-label="Player mode"><button data-action="ai" role="radio" aria-checked="${current.mode==='ai'}" ${ai?'':'disabled'} class="${current.mode==='ai'?'selected':''}">1 Player<small>vs AI${ai?'':' unavailable'}</small></button><button data-action="local" role="radio" aria-checked="${current.mode==='local'}" class="${current.mode==='local'?'selected':''}">2 Players<small>on this phone</small></button></div>${current.mode==='ai'?difficultyButtons(current.difficulty):''}<p class="setup-note">${current.mode==='ai'?'You are orange. Blue is your opponent.':'Orange below. Blue across the phone.'}${current.mode==='ai'&&current.difficulty==='impossible'?' Strongest available play; no unfair movement.':''}</p><button class="primary-button" data-action="start">Let’s play →</button>${variant?.hasTutorial?'<button class="text-button" data-action="help">How to play Ultimate</button>':''}<button class="text-button" data-action="close">Back</button>`,actions,'setup-modal');
  };render();
 }
}
