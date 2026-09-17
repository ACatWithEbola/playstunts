import {interpolatePose,type RenderPose} from './render-pose.ts';
import type {Vector} from '../physics/math.ts';
export interface GraphicsMotionFrame {camera:RenderPose;cars:RenderPose[];wheels?:Vector[][];steering?:number[]}
const CAMERA_CUT_DISTANCE=256;
const SOURCE_FRAME_MS=50;
const blendFrame=(before:GraphicsMotionFrame,after:GraphicsMotionFrame,fraction:number):GraphicsMotionFrame=>({
 camera:interpolatePose(before.camera,after.camera,fraction),
 cars:after.cars.map((pose,i)=>interpolatePose(before.cars[i]??pose,pose,fraction)),
 steering:after.steering?.map((value,i)=>{const prior=before.steering?.[i]??value;return prior+(value-prior)*fraction;}),
 wheels:after.wheels?.map((vertices,owner)=>vertices.map((point,i)=>{
  const prior=before.wheels?.[owner]?.[i]??point;
  return point.map((value,axis)=>prior[axis]+(value-prior[axis])*fraction) as Vector;
 })),
});
/** One source frame of display latency lets 20 Hz game motion be drawn at
 * browser refresh rate. Never extrapolates or writes back into the game. */
export function createLiveGraphicsMotion(){
 let previous:GraphicsMotionFrame|undefined,current:GraphicsMotionFrame|undefined,at=0,lastAt=0,lastFrame=-1,lastMode='';
 const copy=(value:GraphicsMotionFrame)=>structuredClone(value);
 return {sample(value:GraphicsMotionFrame,frame:number,mode:string,paused:boolean,now:number,fixedCamera=false,independentCamera=false){
  // Trackside/TV cameras jump between fixed camera sites. The original makes
  // that an immediate cut; interpolating the jump creates a brief panorama
  // sweep that is not present in the source game.
  const cameraMoved=!!current&&current.camera.position.some((n,i)=>value.camera.position[i]!==n);
  const cameraCut=!independentCamera&&cameraMoved&&(fixedCamera||current!.camera.position.some((n,i)=>Math.abs(value.camera.position[i]-n)>CAMERA_CUT_DISTANCE));
  const reset=!current||paused||mode!==lastMode||cameraCut||now-lastAt>200||frame<lastFrame||frame-lastFrame>1;
  if(reset){previous=copy(value);current=copy(value);at=now;}
  else if(frame!==lastFrame){
   // Browser and audio clocks do not always deliver a 20 Hz source frame at
   // exactly 50 ms. Rebase from the pose already on screen: promoting the old
   // target here made the whole world jump when a source frame arrived early.
   previous=blendFrame(previous!,current!,Math.max(0,Math.min(1,(now-at)/SOURCE_FRAME_MS)));
   current=copy(value);at=now;
  }
  // A second presentation of one source frame must not restart its blend.
  // Camera adjustments may revise the target, but do not advance source time.
  else current=copy(value);
  lastAt=now;lastFrame=frame;lastMode=mode;
  return blendFrame(previous!,current!,Math.max(0,Math.min(1,(now-at)/SOURCE_FRAME_MS)));
 }};
}
