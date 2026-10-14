import {drawOriginalCrashFireballs} from './crash-fireballs.ts';
import type {Vector} from '../physics/math.ts';
import type {Particle} from './particles.ts';
import type {RenderTileSlots} from './select-render-tiles.ts';
import type {ModelBoundsCache} from './project-model-bounds.ts';
import {prepareOriginalView} from './prepare-original-view.ts';
import {submitOriginalDistantModels} from './distant-models.ts';
import {renderOriginalSceneFrame} from './render-scene-frame.ts';
import {renderOriginalModelMemory} from './render-model-memory.ts';
import {updateOriginalCarWheelMemory} from './car-wheel-memory.ts';
import {renderOriginalSceneBackground} from './render-scene-background.ts';
import type {OriginalMs91BackgroundPolicy} from './render-scene-background.ts';
import type {OriginalPanoramaImage} from './render-horizon-background.ts';
import type {OriginalRasterCall} from './drain-primitive-queue.ts';
import {drainOriginalPrimitiveQueue} from './drain-primitive-queue.ts';
import {rasterOriginalDrawCall} from './raster-original-draw-call.ts';
import {ms91RedrawModelRecord} from './ms91-model-region-policy.ts';
import {MODEL_DISPLAY_LAYOUTS} from './model-display-layout.ts';
import {WORLD_DISPLAY_LAYOUTS} from './world-display-layout.ts';
import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
export interface OriginalWorldFrame {
 physicsEngine?:PhysicsEngineVersion;
 angles:Vector;camera:Vector;rectangle:readonly number[];carTile:readonly number[];
 slots:RenderTileSlots;paint:number;particles:readonly Particle[];opponentRetainedRow:number;
 visibility:{player:number;opponent:number};cache:ModelBoundsCache;recordPointer:number;
 ms91DescriptorRegionTracking?:boolean;
 ms91SlowVideoManagement?:boolean;
 ms91BackgroundPolicy?:OriginalMs91BackgroundPolicy;
}
/** Joins original C279..CDDA rendering. Resources and framebuffers are caller-owned.
 * Background uses the original full-redraw branch, with no changes to geometry.
 */
export function renderOriginalWorld(memory:Uint8Array,d:number,rasterSegment:number,frame:OriginalWorldFrame,imageAt:(offset:number,segment:number)=>OriginalPanoramaImage,drawCall?:(call:OriginalRasterCall)=>void,renderBackground=true,fractionalPolygons=false,observe?:(call:OriginalRasterCall)=>void){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),view=prepareOriginalView(memory,d,frame.angles,frame.rectangle);
 const presentation=fractionalPolygons?new Map<number,number[][]>():undefined;
 const slowVideo=frame.ms91SlowVideoManagement!==false;
 const layout=frame.ms91DescriptorRegionTracking?{...WORLD_DISPLAY_LAYOUTS.mcga,ms91SlowVideoManagement:slowVideo,ms91CarRegionScratch:{player:0xeefe-0x6a,opponent:0xeefe-0x8e}}:WORLD_DISPLAY_LAYOUTS.mcga;
 const submissions:number[][]=[];
 const draw=(record:number[])=>{const routed=frame.ms91DescriptorRegionTracking?ms91RedrawModelRecord(record,slowVideo):record;submissions.push([...routed]);memory.set(routed,d+frame.recordPointer);return renderOriginalModelMemory(memory,d,frame.recordPointer,frame.cache,presentation?(index,points)=>presentation.set(index,points):undefined,undefined,MODEL_DISPLAY_LAYOUTS.mcga,!!frame.ms91DescriptorRegionTracking,frame.physicsEngine).result;};
 if(memory[d+0x134]===0)submitOriginalDistantModels(memory,d,frame.angles[2],frame.camera[1],view.backgroundMatrix,draw);
 const cameraTile=[frame.camera[0]>>10,29-(frame.camera[2]>>10)];
 const carTile=memory[d+0x134]?[memory[d+0x8c3a],(29-memory[d+0x8c42])&255]:frame.carTile;
 const slots={...frame.slots,skip:Array(23).fill(0)},threshold=memory[d+0x88a+memory[d+0x134]];
 const scene=renderOriginalSceneFrame(memory,d,view.heading,cameraTile,carTile,threshold,slots,frame.paint,frame.camera,frame.particles,frame.opponentRetainedRow,frame.visibility,draw,args=>updateOriginalCarWheelMemory(memory,d,args),layout);
 const polygonCount=v.getUint16(d+0x8938,true),framebuffer=v.getUint16(rasterSegment+0x5d96,true)*16+v.getUint16(rasterSegment+v.getUint16(rasterSegment+0x5d9e,true),true);
 const backgroundRequiresFullRedraw=renderBackground?renderOriginalSceneBackground(memory.subarray(framebuffer,framebuffer+64000),memory,d,frame.rectangle,view.backgroundDirection,view.backgroundMatrix,frame.angles[0],frame.angles[2],frame.camera[1],imageAt,320,frame.ms91BackgroundPolicy):undefined;
 for(const [offset,value] of [[0x5dae,0],[0x5da0,0],[0x5db0,320],[0x5da2,320],[0x5da4,frame.rectangle[2]],[0x5da6,frame.rectangle[3]]])v.setUint16(rasterSegment+offset,value,true);
 drainOriginalPrimitiveQueue(memory,d,(call,index,counter)=>{
  if(frame.physicsEngine)call={...call,physicsEngine:frame.physicsEngine};
  const points=presentation?.get(index);
  observe?.(points&&points.length>=3?{...call,presentationPoints:points}:call);
  if(drawCall)drawCall(points&&points.length>=3?{...call,presentationPoints:points}:call);
  else return rasterOriginalDrawCall(memory,d,rasterSegment,call,{index,counter});
 });
 const fireballMask=new Uint8Array(64000);
 drawOriginalCrashFireballs(memory,d,frame.rectangle,scene.visibility,'mcga',undefined,fireballMask,frame.ms91DescriptorRegionTracking&&!slowVideo?[0xeefe-0x6a,0xeefe-0x8e]:undefined);
 return {scene,polygonCount,view,submissions,fireballMask,backgroundRequiresFullRedraw};
}
