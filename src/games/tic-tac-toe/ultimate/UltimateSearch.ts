import {UltimateBoard} from './UltimateRules';
import {WIN_LINES} from '../shared/lines';
import type {Difficulty} from '../../../shared/contracts/AIController';
import type {Player} from '../../../shared/contracts/GameResult';
interface Entry{depth:number;value:number;flag:'exact'|'lower'|'upper'}
export interface SearchResult{move:number;depth:number;nodes:number}
export function evaluate(board:UltimateBoard,player:Player){
 if(board.winner)return board.winner==='draw'?0:board.winner===player?1000000:-1000000;
 const enemy=player===1?2:1;let score=0;
 for(const line of WIN_LINES){const own=line.filter(i=>board.boards[i]===player).length,other=line.filter(i=>board.boards[i]===enemy).length,closed=line.some(i=>board.boards[i]==='draw');if(!closed){if(!other)score+=[0,180,1900][own]??0;if(!own)score-=[0,180,1900][other]??0;}}
 for(let b=0;b<9;b++){
  if(board.boards[b]){if(board.boards[b]===player)score+=550;else if(board.boards[b]===enemy)score-=550;continue;}
  const weight=b===4?1.25:1;
  for(const line of WIN_LINES){const own=line.filter(i=>board.cells[b*9+i]===player).length,other=line.filter(i=>board.cells[b*9+i]===enemy).length;if(!other)score+=weight*([0,3,24][own]??0);if(!own)score-=weight*([0,3,24][other]??0);}
  if(board.cells[b*9+4]===player)score+=6;else if(board.cells[b*9+4]===enemy)score-=6;
 }
 return score;
}
/** Budgeted iterative deepening. This is strong practical play, not a solved-game claim. */
export function ultimateMove(board:UltimateBoard,difficulty:Difficulty,overrides:{budgetMs?:number;random?:()=>number}={}):SearchResult{
 const settings={medium:{ms:25,depth:2,nodes:5000},hard:{ms:100,depth:5,nodes:45000},impossible:{ms:280,depth:9,nodes:160000}}[difficulty];
 const random=overrides.random??Math.random,legal=board.legalMoves();if(!legal.length)return{move:-1,depth:0,nodes:0};
 const player=board.turn,deadline=performance.now()+(overrides.budgetMs??settings.ms),table=new Map<string,Entry>();let nodes=0,completeDepth=0,best=legal[0];
 const TIMEOUT=Symbol();
 function ordered(b:UltimateBoard){return b.legalMoves().map(move=>{const next=b.clone();next.play(move);return{move,next,value:evaluate(next,player)};}).sort((a,z)=>b.turn===player?z.value-a.value:a.value-z.value);}
 const roots=ordered(board);best=roots[0].move;
 if(difficulty==='medium'&&random()<.16){const candidates=roots.slice(0,Math.min(5,roots.length));return{move:candidates[Math.floor(random()*candidates.length)].move,depth:0,nodes:0};}
 function search(b:UltimateBoard,depth:number,alpha:number,beta:number):number{
  nodes++;if(nodes>settings.nodes||((nodes&31)===0&&performance.now()>=deadline))throw TIMEOUT;
  if(b.winner||depth===0)return evaluate(b,player);
  const key=b.key(),cached=table.get(key),originalAlpha=alpha,originalBeta=beta;
  if(cached&&cached.depth>=depth){if(cached.flag==='exact')return cached.value;if(cached.flag==='lower')alpha=Math.max(alpha,cached.value);else beta=Math.min(beta,cached.value);if(alpha>=beta)return cached.value;}
  let value=b.turn===player?-Infinity:Infinity;
  for(const node of ordered(b)){const candidate=search(node.next,depth-1,alpha,beta);if(b.turn===player){value=Math.max(value,candidate);alpha=Math.max(alpha,value);}else{value=Math.min(value,candidate);beta=Math.min(beta,value);}if(alpha>=beta)break;}
  if(table.size<16000)table.set(key,{depth,value,flag:value<=originalAlpha?'upper':value>=originalBeta?'lower':'exact'});return value;
 }
 for(let depth=1;depth<=settings.depth;depth++){
  let roundBest=best,value=-Infinity;try{for(const node of roots){if(performance.now()>=deadline)throw TIMEOUT;const score=search(node.next,depth-1,value,Infinity);if(score>value){value=score;roundBest=node.move;}}best=roundBest;completeDepth=depth;roots.sort((a,b)=>a.move===best?-1:b.move===best?1:0);if(value>=1000000)break;}catch(e){if(e!==TIMEOUT)throw e;break;}
 }
 return {move:best,depth:completeDepth,nodes};
}
