import type {NativeDemoData} from '../game/native-demo-runtime.ts';
import {prepareRaceTrack} from '../game/prepare-race-track.ts';
import {trackRoutePoint} from '../physics/track-route-point.ts';
import {trackPlaneContact} from '../physics/track.ts';
import type {Vector} from '../physics/math.ts';
import type {RouteGate} from './full-route-witness.ts';

/** Navigation coordinates are not always road heights. Resolve ordinary
 * road/ramp/banked/tunnel gates against original collision planes instead of
 * rejecting every physics ID above three. Inverted stunts still need their
 * explicit complete 3D navigation geometry; unknown pieces fail closed. */
export function routeEvidenceGates(track:number[],prepared:ReturnType<typeof prepareRaceTrack>,data:NativeDemoData):RouteGate[][]{
 const ordinary=new Set([0,1,2,3,4,5,6,7,8,9,10,11,12,16,17,18,19,20,21,22,23,24,25,26,28,34]);
 return prepared.route.tiles.map((tile,node)=>{
  const points=Array.from({length:data.records[tile].records[prepared.route.directions[node]&15][5]},(_,point)=>{
   const gate=trackRoutePoint(track,prepared.route,node,point,data.records,data.points,data.objects);
   return {position:gate.midpoint,radius:Math.min(184,Math.hypot(gate.first[0]-gate.second[0],gate.first[2]-gate.second[2])/2+64)};
  });
  const physics=data.objects[tile].physics;
  if(!ordinary.has(physics)){
   const heights=points.filter(p=>p.position[1]!==-1).map(p=>p.position[1]);
   return points.length>=8&&heights.length===points.length&&Math.max(...heights)-Math.min(...heights)>=128?points:[];
  }
  const dense:RouteGate[]=[];
  for(let i=0;i<points.length;i++){
   const a=points[i],b=points[i+1];
   const count=b?Math.max(1,Math.ceil(Math.hypot(b.position[0]-a.position[0],b.position[2]-a.position[2])/160)):1;
   for(let step=0;step<count;step++){
    const t=step/count,x=a.position[0]+(b?b.position[0]-a.position[0]:0)*t,z=a.position[2]+(b?b.position[2]-a.position[2]:0)*t;
    const terrain=track[901+prepared.route.routeRows[node]*30+prepared.route.columns[node]],ground=terrain===6?450:0;
    const guess=a.position[1]!==-1?a.position[1]:ground+([18,19,20,21,22].includes(physics)?450:100);
    const sample=[Math.round(x*64),Math.round(guess*64),Math.round(z*64)] as Vector;
    try{
     const contact=trackPlaneContact(track,data.objects,sample,sample),plane=data.planes[contact.planeId];
     if(!plane||plane.normal[1]<4096||contact.surface<1||contact.surface>3)return [];
     const origin=plane.origin.map((n,k)=>n+contact.tileOrigin[k]);
     const y=origin[1]-((x-origin[0])*plane.normal[0]+(z-origin[2])*plane.normal[2])/plane.normal[1];
     // Wide curve tolerance permits brief curb cuts. Straight/crossing gates
     // stay below half the entry-to-exit span so crossing the other road
     // cannot witness both ends of this route.
     const curve=[2,3,4,5,6,7,8,9,21,26].includes(physics);
     dense.push({position:[x,y,z],radius:curve?Math.min(a.radius,b?.radius??a.radius)+192:240,requiresRoad:true,heightTolerance:280,airborneHeightTolerance:600});
    }catch{return [];}
   }
  }
  return dense;
 });
}
