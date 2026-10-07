import type {PlayerRouteGraph} from '../physics/player-route-lookup.ts';
export type RouteGate={position:number[];radius:number;requiresRoad?:boolean;heightTolerance?:number;airborneHeightTolerance?:number;allowGrassExcursion?:boolean;longitudinalAxis?:0|2;lateralTolerance?:number};
/** Positive route evidence, not absence of a detected shortcut. A complete
 * directed start-to-finish path must have its ordered geometric gates covered.
 * Flat/unknown-height gates require actual road contact: flying underneath a
 * bridge cannot prove it. Finite-height stunt gates also require matching Y.
 * Missing/ambiguous evidence returns false, never a shortcut accusation.
 */
export function createFullRouteWitness(graph:PlayerRouteGraph,gates:RouteGate[][]){
 const cursors=gates.map(()=>0),completed=new Set<number>();
 const completedAt=gates.map(()=>Infinity);let frame=0;
 let previous:number[]|null=null;
 let offRoadFrames=0;
 let hasRoadContact=false;
 const distance=(point:number[],a:number[],b:number[],height:boolean)=>{
  const axes=height?[0,1,2]:[0,2],delta=axes.map(axis=>b[axis]-a[axis]),offset=axes.map(axis=>point[axis]-a[axis]);
  const length=delta.reduce((sum,n)=>sum+n*n,0),t=length?Math.max(0,Math.min(1,offset.reduce((sum,n,i)=>sum+n*delta[i],0)/length)):0;
  return Math.hypot(...offset.map((n,i)=>n-t*delta[i]));
 };
 return {
  observe(position:readonly number[],surfaces:readonly number[]){
   frame++;
   const current=position.map(n=>n/64),before=previous??current,road=surfaces.some(s=>s>=1&&s<=3);
   offRoadFrames=road?0:offRoadFrames+1;
   hasRoadContact ||= road;
   for(let node=0;node<gates.length;node++){
    const list=gates[node];if(!list.length||completed.has(node))continue;
    while(cursors[node]<list.length){const gate=list[cursors[node]],height=gate.position[1]!==-1;
     // Ordinary road evidence allows the agreed <=2-second curb excursion
     // and airborne travel, but not sustained grass driving. Keep height
     // separate from lateral road tolerance so bridge underpasses cannot pass.
     const airborne=surfaces.every(s=>s===0),contact=road||gate.requiresRoad&&hasRoadContact&&(airborne||gate.allowGrassExcursion!==false)&&offRoadFrames<=(airborne?80:40);
     if((!height||gate.requiresRoad)&&!contact)break;
     if(gate.heightTolerance!==undefined){
      let horizontal=distance(gate.position,before,current,false);
      const dx=current[0]-before[0],dz=current[2]-before[2],length=dx*dx+dz*dz;
      let t=length?Math.max(0,Math.min(1,((gate.position[0]-before[0])*dx+(gate.position[2]-before[2])*dz)/length)):0;
      if(gate.longitudinalAxis!==undefined){
       const axis=gate.longitudinalAxis,cross=axis===0?2:0,delta=current[axis]-before[axis];
       t=delta?Math.max(0,Math.min(1,(gate.position[axis]-before[axis])/delta)):0;
       horizontal=Math.abs(before[axis]+t*delta-gate.position[axis]);
       if(Math.abs(before[cross]+t*(current[cross]-before[cross])-gate.position[cross])>(gate.lateralTolerance??gate.radius))break;
      }
      const above=before[1]+t*(current[1]-before[1])-gate.position[1];
      if(horizontal>gate.radius||above< -120||above>(airborne?gate.airborneHeightTolerance??gate.heightTolerance:gate.heightTolerance))break;
     }else if(distance(gate.position,before,current,height)>gate.radius)break;
     cursors[node]++;
    }
    if(cursors[node]===list.length){completed.add(node);completedAt[node]=frame;}
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
    if(next>0&&next<gates.length&&completed.has(next)&&(queue[i]===0||completedAt[next]>=completedAt[queue[i]])&&!seen.has(next)){seen.add(next);queue.push(next);}
   }
   return false;
  },
  progress(){return gates.map((list,node)=>({node,covered:cursors[node],required:list.length,completedAt:completedAt[node]}));},
 };
}
