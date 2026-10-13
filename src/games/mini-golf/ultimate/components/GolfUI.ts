import './golf.css';
import type {Rect} from '../courses';
export class GolfUI {
 readonly root=document.createElement('div');readonly field:HTMLDivElement;private heading:HTMLElement;private stat:HTMLElement;private footer:HTMLElement;private toast:HTMLElement;private power:HTMLElement;private opponent:HTMLElement;
 constructor(action:(name:string)=>void){this.root.className='golf-ui';this.root.innerHTML=`<header class="golf-header"><button class="golf-icon-button" data-action="back" aria-label="Golf back">‹</button><div class="golf-heading"><strong>Ultimate Golf</strong><small></small></div><button class="golf-icon-button" data-action="help" aria-label="Golf help">?</button><button class="golf-icon-button" data-action="pause" aria-label="Pause golf">Ⅱ</button></header><div class="golf-field"></div><footer class="golf-footer"></footer>`;this.field=this.root.querySelector('.golf-field')!;this.heading=this.root.querySelector('strong')!;this.stat=this.root.querySelector('small')!;this.footer=this.root.querySelector('footer')!;this.toast=document.createElement('div');this.toast.className='golf-toast';this.power=document.createElement('div');this.power.className='golf-power';this.power.innerHTML='<i></i>';this.opponent=document.createElement('div');this.opponent.className='golf-opponent';this.root.addEventListener('click',e=>{const button=(e.target as HTMLElement).closest<HTMLButtonElement>('[data-action]');if(button&&!button.disabled)action(button.dataset.action!);});document.querySelector('#game-stage')!.append(this.root);}
 title(title:string,stat=''){this.heading.textContent=title;this.stat.textContent=stat;this.stat.hidden=!stat;}
 screen(html:string){this.field.innerHTML=`<section class="golf-panel">${html}</section>`;this.footer.innerHTML='';}
 playing(competitive=false){this.field.replaceChildren(this.toast,this.power,this.opponent);this.toast.hidden=this.power.hidden=this.opponent.hidden=true;this.footer.innerHTML=`<button data-action="courses">Courses</button><button data-action="focus">Focus</button><button data-action="retry">${competitive?'Forfeit':'Retry'}</button>`;}
 focus(active:boolean){const b=this.footer.querySelector('[data-action=focus]');if(b){b.textContent=active?'Full course':'Focus';b.setAttribute('aria-pressed',String(active));}}
 message(text:string){this.toast.textContent=text;this.toast.hidden=!text;}
 meter(power:number|null){this.power.hidden=power===null;if(power!==null)(this.power.firstElementChild as HTMLElement).style.width=`${power*100}%`;}
 rival(text:string){this.opponent.textContent=text;this.opponent.hidden=!text;}
 help(text:string,closeLabel='Back to play'){const panel=document.createElement('section');panel.className='golf-panel help';panel.innerHTML=`<h2>How to play</h2><p>${text}</p><p>Pull back anywhere on the course, then release. Use Focus for a closer view.</p><button data-action="close-help">${closeLabel}</button>`;this.field.append(panel);}
 closeHelp(){this.field.querySelector('.help')?.remove();}
 bounds():Rect{const r=this.field.getBoundingClientRect(),parent=this.root.parentElement!.getBoundingClientRect();return {x:r.x-parent.x+2,y:r.y-parent.y+2,w:Math.max(1,r.width-4),h:Math.max(1,r.height-4)};}
 pause(paused:boolean){this.root.setAttribute('aria-hidden',String(paused));this.root.inert=paused;}
 dispose(){this.root.remove();}
}
