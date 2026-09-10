import {routeVector} from './route-vector.ts';
import {routePlacement} from './route-placement.ts';
/** Original 0x12d24..0x13567 post-traversal sampling. */
export function routeSamples(raw:number[],route:{count:number;columns:number[];routeRows:number[];tiles:number[];directions:number[]},records:{records:number[][]}[],vectors:{vectors:number[][][]}[],objects:{multiTile:number}[]){
 const count=Math.min(Math.trunc(route.count/3),64),seen=new Set<number>();
 const positions:number[][]=[],heights:number[]=[],flags:number[]=[];
 for(let i=0;i<count;i++){
  // The original sign-extends the low multiplication word before division.
  const index=Math.trunc(((route.count*i<<16)>>16)/count);
  if(index<0)throw Error('Original route sampling overflow requires caller memory context');
  const column=route.columns[index],row=route.routeRows[index],cell=row*30+column;
  if(seen.has(cell))continue;seen.add(cell);
  const tile=route.tiles[index],packed=route.directions[index],recordIndex=packed&15,record=records[tile].records[recordIndex];
  const terrain=raw[901+cell],rotation=record[6]+256*record[7];
  const vector=routeVector(vectors[tile].vectors[recordIndex],packed&16,rotation);
  positions.push(routePlacement(vector,column,row,terrain,objects[tile].multiTile).position);
  heights.push(terrain===6?450:0);flags.push(0);
 }
 return {positions,heights,flags};
}
