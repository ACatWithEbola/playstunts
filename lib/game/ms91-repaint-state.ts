import {buildMs91RepaintPlan} from './ms91-repaint-plan.ts';
import type {Ms91Rectangle} from './ms91-rectangle-list.ts';
/** Renderer-owned bridge. No original MS91 addresses are written into a
 * legacy-layout display graph. Commit happens only after successful copying. */
export function createMs91RepaintState(full:Ms91Rectangle,empty:Ms91Rectangle){
 let retained:Ms91Rectangle[]=[],identity:number|undefined;
 const reset=()=>{retained=Array.from({length:15},(_,i)=>[...(i===0?full:empty)] as Ms91Rectangle);identity=undefined;};reset();
 return {reset,previous(){return {regions:retained.map(rect=>[...rect] as Ms91Rectangle),heading:identity};},prepare(current:readonly Ms91Rectangle[],clip:Ms91Rectangle,renderIdentity:number,options:{enabled:boolean;fullRedraw:boolean;pageFlipping:boolean;detail:number;alignment?:number;mask?:number}){
  if(current.length!==15)throw Error('MS91 requires fifteen dirty regions');
  const snapshot=current.map(rect=>[...rect] as Ms91Rectangle),previous=retained.map(rect=>[...rect] as Ms91Rectangle);
  const flags=Array(15).fill(3);
  if((options.detail===4||identity===renderIdentity)&&snapshot[5].every((word,i)=>word===previous[5][i]))flags[5]=0;
  const alignment=options.alignment??1,plan=buildMs91RepaintPlan(flags,snapshot,previous,clip,alignment,options.mask??-alignment);
  const presentation=options.pageFlipping?[]:options.fullRedraw?[[...full] as Ms91Rectangle]:options.enabled?plan.presentation:[[...clip] as Ms91Rectangle];
  let committed=false;
  const beginBeforeBounds=options.enabled&&!options.fullRedraw&&!options.pageFlipping&&plan.rectangles.length>0;
  return {presentation,flags,beginBeforeBounds,commit(){
   if(committed)throw Error('Repaint plan already committed');committed=true;
   // Original page flipping returns before retaining these copy-path regions.
   if(options.enabled&&!options.pageFlipping){retained=snapshot;identity=renderIdentity;}
  }};
 }};
}
