import type {Difficulty} from '../../../shared/contracts/AIController';
import type {UltimateBoard} from './UltimateRules';
export class UltimateAI {
 private worker?:Worker;private resolve?: (move:number)=>void;private sequence=0;
 constructor(private difficulty:Difficulty){}
 choose(board:UltimateBoard):Promise<number>{
  this.cancel();const id=++this.sequence;this.worker=new Worker(new URL('./ai.worker.ts',import.meta.url),{type:'module'});
  return new Promise(resolve=>{this.resolve=resolve;this.worker!.onmessage=({data})=>{if(data.id!==id)return;const done=this.resolve;this.resolve=undefined;this.worker?.terminate();this.worker=undefined;done?.(data.move);};this.worker!.onerror=()=>{const legal=board.legalMoves();this.cancel(legal[0]??-1);};this.worker!.postMessage({id,state:board.save(),difficulty:this.difficulty});});
 }
 cancel(fallback=-1){this.sequence++;this.worker?.terminate();this.worker=undefined;const done=this.resolve;this.resolve=undefined;done?.(fallback);}
 dispose(){this.cancel();}
}
