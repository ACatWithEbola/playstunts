import {scanStart} from './start-scan.ts';
import {routeEntry} from './route-entry.ts';
import {routeExit} from './route-exit.ts';
import {selectRouteRecord} from './route-record-selection.ts';
import {routeGap} from './route-gap.ts';
import {slopeRoadMap} from './slope-road-map.ts';
import {pushRouteBranch,popRouteBranch,type RouteBranch} from './route-branch.ts';
import {matchRouteHistory} from './route-history.ts';
export interface RouteVisit {record:number[];direction:number;run:number;previousColumn:number;previousRow:number;previousTile:number;previousRecord:number;previousDirection:number}
/** Reconstructed traversal phase with an optional metadata collector. */
export function traverseRoute(raw:number[],descriptors:{records:number[][]}[],visit?:(state:RouteVisit)=>void,onLocation?:(location:number[])=>void,onBranchPush?:(index:number,bytes:number[])=>void){
 const scan=scanStart(raw,onLocation),track=scan.track;
 const nodes:{column:number;row:number;record:number;direction:number}[]=[],tiles:number[]=[],primary:number[]=[],secondary:number[]=[];
 const result=(error:number)=>{if(!scan.error)onLocation?.(error?[column===255?0:column===30?29:column,row===255?0:row===30?29:row]:[scan.start[0],scan.start[2]]);return ({error,count:nodes.length,columns:nodes.map(n=>n.column),routeRows:nodes.map(n=>n.row),directions:nodes.map(n=>n.record+(n.direction<<4)),tiles,primary,secondary});};
 if(scan.error)return result(scan.error);
 let column=scan.start[0],row=scan.start[2],heading=scan.heading,state=0,skipped=0,run=0,previousNode=-1,previousColumn=0,previousRow=0,previousTile=0,previousRecord=0,previousDirection=0,closed=false;
 const visited=new Set<number>(),stack:number[][]=[];
 let restored:RouteBranch|null=null;
 for(let guard=0;guard<10000;guard++){
  let chosen:{record:number;direction:number}|null=null,tile=0;
  if(restored){({column,row,tile,state,run,previousNode,previousColumn,previousRow,previousTile,previousRecord,previousDirection}=restored);chosen={record:restored.record,direction:restored.direction};restored=null;if(skipped>1)return result(10);}
  else if(column>=0&&column<30&&row>=0&&row<30){
   tile=track[(29-row)*30+column];const terrain=raw[901+row*30+column];
   if(tile&&terrain>=7&&terrain<11)tile=slopeRoadMap(terrain,tile);
   const entry=routeEntry(tile,heading,column,row);column=entry.column;row=entry.row;
   if(tile>=253)tile=track[(29-row)*30+column];
   if(!skipped&&!entry.entry)return result(2);
   for(const [record,bytes] of (descriptors[tile]?.records??[]).entries()){
    const selected=selectRouteRecord(bytes,entry.entry,state);if(selected.error)return result(selected.error);
    let direction=selected.direction!;
    if(direction>=0&&visited.has(row*30+column)){
     const match=matchRouteHistory(nodes,{column,row,record,direction},[primary[previousNode]??-1,secondary[previousNode]??-1]);
     if(previousNode>=0){primary[previousNode]=match.links[0];secondary[previousNode]=match.links[1];}closed ||= match.closed;
     if(match.error)return result(match.error);direction=match.direction;
    }
    if(direction<0)continue;
    if(!chosen)chosen={record,direction};
    else {if(pushRouteBranch(stack,{column,row,tile,record,direction,run,previousColumn,previousRow,previousTile,previousRecord,previousDirection,state,previousNode}))return result(8);onBranchPush?.(stack.length-1,stack[stack.length-1]);}
   }
   if(!chosen){const gap=routeGap(state,skipped,run,heading,column,row,previousColumn,previousRow);if(gap.error)return result(gap.error);if(gap.action==='advance'){({column,row,skipped,run}=gap);continue;}}
  }
  if(!chosen){restored=popRouteBranch(stack);if(!restored)return result(closed?0:7);continue;}
  skipped=0;visited.add(row*30+column);
  if(previousNode>=0){if(primary[previousNode]===-1)primary[previousNode]=nodes.length;else secondary[previousNode]=nodes.length;}
  previousNode=nodes.length;nodes.push({column,row,...chosen});tiles.push(tile);primary.push(-1);secondary.push(-1);
  const record=descriptors[tile].records[chosen.record];visit?.({record,direction:chosen.direction,run,previousColumn,previousRow,previousTile,previousRecord,previousDirection});run=record[12]===0?(run+1)&255:0;
  if(nodes.length===901)return result(6);
  state=record[chosen.direction?3:4];previousColumn=column;previousRow=row;previousTile=tile;previousRecord=chosen.record;previousDirection=chosen.direction;
  ({column,row,heading}=routeExit(record[chosen.direction?1:2],column,row,heading));
 }
 throw Error('Route traversal exceeded diagnostic iteration bound');
}
