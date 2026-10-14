import {buildMs91RepaintPlan} from './ms91-repaint-plan.ts';
import {ms91RolledSkyRegion} from './ms91-sky-region.ts';
import type {Ms91Rectangle} from './ms91-rectangle-list.ts';
/** Original rolled sky preparation: force the old/new sky dirty flag, clear
 * changed regions outside its band, then draw clipped horizon strips inside.
 * Empty lists do not trigger final-presentation fallback copying. */
export function buildMs91RolledBackgroundPlan(previous:readonly Ms91Rectangle[],working:readonly Ms91Rectangle[],clip:Ms91Rectangle,base:number,delta:number,maximumHeight:number,fullRedraw:boolean,alignment=1,mask=-alignment){
 if(previous.length!==15||working.length!==15)throw Error('Rolled sky requires fifteen region records');
 const sky=ms91RolledSkyRegion(base,delta,maximumHeight,clip,fullRedraw),current=working.map(rect=>[...rect] as Ms91Rectangle);current[5]=sky;
 const flags=Array(15).fill(1);flags[5]=3;
 const clear=(top:number,bottom:number)=>{
  top=Math.max(top,clip[2]);bottom=Math.min(bottom,clip[3]);if(top>=bottom)return [];
  return buildMs91RepaintPlan(flags,previous,current,[clip[0],clip[1],top,bottom],alignment,mask).rectangles;
 };
 const band:Ms91Rectangle=[Math.max(0,clip[0]),Math.min(320,clip[1]),Math.max(sky[2],clip[2]),Math.min(sky[3],clip[3])];
 return {sky,clearSky:fullRedraw?[]:clear(0,sky[2]),clearGround:fullRedraw?[]:clear(sky[3],200),panorama:band[0]<band[1]&&band[2]<band[3]?band:null};
}
