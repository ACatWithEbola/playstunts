import {interpolatePose,type RenderPose} from './render-pose.ts';
export interface GraphicsMotionFrame {camera:RenderPose;cars:RenderPose[]}
/** One source frame of display latency lets 20 Hz game motion be drawn at
 * browser refresh rate. Never extrapolates or writes back into the game. */
export function createLiveGraphicsMotion(){
 let previous:GraphicsMotionFrame|undefined,current:GraphicsMotionFrame|undefined,at=0,lastAt=0,lastFrame=-1,lastMode='';
 const copy=(value:GraphicsMotionFrame)=>structuredClone(value);
 return {sample(value:GraphicsMotionFrame,frame:number,mode:string,paused:boolean,now:number){
  const reset=!current||paused||mode!==lastMode||now-lastAt>200||frame<lastFrame||frame-lastFrame>1;
  if(reset){previous=copy(value);current=copy(value);at=now;}
  else if(frame!==lastFrame){previous=current;current=copy(value);at=now;}
  // A second presentation of one source frame must not restart its blend.
  // Camera adjustments may revise the target, but do not advance source time.
  else current=copy(value);
  lastAt=now;lastFrame=frame;lastMode=mode;
  const fraction=Math.max(0,Math.min(1,(now-at)/50));
  return {camera:interpolatePose(previous!.camera,current!.camera,fraction),cars:current!.cars.map((pose,i)=>interpolatePose(previous!.cars[i],pose,fraction))};
 }};
}
