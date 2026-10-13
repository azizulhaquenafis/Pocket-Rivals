import {courses} from '../courses';
import {GolfPhysics} from '../GolfPhysics';
import {GolfProgress} from '../GolfProgress';
import type {GolfDifficulty} from '../GolfRules';
export class CasualMode {
 readonly progress=new GolfProgress();world?:GolfPhysics;course=0;difficulty:GolfDifficulty=1;
 start(index:number){this.course=index;this.world=new GolfPhysics(courses[index],this.difficulty);return this.world;}
 update(dt:number){this.world?.advance(dt);}
 record(){if(this.world?.status==='won')this.progress.record(this.course,this.world.score);}
}
