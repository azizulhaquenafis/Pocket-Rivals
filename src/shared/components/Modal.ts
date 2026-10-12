export class Modal {
 private root=document.querySelector<HTMLElement>('#overlays')!;private previous:HTMLElement|null=null;private backAction?:()=>void;
 get isOpen(){return this.root.childElementCount>0;}
 show(content:string,actions:Record<string,()=>void>,className='',back?:()=>void){
  if(!this.isOpen)this.previous=document.activeElement as HTMLElement;this.backAction=back;
  document.querySelector<HTMLElement>('#menu')!.inert=true;document.querySelector<HTMLElement>('#game-stage')!.inert=true;
  this.root.innerHTML=`<div class="modal-backdrop"><section class="modal ${className}" role="dialog" aria-modal="true" aria-labelledby="dialog-title">${content}</section></div>`;
  this.root.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(b=>b.onclick=()=>actions[b.dataset.action!]?.());
  this.root.querySelector<HTMLButtonElement>('button')?.focus({preventScroll:true});return this.root;
 }
 back(){if(this.backAction)this.backAction();else this.close();}
 close(){this.root.replaceChildren();this.backAction=undefined;document.querySelector<HTMLElement>('#menu')!.inert=false;document.querySelector<HTMLElement>('#game-stage')!.inert=false;if(this.previous?.isConnected)this.previous.focus({preventScroll:true});this.previous=null;}
 trapFocus(e:KeyboardEvent){if(e.key!=='Tab'||!this.isOpen)return;const list=Array.from(this.root.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input,select'));const first=list[0],last=list.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
}
