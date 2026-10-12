import {UltimateBoard} from './UltimateRules';
import {ultimateMove} from './UltimateSearch';
self.onmessage=({data})=>{const board=UltimateBoard.restore(data.state);self.postMessage({id:data.id,...ultimateMove(board,data.difficulty)});};
