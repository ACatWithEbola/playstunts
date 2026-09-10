import {opponentTick} from './opponent-tick.ts';
import {raceCameraStep} from './race-camera-step.ts';
import type {RaceCameraState} from './race-cameras.ts';
import type {Vector} from './math.ts';
/** Opponent simulation followed by its original shared camera update. The caller advances the race clock first. */
export function opponentFrame(args:Parameters<typeof opponentTick>,camera:RaceCameraState,trackside:Vector[],cameraField9e:number){
 const driving=opponentTick(...args);
 const updatedCamera=raceCameraStep(camera.position,{position:driving.pose.position,target:driving.decision.routeTarget.midpoint,angle:driving.race.angle,routeIndex:driving.decision.route.routeIndex,field9e:cameraField9e,crash:driving.grip.crash},driving.race.raceWords[2],trackside,camera.selected);
 return {...driving,camera:updatedCamera};
}
