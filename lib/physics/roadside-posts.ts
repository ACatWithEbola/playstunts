import {i16,intSin,intCos} from './math.ts';
import type {CollisionBody} from './car-overlap.ts';
/** Original0x8e10..0x8ef5. Row is the original reverse-indexed terrain row. */
export function roadsidePosts(column:number,terrainRow:number,height:number,heading:number):CollisionBody[]{
 const scaled=(v:number)=>i16((126*v+8192)>>14);
 return [256,768].map(offset=>({position:[i16(column*1024+512+scaled(intSin(heading+offset))),i16(height),i16((29-terrainRow)*1024+512+scaled(intCos(heading+offset)))],angles:[0,0,0],dimensions:[6,121,6],radius:9}));
}
