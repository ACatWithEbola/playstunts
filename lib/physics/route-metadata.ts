import {traverseRoute} from './route-traversal.ts';
import {routeVector} from './route-vector.ts';
import {routePlacement} from './route-placement.ts';
/** Original metadata generated during traversal, before later route processing. */
export function traverseRouteWithMetadata(raw:number[],records:{records:number[][]}[],vectors:{vectors:number[][][]}[],objects:{multiTile:number}[],onLocation?:(location:number[])=>void,onBranchPush?:(index:number,bytes:number[])=>void){
 const headings:number[]=[],types:number[]=[],positions:number[][]=[],cells=Array<number>(900).fill(255);
 const route=traverseRoute(raw,records,s=>{
  const tag=s.record[12];
  if(!tag||tag===255||s.run<=3||headings.length===48)return;
  const previous=records[s.previousTile].records[s.previousRecord],rotation=previous[6]+256*previous[7];
  const vector=routeVector(vectors[s.previousTile].vectors[s.previousRecord],s.previousDirection,rotation);
  const placed=routePlacement(vector,s.previousColumn,s.previousRow,raw[901+s.previousRow*30+s.previousColumn],objects[s.previousTile].multiTile);
  cells[placed.cell]=headings.length;positions.push(placed.position);
  headings.push(rotation^(s.previousDirection?512:0));
  types.push((s.direction?[0,1,0,0,1,0]:[0,0,1,0,1,0])[tag]);
 },onLocation,onBranchPush);
 return {route,metadata:{headings,types,positions,cells}};
}
