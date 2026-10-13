import type {MathQuestion} from './Question';import {shuffleAnswers,shuffled} from './Question';import data from './university.json';
export const university=data as MathQuestion[];
/** Round-robin topics with independent shuffled topic decks. No repeats before exhaustion. */
export function universityDeck(random=Math.random){const topics=shuffled([...new Set(university.map(q=>q.topic))],random),groups=topics.map(t=>shuffled(university.filter(q=>q.topic===t),random));const deck:MathQuestion[]=[];while(groups.some(g=>g.length))for(const g of groups){const q=g.pop();if(q)deck.push(shuffleAnswers(q,random));}return deck;}
