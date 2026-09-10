import {i16} from './math.ts';
/** Original 0xacf5..0xad8f: tile-size-dependent world translation. */
export function routePointWorld(first:number[],second:number[],column:number,row:number,multiTile:number){
 const x=(multiTile&2)?(column===29?1:(column+1)*1024):column*1024+512,z=(29-row)*1024+((multiTile&1)?0:512);
 const move=(v:number[])=>[i16(v[0]+x),v[1],i16(v[2]+z)];
 return {first:move(first),second:move(second)};
}
