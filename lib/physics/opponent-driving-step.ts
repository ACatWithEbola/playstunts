import type {GripTuning} from './grip.ts';
import {opponentGripStep} from './opponent-grip-step.ts';
import {moveTrack} from './track-step.ts';
import type {LevelState} from './level-step.ts';
import type {Vector} from './math.ts';
import type {TrackGeometry} from './track-contact.ts';
/** Opponent controls through movement; race tail and shared collision events remain caller-owned. */
export function opponentDrivingStep(before:LevelState,args:Parameters<typeof opponentGripStep>[0],wheels:Vector[],track:TrackGeometry,gripTuning:GripTuning){
 const controls={...args[0],position:before.pose.position,rotation:before.pose.rotation,steering:before.grip.steeringAngle,wheelAngle:before.grip.wheelAngle,crash:before.grip.crash,sliding:before.grip.sliding,demandedGrip:before.grip.demandedGrip,surfaceGrip:before.grip.surfaceGrip,frontContact:before.grip.surfaces[0]+before.grip.surfaces[1]};
 let scratch:number[]|undefined,gripWords:[number,number]|undefined;
 const power=opponentGripStep([controls,before.engine,args[2],args[3],args[4],args[5],args[6],args[7],args[8],track.physicsEngine,track.framesPerSecond??20],before.grip,gripTuning,words=>{gripWords=words;});
 const registers=power.decision.contactEntryRegisters??before.contactEntryRegisters;
 if(gripWords&&registers)scratch=[...gripWords,...registers];
 const movement=moveTrack(before,wheels,{...track,mode:args[5]},power.engine,power.grip,power.engineRoadSpeed,scratch);
 return {...movement,decision:power.decision};
}
