import type {PlayerRouteGraph} from '../physics/player-route-lookup.ts';

export type RouteAssessment='full_route'|'shortcuts_detected'|'not_assessed';
/** Informational only. Never used to qualify, reject, rank or penalise a run.
 * Require sustained ground/grass contact between physically distinct,
 * non-neighbouring road sections. Ambiguous crossings, jumps, short corner
 * cuts and stunt execution not proven by this detector remain unassessed.
 * No claim of "Full route" is made merely because no shortcut was found.
 */
export function createShortcutAssessment(graph:PlayerRouteGraph){
 const neighbors=graph.primary.map(()=>new Set<number>());
 graph.primary.forEach((_,from)=>{for(const to of [graph.primary[from],graph.alternate[from]])if(to>=0&&to<neighbors.length){neighbors[from].add(to);neighbors[to].add(from);}});
 const arms:{left:Set<number>;right:Set<number>}[]=[];
 graph.primary.forEach((first,fork)=>{
  const second=graph.alternate[fork];if(first<0||second<0||first>=neighbors.length||second>=neighbors.length||first===second)return;
  const reachable=(start:number)=>{const found=new Set<number>(),queue=[start];for(let i=0;i<queue.length;i++){const node=queue[i];if(node===fork||node===0||found.has(node)||node<0||node>=neighbors.length)continue;found.add(node);queue.push(graph.primary[node],graph.alternate[node]);}return found;};
  const a=reachable(first),b=reachable(second);
  arms.push({left:new Set([...a].filter(node=>!b.has(node))),right:new Set([...b].filter(node=>!a.has(node)))});
 });
 const switchesArm=(from:number,to:number)=>arms.some(({left,right})=>left.has(from)&&right.has(to)||right.has(from)&&left.has(to));
 const nearby=(from:number,to:number)=>{let frontier=new Set([from]),seen=new Set(frontier);for(let depth=0;depth<=2;depth++){if(frontier.has(to))return true;const next=new Set<number>();for(const node of frontier)for(const neighbor of neighbors[node])if(!seen.has(neighbor)){seen.add(neighbor);next.add(neighbor);}frontier=next;}return false;};
 const centers=graph.columns.map((x,i)=>[(x+.5+((graph.footprints[i]&2)?.5:0))*1024,(29-graph.rows[i]+.5-((graph.footprints[i]&1)?.5:0))*1024]);
 const distance=(a:readonly number[],b:readonly number[])=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 const roadDistance=(from:number,to:number)=>{
  const costs=neighbors.map(()=>Infinity),visited=new Set<number>();costs[from]=0;
  for(let guard=0;guard<neighbors.length;guard++){
   let node=-1;for(let i=0;i<costs.length;i++)if(!visited.has(i)&&(node<0||costs[i]<costs[node]))node=i;
   if(node<0||!Number.isFinite(costs[node]))return null;if(node===to)return costs[node];visited.add(node);
   for(const next of neighbors[node])costs[next]=Math.min(costs[next],costs[node]+distance(centers[node],centers[next]));
  }
  return null;
 };
 const nodeAt=(position:readonly number[])=>{
  const column=Math.floor(position[0]/65536),row=29-Math.floor(position[2]/65536),matches:number[]=[];
  graph.columns.forEach((x,i)=>{const z=graph.rows[i],flags=graph.footprints[i];if(column>=x&&column<=x+((flags&2)?1:0)&&row>=z&&row<=z+((flags&1)?1:0))matches.push(i);});
  // A crossing can contain independent routes in the same footprint.
  return matches.length===1?matches[0]:null;
 };
 let anchor:{node:number;position:number[]}|null=null,grassFrames=0,grassDistance=0,lastGrass:readonly number[]|null=null,airborne=false;
 let firstReentry:number[]|null=null;
 let candidate:number|null=null,candidateFrames=0,detected=false;
 const reset=()=>{grassFrames=0;grassDistance=0;lastGrass=null;airborne=false;candidate=null;candidateFrames=0;firstReentry=null;};
 return {
  observe(position:readonly number[],surfaces:readonly number[]){
   if(detected)return;
   const road=surfaces.some(surface=>surface>=1&&surface<=3),grass=surfaces.length===4&&surfaces.every(surface=>surface===4);
   if(grass){candidate=null;candidateFrames=0;firstReentry=null;grassFrames++;const previous=lastGrass??anchor?.position;if(previous)grassDistance+=Math.hypot(position[0]-previous[0],position[2]-previous[2])/64;lastGrass=[...position];return;}
   if(!road){if(grassFrames)airborne=true;return;}
   const node=nodeAt(position);
   if(node===null){anchor=null;reset();return;}
   if(!grassFrames){anchor={node,position:[...position]};reset();return;}
   if(candidate!==node){candidate=node;candidateFrames=1;firstReentry=[...position];}else candidateFrames++;
   // Four road frames confirm a real re-entry rather than a wheel grazing it.
   if(candidateFrames<4)return;
   if(anchor&&!airborne&&grassFrames>=8&&grassDistance>=512&&firstReentry&&lastGrass){
    const path=roadDistance(anchor.node,node),start=[anchor.position[0]/64,anchor.position[2]/64],end=[firstReentry[0]/64,firstReentry[2]/64];
    const travelled=grassDistance+Math.hypot(firstReentry[0]-lastGrass[0],firstReentry[2]-lastGrass[2])/64;
    // Parallel grass travel along the same road is not a section shortcut.
    // Also allow a generous whole-tile margin for ordinary corner cuts.
    if(switchesArm(anchor.node,node)||!nearby(anchor.node,node)&&path!==null&&path-distance(start,centers[anchor.node])-distance(end,centers[node])-travelled>=1024)detected=true;
   }
   anchor={node,position:[...position]};reset();
  },
  result():RouteAssessment{return detected?'shortcuts_detected':'not_assessed';},
 };
}
