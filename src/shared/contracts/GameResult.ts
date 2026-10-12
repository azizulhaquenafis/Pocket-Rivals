export type Player=1|2;
export type Winner=Player|'draw';
export interface GameResult {winner:Winner;scores:readonly [number,number]}
