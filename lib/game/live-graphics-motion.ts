import {interpolatePose,type RenderPose} from './render-pose.ts';
import type {Vector} from '../physics/math.ts';
export interface GraphicsMotionFrame {camera:RenderPose;cars:RenderPose[];wheels?:Vector[][];steering?:number[]}
const CAMERA_CUT_DISTANCE=256;
/** One source frame of display latency lets 20 Hz game motion be drawn at
 * browser refresh rate. Never extrapolates or writes back into the game. */
export function createLiveGraphicsMotion(){
 let previous:GraphicsMotionFrame|undefined,current:GraphicsMotionFrame|undefined,at=0,lastAt=0,lastFrame=-1,lastMode='';
 const copy=(value:GraphicsMotionFrame)=>structuredClone(value);
 return {sample(value:GraphicsMotionFrame,frame:number,mode:string,paused:boolean,now:number,fixedCamera=false){
  // Trackside/TV cameras jump between fixed camera sites. The original makes
  // that an immediate cut; interpolating the jump creates a brief panorama
  // sweep that is not present in the source game.
  const cameraMoved=!!current&&current.camera.position.some((n,i)=>value.camera.position[i]!==n);
  const cameraCut=cameraMoved&&(fixedCamera||current!.camera.position.some((n,i)=>Math.abs(value.camera.position[i]-n)>CAMERA_CUT_DISTANCE));
  const reset=!current||paused||mode!==lastMode||cameraCut||now-lastAt>200||frame<lastFrame||frame-lastFrame>1;
  if(reset){previous=copy(value);current=copy(value);at=now;}
  else if(frame!==lastFrame){previous=current;current=copy(value);at=now;}
  // A second presentation of one source frame must not restart its blend.
  // Camera adjustments may revise the target, but do not advance source time.
  else current=copy(value);
  lastAt=now;lastFrame=frame;lastMode=mode;
  const fraction=Math.max(0,Math.min(1,(now-at)/50));
  return {camera:interpolatePose(previous!.camera,current!.camera,fraction),cars:current!.cars.map((pose,i)=>interpolatePose(previous!.cars[i],pose,fraction)),steering:current!.steering?.map((value,i)=>{
   const before=previous!.steering?.[i]??value;return before+(value-before)*fraction;
  }),wheels:current!.wheels?.map((vertices,owner)=>vertices.map((point,i)=>{
   const before=previous!.wheels?.[owner]?.[i]??point;
   return point.map((value,axis)=>before[axis]+(value-before[axis])*fraction) as Vector;
  }))};
 }};
}
