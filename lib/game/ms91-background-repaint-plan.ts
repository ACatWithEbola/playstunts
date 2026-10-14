import {buildMs91RepaintPlan} from './ms91-repaint-plan.ts';
import type {Ms91Rectangle} from './ms91-rectangle-list.ts';
/** Forward-sky drawing clears old object regions, plus old/new sky bounds when
 * its heading or bounds changed. Empty output has no presentation fallback:
 * the retained background is already correct and must not be repainted. */
export function buildMs91BackgroundRepaintPlan(previous:readonly Ms91Rectangle[],working:readonly Ms91Rectangle[],clip:Ms91Rectangle,previousHeading:number|undefined,heading:number,fullRedraw:boolean,alignment=1,mask=-alignment,detail=0,lastRenderedHeading=previousHeading){
 if(previous.length!==15||working.length!==15)throw Error('Sky repaint requires fifteen region records');
 if(fullRedraw)return [[0,320,clip[2],clip[3]] as Ms91Rectangle];
 const flags=Array(15).fill(1);
 const retainedHeading=detail===4?lastRenderedHeading:previousHeading;
 flags[5]=retainedHeading===heading&&previous[5].every((word,i)=>word===working[5][i])?0:3;
 return buildMs91RepaintPlan(flags,previous,working,clip,alignment,mask).rectangles;
}
