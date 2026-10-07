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
 const ordinary=new Set([0,1,2,3,4,5,6,7,8,9,10,11,12,16,17,18,19,20,21,22,23,24,25,26,28,29,30,31,34]);
 return prepared.route.tiles.map((tile,node)=>{
  const points=Array.from({length:data.records[tile].records[prepared.route.directions[node]&15][5]},(_,point)=>{
   const gate=trackRoutePoint(track,prepared.route,node,point,data.records,data.points,data.objects);
   return {position:gate.midpoint,radius:Math.min(184,Math.hypot(gate.first[0]-gate.second[0],gate.first[2]-gate.second[2])/2+64)};
  });
  const physics=data.objects[tile].physics;
  if(physics===10||physics===11||physics===27||physics===35){
   // These navigation vectors describe one chosen driving line, not the
   // complete allowed road. Divided roads permit either lane; an l/r cork
   // permits straight interior travel as well as its twisting surface.
   // Loops also permit driving through the inside without competition-only
   // rotation rules. Keep entry-to-exit order and a bounded road corridor.
   const axis:0|2=data.objects[tile].rotation===0||data.objects[tile].rotation===512?2:0,cross=axis===0?2:0;
   const terrain=track[901+prepared.route.routeRows[node]*30+prepared.route.columns[node]],ground=terrain===6?450:0;
   const center=cross===0?prepared.route.columns[node]*1024+512:(29-prepared.route.routeRows[node])*1024+512;
   const first=points[0]?.position[axis],last=points.at(-1)?.position[axis];if(first===undefined||last===undefined||Math.abs(last-first)<128)return [];
   const count=Math.ceil(Math.abs(last-first)/128);
   return Array.from({length:count+1},(_,i)=>{
    const position=[0,ground+100,0];position[axis]=first+(last-first)*i/count;position[cross]=center;
    return {position,radius:80,longitudinalAxis:axis,lateralTolerance:physics===35?130:physics===27?440:360,requiresRoad:true,heightTolerance:physics===35?240:physics===27?1100:180,airborneHeightTolerance:physics===35?240:physics===27?300:600,allowGrassExcursion:false};
   });
  }
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
    if(physics>=29&&physics<=31){
     // Pipe navigation follows one side of its circular cross-section, not
     // a mandatory wheel line. Any inside line is legitimate. The original
     // pipe selector bounds x to 164 and y below 265; account for the car's
     // body above wheel contact, but never use the open-road 600-unit jump
     // allowance here. A pipe jump may be airborne within the tube.
     const object=data.objects[tile],cx=prepared.route.columns[node]*1024+512,cz=(29-prepared.route.routeRows[node])*1024+512;
     dense.push({position:[object.rotation===0||object.rotation===512?cx:x,ground+150,object.rotation===256||object.rotation===768?cz:z],radius:164,requiresRoad:true,heightTolerance:200,airborneHeightTolerance:200,allowGrassExcursion:false});
     continue;
    }
    // Both overpass branches can omit Y. Their tangent relative to the
    // original object rotation identifies the elevated longitudinal road,
    // versus the perpendicular road underneath. Never merge their layers.
    const first=points[0].position,last=points.at(-1)!.position,alongZ=Math.abs(last[2]-first[2])>Math.abs(last[0]-first[0]);
    const upperOverpass=physics===22&&alongZ===(data.objects[tile].rotation===0||data.objects[tile].rotation===512);
    const guess=a.position[1]!==-1?a.position[1]:ground+([18,19,20,21].includes(physics)||upperOverpass?450:100);
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
     // Open-road excursions may follow the same road within its tile corridor.
     // Section-transfer detection remains independent. Tunnel evidence must
     // come from inside/on the structure, never grass beside it.
     dense.push({position:[x,y,z],radius:curve?Math.min(a.radius,b?.radius??a.radius)+192:240,grassRadius:curve?Math.min(a.radius,b?.radius??a.radius)+192:440,allowGrassExcursion:physics!==28,requiresRoad:true,heightTolerance:280,airborneHeightTolerance:600});
    }catch{return [];}
   }
  }
  return dense;
 });
}
