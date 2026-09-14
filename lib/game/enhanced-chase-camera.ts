import {Vector3} from 'three';
import {originalExternalCameraClearance} from './external-camera-clearance.ts';
import {upgradedCameraBasis} from './upgraded-camera-basis.ts';
import type {RenderPose} from './render-pose.ts';
import type {TrackObject} from '../physics/track.ts';
import type {CollisionPlane} from '../physics/plane.ts';
import type {Vector} from '../physics/math.ts';

export type EnhancedChaseCameraLevel=0|1|2|3;

export const ENHANCED_CHASE_CAMERA_LABELS=['Original','Close','Standard','Far'] as const;

const PRESETS={
 1:{distance:210,height:76,lookAhead:105,targetHeight:44,fov:58},
 2:{distance:310,height:108,lookAhead:150,targetHeight:48,fov:60},
 3:{distance:440,height:150,lookAhead:215,targetHeight:52,fov:62},
} as const;
const TRANSITION_MS=320;
type ChaseRig={distance:number;height:number;lookAhead:number;targetHeight:number;fov:number};

const copyRig=(rig:ChaseRig):ChaseRig=>({...rig});
const mixRig=(from:ChaseRig,to:ChaseRig,fraction:number):ChaseRig=>({
 distance:from.distance+(to.distance-from.distance)*fraction,
 height:from.height+(to.height-from.height)*fraction,
 lookAhead:from.lookAhead+(to.lookAhead-from.lookAhead)*fraction,
 targetHeight:from.targetHeight+(to.targetHeight-from.targetHeight)*fraction,
 fov:from.fov+(to.fov-from.fov)*fraction,
});
const transitionFraction=(now:number,started:number)=>{
 const linear=Math.max(0,Math.min(1,(now-started)/TRANSITION_MS));
 return linear*linear*(3-2*linear);
};

export function nextEnhancedChaseCameraLevel(level:EnhancedChaseCameraLevel):EnhancedChaseCameraLevel{
 return (level===3?0:level+1) as EnhancedChaseCameraLevel;
}

/** Presentation-only chase rig. Car poses are already converted from the
 * original fixed-point positions into renderer world units. The original
 * terrain contact routine protects the eye without changing simulation data. */
export function createEnhancedChaseCamera(track:{raw:number[];objects:TrackObject[];planes:CollisionPlane[]}){
 const position=new Vector3(),target=new Vector3(),forward=new Vector3(),up=new Vector3(),lastCar=new Vector3();
 const desiredPosition=new Vector3(),desiredTarget=new Vector3(),desiredForward=new Vector3();
 let initialized=false,lastAt=0,lastCarIndex=-1,lastFrame=-1,rigLevel:Exclude<EnhancedChaseCameraLevel,0>=1;
 let rig:ChaseRig=copyRig(PRESETS[1]),transitionFrom:ChaseRig=copyRig(PRESETS[1]),transitionTo:ChaseRig=copyRig(PRESETS[1]),transitionAt=0;
 const clear=(point:Vector,mode:number):Vector=>{
  const source=[Math.round(point[0]),Math.round(point[1]),Math.round(-point[2])] as Vector;
  const result=originalExternalCameraClearance(source,track.raw,track.objects,track.planes,mode);
  return [result[0],result[1],-result[2]];
 };
 return {
  sample(pose:RenderPose,level:Exclude<EnhancedChaseCameraLevel,0>,carIndex:number,now:number,frame:number,raceMode:number){
   const preset=PRESETS[level],car=new Vector3(pose.position[0],pose.position[1],-pose.position[2]);
   const interrupted=!initialized||carIndex!==lastCarIndex||now-lastAt>250||frame<lastFrame||car.distanceToSquared(lastCar)>1024*1024;
   const basis=upgradedCameraBasis([pose.rotation[2],pose.rotation[1],pose.rotation[0]]);
   // A modern chase camera follows the car's compass heading, but it does not
   // roll with the chassis on a bank or bounce its horizon over rough ground.
   // Frame zero spans the complete transporter rollout. Keep its first valid
   // heading for that whole sequence so animation-only yaw changes cannot pan
   // an infinitely distant panorama before control is handed to the driver.
   if(frame===0&&!interrupted)desiredForward.copy(forward);
   else desiredForward.set(basis.forward[0],0,-basis.forward[2]);
   if(desiredForward.lengthSq()<1e-6)desiredForward.copy(forward.lengthSq()>0?forward:new Vector3(0,0,-1));
   desiredForward.normalize();
   if(interrupted){
    rig=copyRig(preset);transitionFrom=copyRig(preset);transitionTo=copyRig(preset);transitionAt=now;rigLevel=level;
   }else{
    rig=mixRig(transitionFrom,transitionTo,transitionFraction(now,transitionAt));
    if(level!==rigLevel){
     transitionFrom=copyRig(rig);transitionTo=copyRig(preset);transitionAt=now;rigLevel=level;
    }
    rig=mixRig(transitionFrom,transitionTo,transitionFraction(now,transitionAt));
   }
   const dt=interrupted?0:Math.min(.05,Math.max(0,(now-lastAt)/1000));
   if(interrupted)forward.copy(desiredForward);
   else{
    forward.lerp(desiredForward,1-Math.exp(-dt*9)).normalize();
   }
   up.set(0,1,0);
   desiredTarget.copy(car).addScaledVector(forward,rig.lookAhead).addScaledVector(up,rig.targetHeight);
   desiredPosition.copy(car).addScaledVector(forward,-rig.distance).addScaledVector(up,rig.height);
   // Keep the selected chase arm length invariant. Probing the complete line
   // from the car to the eye mistook ramps and descending landing slopes for
   // occluders: the grounded flag then retracted the camera for one source
   // frame and released it on the next. Protect only the actual eye from the
   // terrain so contact changes cannot masquerade as a zoom transition.
   desiredPosition.fromArray(clear(desiredPosition.toArray() as Vector,raceMode));
   position.copy(desiredPosition);target.copy(desiredTarget);
   // Keep the view pitch independent of suspension travel and terrain
   // clearance. Clearance can raise the eye, so preserve the selected pitch
   // angle rather than allowing the horizon to follow that correction.
   const horizontalLookDistance=Math.hypot(target.x-position.x,target.z-position.z);
   target.y=position.y+horizontalLookDistance*(rig.targetHeight-rig.height)/(rig.distance+rig.lookAhead);
   initialized=true;lastAt=now;lastCarIndex=carIndex;lastFrame=frame;lastCar.copy(car);
   // Panorama pitch is a property of the selected rig, not of any eye-height
   // correction returned by terrain clearance. Keeping it explicit prevents
   // one-angle-unit horizon hops while the car crosses banked curb pieces.
   const backgroundPitch=Math.round(Math.atan2(rig.targetHeight-rig.height,rig.distance+rig.lookAhead)*512/Math.PI)&1023;
   return {position:position.toArray() as Vector,target:target.toArray() as Vector,up:up.toArray() as Vector,fov:rig.fov,backgroundPitch};
  },
  reset(){initialized=false;lastAt=0;lastCarIndex=-1;lastFrame=-1;},
 };
}
