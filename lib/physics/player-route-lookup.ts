import type {Vector} from './math.ts';
export interface RouteMemoryEntry {primary:number;alternate:number;column:number;row:number;footprint:number}
export interface PlayerRouteGraph {readOutside?:(node:number)=>RouteMemoryEntry;readInitialVisited?:(node:number)=>number;stackFrameOffset?:number;initialVisited?:Readonly<Record<number,number>>;outside?:Readonly<Record<number,RouteMemoryEntry>>;primary:readonly number[];alternate:readonly number[];columns:readonly number[];rows:readonly number[];footprints:readonly number[]}
/** Original 9e42..a0a2. Primary-link search with saved alternative branches;
 * cost becomes -1 after crossing node zero. Cache writes follow search order.
 * Malformed/end-marker paths can read outside the graph: explicit caller memory
 * is required. Index ffff aliases the high byte of the original scratch local.
 */
export function lookupPlayerRoute(route:number,cache:readonly number[],position:Vector,graph:PlayerRouteGraph){
 const signedByte=(n:number)=>n<<24>>24;
 const column=signedByte((position[0]>>>16)&255),row=signedByte((29-((position[2]>>>16)&255))&255);
 let bounds=[...cache];
 const result=(changed:boolean,delta:number,found=route)=>({route:found,cache:bounds,changed,delta});
 if((column===bounds[0]||column===bounds[1])&&(row===bounds[2]||row===bounds[3]))return result(false,0);
 if(column<0||column>29||row<0||row>29)return result(true,-2);
 const visited=new Set<number>(),stack:{cursor:number;cost:number}[]=[];
 const outside=(node:number)=>graph.outside?.[node]??graph.readOutside?.(node);
 const initialVisited=(node:number)=>graph.initialVisited?.[node]??(node>=graph.primary.length&&node!==65535?graph.readInitialVisited?.(node):undefined);
 let cursor=route,cost=0,bestCost=0,bestRoute=route;let scratchHigh:number|undefined=0;
 for(;;){
  const primary=graph.primary[cursor]??outside(cursor)?.primary,alternative=graph.alternate[cursor]??outside(cursor)?.alternate;
  let node=primary;
  if(node===undefined||alternative===undefined)throw Error('Missing original player route link');
  if(node>=graph.primary.length&&node!==65535&&initialVisited(node)===undefined)throw Error('Original out-of-range route requires stack memory');
  if(node===65535&&scratchHigh===undefined)throw Error('Original sentinel lookup requires caller stack context');
  if(node===65535?!!scratchHigh:(visited.has(node)||!!initialVisited(node))){
   const branch=stack.pop();if(branch){cursor=branch.cursor;cost=branch.cost;scratchHigh=graph.stackFrameOffset===undefined?undefined:((graph.stackFrameOffset+stack.length*2)&65535)>>>8;continue;}
   if(bestCost!==0)return result(true,bestCost,bestRoute);
   bounds=[column,column,row,row];return result(true,-2);
  }
  if(node===65535)scratchHigh=1;else visited.add(node);
  const x=graph.columns[node]??outside(node)?.column,z=graph.rows[node]??outside(node)?.row,flags=graph.footprints[node]??outside(node)?.footprint;
  if(x===undefined||z===undefined||flags===undefined)throw Error('Missing original player route footprint');
  const right=(x+((flags&2)?1:0))&255,bottom=(z+((flags&1)?1:0))&255;
  if((column===x||column===right)&&(row===z||row===bottom)){
   if(alternative!==65535)node=cursor;
   bounds=[signedByte(x),signedByte(right),signedByte(z),signedByte(bottom)];
   if(cost<=0)return result(true,cost,node);
   if(bestCost===0||bestCost>cost){bestRoute=node;bestCost=cost;}
  }
  const alternate=alternative;
  if(alternate!==65535)stack.push({cursor:alternate,cost});
  if(node===0)cost=-1;else if(cost!==-1)cost=(cost+1)<<16>>16;
  cursor=node;
 }
}
