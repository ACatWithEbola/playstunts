/** Combined native simulation for horizontal surfaces only.
 * The caller must resolve each proposed wheel against track geometry.
 * This is a validation stage, not a substitute for sloped/stunt collisions.
 */
import { stepEngine,type EngineState,type EngineTuning } from './engine.ts';
import { stepSteering } from './steering.ts';
import { stepGrip,type GripState,type GripTuning } from './grip.ts';
import { proposeWheels,reconstructPose,horizontalWheelMotion } from './chassis.ts';
import { horizontalContact,type WheelSuspension } from './contact.ts';
import { vecTransform,type Vector } from './math.ts';
import { rotateZXY } from './rotation.ts';
export interface LevelState {pose:{position:Vector;rotation:Vector};engine:EngineState;grip:GripState;suspension:WheelSuspension;wheelPositions?:Vector[];contactWheelAngles?:number[];contactOrigins?:Vector[];contactEntryRegisters?:[number,number];contactFlag?:number;contactOther?:import('./race-car-contact.ts').RaceContactCar;contactCrashOther?:boolean;contactFrontAngle?:number;contactLandmarkMisses?:number}
export function stepLevel(before:LevelState,tuning:EngineTuning&GripTuning,wheels:Vector[],input:number,resolve:(point:Vector,index:number)=>{height:number;surface:number},fps:10|20=20):LevelState {
 let engine=stepEngine(before.engine,tuning,input,fps);
 const steeringAngle=stepSteering(before.grip.steeringAngle,engine.roadSpeed,((input>>2)&3) as 0|1|2|3,fps);
 // Original player_op at 0x9833 resets per-frame sound requests before grip.
 const grip=stepGrip({...before.grip,soundFlags:before.grip.crash&&before.engine.roadSpeed===0?0:1,speed:engine.speed,roadSpeed:engine.roadSpeed,steeringAngle},tuning);
 const rotation:Vector=[grip.yaw,before.pose.rotation[1],before.pose.rotation[2]];
 const chassis={...before.pose,rotation,...grip,suspension:before.suspension.rc2};
 const proposed=proposeWheels(chassis,wheels,fps);
 const contact=horizontalContact(proposed,before.suspension,rotation,proposed.map(resolve),fps,{origins:proposeWheels({...chassis,roadSpeed:0},wheels,fps),alongPlane:horizontalWheelMotion(chassis,fps)});
 const pose=reconstructPose(contact.centres);
 const rear=contact.surfaces[2]+contact.surfaces[3],all=contact.surfaces.reduce((sum,s)=>sum+s,0);
 const gravity=rotation[1]||rotation[2]?-vecTransform([0,0,130],rotateZXY(-rotation[2],-rotation[1],-rotation[0]))[1]:0;
 engine={...engine,speed:grip.speed,roadSpeed:grip.roadSpeed,rearContact:rear,allContact:all,gravity};
 return {pose,engine,grip:{...grip,yaw:pose.rotation[0],roll:pose.rotation[2],surfaces:contact.surfaces,allContact:all},suspension:contact.suspension,wheelPositions:contact.wheelPositions};
}
