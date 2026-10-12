import type {GameMetadata} from '../shared/contracts/GameModule';
const configs=import.meta.glob<{default:GameMetadata}>('../games/*/config.ts',{eager:true});
const entries=Object.entries(configs).map(([path,m])=>({path:path.replace('/config.ts','/index.ts'),metadata:m.default}));
export const games=entries.map(e=>e.metadata).sort((a,b)=>a.order-b.order);
const ids=new Set<string>();
for(const game of games){if(!/^[a-z0-9-]+$/.test(game.id)||ids.has(game.id))throw Error(`Invalid/duplicate game ID: ${game.id}`);ids.add(game.id);}
export function getGame(id:string){const game=games.find(g=>g.id===id);if(!game)throw Error(`Unknown game: ${id}`);return game;}
export function modulePath(id:string){const entry=entries.find(e=>e.metadata.id===id);if(!entry)throw Error(`Unknown game: ${id}`);return entry.path;}
