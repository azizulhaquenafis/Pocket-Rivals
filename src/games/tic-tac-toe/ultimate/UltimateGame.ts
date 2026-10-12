import Phaser from 'phaser';
import type {GameContext,MiniGame} from '../../../shared/contracts/GameModule';
import {theme} from '../../../core/ThemeManager';
import {rounded,symbol,label} from '../../../shared/components/drawing';
import {UltimateBoard} from './UltimateRules';
import {UltimateAI} from './UltimateAI';
export class UltimateGame implements MiniGame {
 private ctx!:GameContext;private board=new UltimateBoard();private g!:Phaser.GameObjects.Graphics;private bg!:Phaser.GameObjects.Graphics;private turn!:Phaser.GameObjects.Text;private route!:Phaser.GameObjects.Text;private focusLabel!:Phaser.GameObjects.Text;private zone!:Phaser.GameObjects.Zone;
 private ai?:UltimateAI;private ages=Array(81).fill(0);private paused=false;private pending=false;private disposed=false;private generation=0;private thinking=0;private elapsed=0;private endAge=0;private reported=false;private focused=false;
 initialize(ctx:GameContext){
  this.ctx=ctx;this.board=UltimateBoard.restore(ctx.restoredState);this.ages=this.board.cells.map(c=>c?1:0);
  if(ctx.options.mode==='ai')this.ai=new UltimateAI(ctx.options.difficulty);
  ctx.setScore(0,0);ctx.setHint('WIN THREE SMALL BOARDS IN A ROW');
  this.bg=ctx.scene.add.graphics();rounded(this.bg,24,112,372,538,20,theme.peach,4);
  this.turn=label(ctx.scene,210,152,'',21);this.route=label(ctx.scene,210,185,'',12);this.g=ctx.scene.add.graphics();
  this.focusLabel=label(ctx.scene,210,610,'',13);
  this.zone=ctx.scene.add.zone(210,610,220,44).setInteractive({useHandCursor:true}).on('pointerup',()=>{if(this.board.forced!==null){this.focused=!this.focused;ctx.audio.play('tap');}});
  ctx.input.tap((x,y)=>{if(this.paused||this.elapsed<.2||this.board.winner||(this.ai&&this.board.turn===2)||y<214||y>=568||x<33||x>=387)return;
   if(this.focused&&this.board.forced!==null){const cell=Math.floor((y-214)/118)*3+Math.floor((x-33)/118);this.place(this.board.forced*9+cell);return;}
   const bx=Math.floor((x-33)/120),by=Math.floor((y-214)/120),lx=x-33-bx*120,ly=y-214-by*120;if(bx>2||by>2||lx>=114||ly>=114)return;
   this.place((by*3+bx)*9+Math.floor(ly/38)*3+Math.floor(lx/38));
  });
 }
 private place(move:number){if(!this.board.play(move))return;this.ages[move]=.001;this.thinking=0;this.ctx.audio.play('tap');this.ctx.saveState(this.board.save());if(this.board.forced===null)this.focused=false;}
 update(dt:number){if(this.paused||this.disposed)return;this.elapsed+=dt;
  if(this.ai&&this.board.turn===2&&!this.board.winner&&!this.pending){this.thinking+=dt;if(this.thinking>.32){this.pending=true;const generation=this.generation;void this.ai.choose(this.board).then(move=>{if(this.disposed||generation!==this.generation)return;this.pending=false;if(!this.paused)this.place(move);});}}
  this.turn.setText(this.board.winner?(this.board.winner==='draw'?'A GRAND STANDOFF.':'THE BIG PICTURE.'):this.board.turn===1?'ORANGE’S TURN  ×':this.ai?'BLUE IS THINKING…':'BLUE’S TURN  ○');
  this.route.setText(this.board.winner?'':this.board.forced===null?'YOUR CHOICE · ANY OPEN BOARD':`PLAY THE HIGHLIGHTED BOARD · ${this.board.forced+1}`);
  this.focusLabel.setText(this.board.winner?'':this.board.forced===null?'YOUR MOVE SETS THEIR NEXT BOARD':this.focused?'↗  SHOW ALL BOARDS':'⊕  FOCUS BOARD');
  this.ages=this.ages.map((age,i)=>this.board.cells[i]?age+dt:0);this.g.clear();
  const focus=this.focused&&this.board.forced!==null&&!this.board.winner?this.board.forced:null;
  if(focus!==null)this.drawBoard(focus,33,214,354,true);else for(let b=0;b<9;b++)this.drawBoard(b,33+b%3*120,214+Math.floor(b/3)*120,114,this.board.forced===null||this.board.forced===b);
  if(this.board.winner){this.endAge+=dt;if(this.board.line){const [a,,b]=this.board.line,t=Math.min(1,this.endAge/.45);const x=90+a%3*120,y=271+Math.floor(a/3)*120;this.g.lineStyle(7,theme.ink,.8).lineBetween(x,y,x+(b%3-a%3)*120*t,y+(Math.floor(b/3)-Math.floor(a/3))*120*t);}
   if(this.endAge>.85&&!this.reported){this.reported=true;const w=this.board.winner;this.ctx.finish({winner:w,scores:w===1?[1,0]:w===2?[0,1]:[0,0]});}}
 }
 private drawBoard(b:number,x:number,y:number,size:number,active:boolean){
  const g=this.g,status=this.board.boards[b],cell=size/3;
  rounded(g,x,y,size,size,8,active&&!status?theme.white:0xe4baa9,active&&!status?3:1.5);
  if(active&&!status){g.lineStyle(2,this.board.turn===1?theme.orange:theme.blue).strokeRoundedRect(x+3,y+3,size-6,size-6,6);}
  g.lineStyle(size>114?3:1,theme.ink,active?.4:.15);
  for(let k=1;k<3;k++){g.lineBetween(x+k*cell,y+7,x+k*cell,y+size-7);g.lineBetween(x+7,y+k*cell,x+size-7,y+k*cell);}
  if(status){if(status==='draw'){g.lineStyle(5,theme.muted).lineBetween(x+size*.3,y+size*.44,x+size*.7,y+size*.44).lineBetween(x+size*.3,y+size*.56,x+size*.7,y+size*.56);}else symbol(g,x+size/2,y+size/2,status,22,size/90);return;}
  for(let c=0;c<9;c++){const mark=this.board.cells[b*9+c];if(!mark)continue;const t=Math.min(1,this.ages[b*9+c]/.2),pop=1+2.7*(t-1)**3+1.7*(t-1)**2;symbol(g,x+(c%3+.5)*cell,y+(Math.floor(c/3)+.5)*cell,mark,22,cell/70*Math.max(.01,pop));}
 }
 pause(){this.paused=true;this.generation++;this.pending=false;this.ai?.cancel();}resume(){this.paused=false;this.thinking=0;}
 dispose(){this.disposed=true;this.generation++;this.ai?.dispose();this.g.destroy();this.bg.destroy();this.turn.destroy();this.route.destroy();this.focusLabel.destroy();this.zone.destroy();}
 snapshot(){return {cells:[...this.board.cells],boards:[...this.board.boards],turn:this.board.turn,forced:this.board.forced,winner:this.board.winner,pending:this.pending,focused:this.focused,moves:this.board.history.length};}
}
