import {sortOriginalModelQueue} from './model-queue-order.ts';
export interface ModelQueueVisibility {palette:number;player:number;opponent:number}
/** Supplied DB72..DC33. The transform result is a signed byte: positive stops
 * the frame, zero marks eligible cars visible, negative continues without it.
 */
export function drainOriginalModelQueue(depths:readonly number[],indices:readonly number[],tags:readonly number[],damage:readonly number[],carStatus:readonly number[],before:ModelQueueVisibility,draw:(index:number,palette:number)=>number){
 return drainOriginalSortedModelQueue(sortOriginalModelQueue(depths,indices),tags,damage,carStatus,before,draw);
}
export function drainOriginalSortedModelQueue(sorted:{depths:number[];indices:number[]},tags:readonly number[],damage:readonly number[],carStatus:readonly number[],before:ModelQueueVisibility,draw:(index:number,palette:number)=>number){
 const state={...before};
 let stopped=false,drawn=0;
 for(const index of sorted.indices){
  const tag=tags[index]&255;
  if(tag===2||tag===3)state.palette=damage[tag-2]?0x2f:0x2e;
  const result=draw(index,state.palette)<<24>>24;drawn++;
  if(result>0){stopped=true;break;}
  if(result===0){
   if(tag===2&&carStatus[0]===1)state.player=1;
   if(tag===3&&carStatus[1]===1)state.opponent=1;
  }
 }
 return {...sorted,...state,stopped,drawn};
}
