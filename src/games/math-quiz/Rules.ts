import {FirstResponse} from '../../shared/rules/FirstResponse';import type {MathQuestion} from './questions/Question';
export class QuizMatch {scores:[number,number]=[0,0];question!:MathQuestion;phase:'show'|'active'|'between'|'done'='show';time=0;visibleAt=0;round=0;winner:1|2|null=null;message='CHOOSE ONE';private until=0;private queue=new FirstResponse<boolean>();
 constructor(private next:()=>MathQuestion){this.question=next();}
 present(){if(this.phase==='show'){this.phase='active';this.visibleAt=this.time;}}
 answer(p:0|1,index:number){if(this.phase==='active'&&Number.isInteger(index)&&index>=0&&index<3)this.queue.add(p,index===this.question.correctIndex,this.time);}
 update(dt:number){this.time+=dt;if(this.phase==='done')return;const result=this.queue.resolve(this.time);if(result){if(result.tie)this.message='SAME INSTANT · NEXT QUESTION';else{const p=result.first.value?result.first.player:(1-result.first.player) as 0|1;this.scores[p]++;this.message=result.first.value?'CORRECT!':'RIVAL GETS THE POINT';if(this.scores[p]===10){this.winner=p===0?1:2;this.phase='done';this.round++;return;}}this.phase='between';this.round++;this.until=this.time+1.4;return;}if(this.phase==='between'&&this.time>=this.until){this.question=this.next();this.phase='show';this.message='CHOOSE ONE';}}
}
