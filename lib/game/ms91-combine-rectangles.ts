import {combineOriginalRectangles} from './combine-rectangles.ts';
/** Original MS91 image1899a..18a13; same sequential union, new alignment globals. */
export function combineMs91Rectangles(memory:Uint8Array,d:number,first:number,second:number,destination:number){
 combineOriginalRectangles(memory,d,first,second,destination,at=>at===0x93da?0x9ad0:at===0x9ae8?0xa1d8:at);
}
