import {i16} from '../physics/math.ts';
export interface PolygonOrderState {
 links:number[];depths:number[];count:number;regionCount:number;head:number;cursor:number;tail:number;nextByte:number;
}
/** Supplied executable 17A24..17AE1. Attached polygons bypass depth search
 * and remain after the previous polygon. Equal depths retain insertion order.
 * Mutates the caller-owned frame list, including the original capacity result.
 */
export function insertOriginalPolygon(state:PolygonOrderState,depth:number,sort:boolean,vertices:number){
 let next:number;
 if(!sort)next=state.links[state.cursor];
 else {
  state.cursor=state.head;next=state.links[state.head];let remaining=state.regionCount;
  while(next>=0){
   const old=remaining;remaining=i16(remaining-1);
   if(old===0||i16(state.depths[next])<i16(depth))break;
   state.cursor=next;next=state.links[next];
  }
 }
 state.depths[state.count]=i16(depth);state.links[state.count]=next;state.links[state.cursor]=state.count;
 state.regionCount=(state.regionCount+1)&65535;
 if(next<0)state.tail=state.count;
 state.cursor=state.links[state.cursor];state.count=(state.count+1)&65535;
 state.nextByte=(state.nextByte+(vertices&255)*4+6)&65535;
 return state.count===400||i16(state.nextByte)>0x2872;
}
/** Original 179A6..179F1 selection of the depth-search argument. */
export function originalPolygonNeedsDepthSort(shapeFlags:number,primitiveFlags:number){
 return !(shapeFlags&1)&&!(primitiveFlags&2);
}
