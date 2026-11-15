import type {PlayerRouteGraph} from '../physics/player-route-lookup.ts';

/** Conservative diagnostic: is every complete directed route forced to use
 * a track tile more than two tiles outside the entire driven bounding box?
 * An incomplete graph or bad positions are inconclusive, never an accusation. */
export function createRouteEnvelope(graph:PlayerRouteGraph){
 let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity,valid=true,samples=0;
 const n=graph.primary.length;
 const cycle=(inside:(node:number)=>boolean):boolean|null=>{
  if(!n||graph.alternate.length!==n||graph.columns.length!==n||graph.rows.length!==n||graph.footprints.length!==n)return null;
  const queue=[0],seen=new Set(queue);let closed=false;
  for(let i=0;i<queue.length;i++){
   const node=queue[i],x=graph.columns[node],z=graph.rows[node],f=graph.footprints[node];
   if(!Number.isInteger(x)||!Number.isInteger(z)||x<0||x>29||z<0||z>29||!Number.isInteger(f)||f<0||f>3)return null;
   for(const next of [graph.primary[node],graph.alternate[node]]){
    if(next===65535)continue;
    if(!Number.isInteger(next)||next<0||next>=n)return null;
    if(next===0&&node!==0){closed=true;continue;}
    if(!seen.has(next)&&inside(next)){seen.add(next);queue.push(next);}
   }
  }
  return closed;
 };
 return {
  observe(position:readonly number[]){
   const x=position[0]/64,z=position[2]/64;
   if(!Number.isFinite(x)||!Number.isFinite(z)){valid=false;return;}
   minX=Math.min(minX,x);maxX=Math.max(maxX,x);minZ=Math.min(minZ,z);maxZ=Math.max(maxZ,z);samples++;
  },
  result(finished:boolean){
   if(!finished||!samples||!valid||cycle(()=>true)!==true)return false;
   const pad=2*1024;
   const inside=(i:number)=>{
    const x=graph.columns[i]*1024,z=(29-graph.rows[i])*1024,f=graph.footprints[i];
    return x<=maxX+pad&&x+(1+((f&2)?1:0))*1024>=minX-pad&&z-((f&1)?1024:0)<=maxZ+pad&&z+1024>=minZ-pad;
   };
   return cycle(inside)===false;
  },
 };
}
