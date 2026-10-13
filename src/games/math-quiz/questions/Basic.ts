import {shuffleAnswers,type MathQuestion} from './Question';
export function basicQuestion(serial:number,random=Math.random):MathQuestion {const a=2+Math.floor(random()*18),b=2+Math.floor(random()*10),op=Math.floor(random()*4);let answer:number,question:string;
 if(op===0){answer=a+b;question=`${a}+${b}=?`;}else if(op===1){answer=a-b;question=`${a}-${b}=?`;}else if(op===2){answer=a*b;question=String.raw`${a}\times${b}=?`;}else{answer=a;question=String.raw`\frac{${a*b}}{${b}}=?`;}
 const q:MathQuestion={id:`basic-${serial}-${a}-${b}-${op}`,topic:'Arithmetic',difficulty:'easy',questionLatex:question,optionsLatex:[String(answer),String(answer+1),String(answer-2)],correctIndex:0,explanationLatex:question.replace('=?',`=${answer}`),estimatedSeconds:7};return shuffleAnswers(q,random);}
