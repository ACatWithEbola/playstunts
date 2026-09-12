import {resetOriginalWorldRegions} from './reset-world-regions.ts';
import {restoreOriginalVideoWindow} from './select-sprite-window.ts';
import {selectOriginalRaceCamera} from './select-race-camera.ts';
import type {OriginalRasterCall} from './drain-primitive-queue.ts';
import {originalExternalCamera} from './original-external-camera.ts';
import type {TrackObject} from '../physics/track.ts';
import type {CollisionPlane} from '../physics/plane.ts';
import {i16,type Vector} from '../physics/math.ts';
import {cockpitEyeOffset} from './cockpit-eye-offset.ts';
import {readOriginalCarWheelSnapshot} from './car-wheel-snapshot.ts';
import {writeAnalyzedTrackMemory} from './write-analyzed-track-memory.ts';
import {renderOriginalWorld} from './render-original-world.ts';
import type {RenderTileSlots} from './select-render-tiles.ts';
/** Optional presentation camera: source world coordinates and original angle units.
 * The ordinary cockpit and source external-camera branches retain their defaults.
 */
export interface NativePresentationCamera {mode?:0|2;position:Vector;angles:Vector;width:number;projection:readonly [number,number,number,number]}
/** Independent rendering memory: drawing never writes into live simulation state.
 * Allocated resources retain the original primitive queue and use VGA memory
 * for pixels, outside the conventional resource heap. */
export function createNativeOriginalRenderer(baseline:Uint8Array,raw:number[],analysis:Parameters<typeof writeAnalyzedTrackMemory>[3],options:{allocatedResources?:boolean;originalViewport?:boolean;originalCameras?:{objects:TrackObject[];planes:CollisionPlane[]}}={}){
 const d=0x2d1a0,cs=0x209e0,memory=options.allocatedResources?baseline.slice():writeAnalyzedTrackMemory(baseline,d,raw,analysis).memory,v=new DataView(memory.buffer);
 const s=(o:number)=>v.getInt16(d+o,true),l=(o:number)=>v.getInt32(d+o,true),b=(o:number)=>memory[d+o];
 let slots=Object.fromEntries(['skip','east','south','terrain','tile','detail'].map(k=>[k,Array(23).fill(0)])) as unknown as RenderTileSlots,opponentRow=0;
 const cache={vectors:Array.from({length:256},()=>[0,0,0] as Vector),points:Array.from({length:256},()=>[0,0]),flags:Array(256).fill(0)};
 const framebuffer=options.allocatedResources?0xa0000:0x90000;
 if(!options.allocatedResources){v.setUint16(d+0x558c,0,true);v.setUint16(d+0x558e,0x8000,true);}
 if(options.allocatedResources)restoreOriginalVideoWindow(memory,cs);
 else {
  v.setUint16(cs+0x5d96,framebuffer/16,true);v.setUint16(cs+0x5d9e,0x6376,true);v.setUint16(cs+0x5da8,320,true);
  for(let row=0;row<200;row++)v.setUint16(cs+0x6376+row*2,row*320,true);
 }
 const defaultProjection=[s(0x4b88),s(0x4b8a),s(0x4b8c),s(0x4b8e)];
 const target=memory.subarray(framebuffer,framebuffer+64000);target.fill(0);
 let view:{position:Vector;angles:Vector;rectangle:number[];projection:number[];submissions:number[][];calls:OriginalRasterCall[];fireballMask:Uint8Array;wheels?:Vector[][]}|undefined;
 const imageAt=(offset:number,segment:number)=>{const a=segment*16+offset,width=v.getUint16(a,true),height=v.getUint16(a+2,true);return {width,height,pixels:memory.subarray(a+16,a+16+width*height)};};
 return {get view(){return view;},render(live:Uint8Array,external?:{objects:TrackObject[];planes:CollisionPlane[];distance:number;azimuth:number;elevation:number},drawCall?:(call:OriginalRasterCall)=>void,presentation?:NativePresentationCamera,fractionalPolygons=false,layers?:(memory:Uint8Array,drawWorld:()=>void)=>void){
  memory[d+0x134]=live[d+0x134];
  memory.set(live.subarray(d+0x8ae6,d+0x8f16),d+0x8ae6);
  memory.set(live.subarray(d+0x8fba,d+0x8fbe),d+0x8fba);
  memory.set(live.subarray(d+0x8fc6,d+0x8fce),d+0x8fc6);
  memory.set(live.subarray(d+0x9c52,d+0x9f5a),d+0x9c52);
  memory.set(live.subarray(d+0xa46a,d+0xa772),d+0xa46a);
  memory.set(live.subarray(d+0x93dc,d+0x93de),d+0x93dc);
  memory.set(live.subarray(d+0x73da,d+0x73dc),d+0x73da);
  const originalCamera=!presentation&&!external?options.originalCameras:undefined;
  memory[d+0x12f]=originalCamera?live[d+0x12f]:presentation?(presentation.mode??2):external?2:0;memory[d+0xa9f0]=originalCamera?live[d+0xa9f0]:0;
  if(originalCamera){memory.set(live.subarray(d+0x126,d+0x12c),d+0x126);memory.set(live.subarray(d+0x9334,d+0x9336),d+0x9334);memory.set(live.subarray(d+0xaa78,d+0xaa7a),d+0xaa78);}
  const originalViewport=options.originalViewport&&!presentation&&!external;
  if(originalViewport)memory.set(live.subarray(d+0x4b80,d+0x4b94),d+0x4b80);
  const projection=originalViewport?[s(0x4b88),s(0x4b8a),s(0x4b8c),s(0x4b8e)]:presentation?.projection??[defaultProjection[0],external?100:65,defaultProjection[2],defaultProjection[3]];
  projection.forEach((n,i)=>v.setInt16(d+0x4b88+i*2,n,true));
  const rotation=[s(0x8c50),s(0x8c52),s(0x8c54)] as Vector,world=[l(0x8c38),l(0x8c3c),l(0x8c40)] as Vector;
  const eye=cockpitEyeOffset(rotation,s(0xa53a)),cockpitCamera=world.map((n,i)=>i16((n>>6)+eye[i])) as Vector,roll=rotation[2]&1023;
  let angles=[roll>1&&roll<1023?roll:0,rotation[1]&1023,rotation[0]&1023] as Vector;
  let camera=cockpitCamera;
  if(external){
   const car=world.map(n=>i16(n>>6)) as Vector;
   const view=originalExternalCamera(car,rotation,raw,external.objects,external.planes,external.distance,external.azimuth,external.elevation,live[d+0xa3c2]);
   camera=view.position;angles=view.angles;
  }
  if(originalCamera){const selected=selectOriginalRaceCamera(memory,d,raw,originalCamera.objects,originalCamera.planes);camera=selected.position;angles=selected.angles;}
  if(presentation){camera=presentation.position;angles=presentation.angles;}
  const particles=Array.from({length:24},(_,i)=>({x:l(0x8ae6+i*4),y:l(0x8b46+i*4),z:l(0x8ba6+i*4),angleX:s(0x8db4+i*2),angleZ:s(0x8de4+i*2),heading:s(0x8e14+i*2),speed:s(0x8e44+i*2),verticalSpeed:s(0x8e74+i*2),style:b(0x8ee1+i),owner:b(0x8ef9+i)}));
  const paint=b(0x8b4+((s(0x8c26)||s(0xaa78))&15));
  const rectangle=originalViewport?[0,1,2,3].map(i=>new DataView(live.buffer,live.byteOffset,live.byteLength).getInt16(d+0x7fe6+i*2,true)):presentation?[0,presentation.width,0,200]:external?[0,320,0,200]:[0,320,9,130];
  view={position:[...camera],angles:[...angles],rectangle:[...rectangle],projection:[...projection],submissions:[],calls:[],fireballMask:new Uint8Array(64000)};
  const drawWorld=()=>{resetOriginalWorldRegions(memory,d);const result=renderOriginalWorld(memory,d,cs,{angles,camera,rectangle,carTile:[(world[0]>>16)&255,(29-(world[2]>>16))&255],slots,paint,particles,opponentRetainedRow:opponentRow,visibility:{player:0,opponent:0},cache,recordPointer:0xb000},imageAt,drawCall,!presentation,fractionalPolygons,fractionalPolygons?call=>view!.calls.push(call):undefined);
  view!.submissions=result.submissions;view!.fireballMask=result.fireballMask;
  if(fractionalPolygons)view!.wheels=([0,1] as const).map(owner=>readOriginalCarWheelSnapshot(memory,owner));
  slots=result.scene.slots;opponentRow=result.scene.cars.opponent.row;};
  if(layers)layers(memory,drawWorld);else drawWorld();
  return target;
 }};
}
