import type {TutorialUI} from '../../../shared/contracts/GameModule';
export function ultimateTutorial(ui:TutorialUI){
 let step=0,chosen=4,closed=false;
 const diagram=()=>`<svg viewBox="0 0 180 180" aria-label="Nine boards, highlighted destination">${Array.from({length:9},(_,i)=>`<rect x="${i%3*60+3}" y="${Math.floor(i/3)*60+3}" width="54" height="54" rx="8" fill="${closed?'#fffdf5':i===chosen?'#58addb':'#e5dfd2'}" stroke="#242b32" stroke-width="3"/>${i===chosen&&closed?`<text x="${i%3*60+30}" y="${Math.floor(i/3)*60+40}" text-anchor="middle" font-size="38" fill="#f49b58">×</text>`:''}`).join('')}</svg>`;
 function render(){
 const titles=['Nine little boards. One big game.','Your move sends them somewhere.','Closed board? Free choice.'];
 const details=['Win a small board with three in a row. Win the match by claiming three small boards in a row. Orange plays first, anywhere.','Try a square below. Its position selects the board your opponent must play in next.','Won and full boards are closed. If your move sends an opponent to a closed board, they choose any unresolved board. No legal moves and no global winner means a draw.'];
 const demo=step===1?`<div class="tutorial-route"><div class="tutorial-cells">${Array.from({length:9},(_,i)=>`<button aria-label="Try cell ${i+1}" data-action="cell${i}" class="${chosen===i?'selected':''}">${chosen===i?'×':''}</button>`).join('')}</div><span>→</span>${diagram()}</div>`:`<div class="tutorial-diagram">${diagram()}</div>`;
 const actions:Record<string,()=>void>={next:()=>{if(step===2)ui.done();else{step++;closed=step===2;render();}},back:()=>{step=Math.max(0,step-1);closed=false;render();},close:()=>ui.done()};for(let i=0;i<9;i++)actions[`cell${i}`]=()=>{chosen=i;render();};
 ui.show(`<div class="eyebrow">ULTIMATE · HOW TO PLAY · ${step+1}/3</div><h2 id="dialog-title">${titles[step]}</h2>${demo}<p>${details[step]}</p><button class="primary-button" data-action="next">${step===2?'Got it. Let’s play.':'Next'}</button>${step?'<button class="text-button" data-action="back">Previous</button>':'<button class="text-button" data-action="close">Back to setup</button>'}`,actions);
 }render();
}
