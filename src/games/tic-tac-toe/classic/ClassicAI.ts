import type {Difficulty} from '../../../shared/contracts/AIController';
import type {Player} from '../../../shared/contracts/GameResult';
import {WIN_LINES} from '../shared/lines';
import type {TicTacToeBoard} from './ClassicRules';
const ORDER=[4,0,2,6,8,1,3,5,7];
/** Full minimax for Impossible; alpha-beta bounds keep this nine-cell search tiny. */
export function classicMove(board:TicTacToeBoard,difficulty:Difficulty,random=Math.random):number{
 const cells=[...board.cells],player=board.turn;const legal=ORDER.filter(i=>!cells[i]);if(board.winner||!legal.length)return -1;
 if(difficulty==='medium'&&random()<.32)return legal[Math.floor(random()*legal.length)];
 const limit=difficulty==='impossible'?9:difficulty==='hard'?5:2;
 function search(turn:Player,depth:number,alpha:number,beta:number):number{
  for(const line of WIN_LINES){const p=cells[line[0]];if(p&&line.every(i=>cells[i]===p))return p===player?100+depth:-100-depth;}
  if(cells.every(Boolean))return 0;
  if(depth===0){let score=0;for(const line of WIN_LINES){const own=line.filter(i=>cells[i]===player).length,other=line.filter(i=>cells[i]&&cells[i]!==player).length;if(!other)score+=own*own;if(!own)score-=other*other;}return score;}
  let value=turn===player?-Infinity:Infinity;
  for(const i of ORDER){if(cells[i])continue;cells[i]=turn;const score=search(turn===1?2:1,depth-1,alpha,beta);cells[i]=null;
   if(turn===player){value=Math.max(value,score);alpha=Math.max(alpha,value);}else{value=Math.min(value,score);beta=Math.min(beta,value);}if(beta<=alpha)break;
  }return value;
 }
 let best=-Infinity,move=legal[0];for(const i of legal){cells[i]=player;const score=search(player===1?2:1,limit-1,-Infinity,Infinity);cells[i]=null;if(score>best){best=score;move=i;}}
 return move;
}
