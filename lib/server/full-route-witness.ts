import type {PlayerRouteGraph} from '../physics/player-route-lookup.ts';
export type RouteGate={position:number[];radius:number};
/** Positive route evidence, not absence of a detected shortcut. A complete
 * directed start-to-finish path must have its ordered geometric gates covered.
 * Flat/unknown-height gates require actual road contact: flying underneath a
 * bridge cannot prove it. Finite-height stunt gates also require matching Y.
 * Missing/ambiguous evidence returns false, never a shortcut accusation.
 */
export function createFullRouteWitness(graph:PlayerRouteGraph,gates:RouteGate[][]){
 const cursors=gates.map(()=>0),completed=new Set<number>();
 let previous:number[]|null=null;
 const distance=(point:number[],a:number[],b:number[],height:boolean)=>{
  const axes=height?[0,1,2]:[0,2],delta=axes.map(axis=>b[axis]-a[axis]),offset=axes.map(axis=>point[axis]-a[axis]);
  const length=delta.reduce((sum,n)=>sum+n*n,0),t=length?Math.max(0,Math.min(1,offset.reduce((sum,n,i)=>sum+n*delta[i],0)/length)):0;
  return Math.hypot(...offset.map((n,i)=>n-t*delta[i]));
 };
 return {
  observe(position:readonly number[],surfaces:readonly number[]){
   const current=position.map(n=>n/64),before=previous??current,road=surfaces.some(s=>s>=1&&s<=3);
   for(let node=0;node<gates.length;node++){
    const list=gates[node];if(!list.length||completed.has(node))continue;
    while(cursors[node]<list.length){const gate=list[cursors[node]],height=gate.position[1]!==-1;
     if(!height&&!road||distance(gate.position,before,current,height)>gate.radius)break;
     cursors[node]++;
    }
    if(cursors[node]===list.length)completed.add(node);
   }
   previous=current;
  },
  result(finished:boolean){
   if(!finished||!completed.has(0))return false;
   // Only witnessed nodes may be used in this proof. Alternative branches are
   // allowed; the unused side of a legitimate fork is not a skipped section.
   const seen=new Set([0]),queue=[0];
   for(let i=0;i<queue.length;i++)for(const next of [graph.primary[queue[i]],graph.alternate[queue[i]]]){
    if(next===0&&queue[i]!==0)return true;
    if(next>0&&next<gates.length&&completed.has(next)&&!seen.has(next)){seen.add(next);queue.push(next);}
   }
   return false;
  },
 };
}
