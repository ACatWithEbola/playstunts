import {raceCameraStep,type RaceCameraCar} from './race-camera-step.ts';
import type {Vector} from './math.ts';
export interface RaceCameraState {position:Vector;previous:Vector;selected:number}
/** Race caller's shared camera stage; an absent opponent retains its camera state. */
export function stepRaceCameras(before:[RaceCameraState,RaceCameraState],cars:[RaceCameraCar,RaceCameraCar],opponentSelected:number,frame:number,trackside:Vector[],playerFlags:boolean):[RaceCameraState,RaceCameraState]{
 return [raceCameraStep(before[0].position,cars[0],frame,trackside,before[0].selected,playerFlags),
  opponentSelected&255?raceCameraStep(before[1].position,cars[1],frame,trackside,before[1].selected):before[1]];
}
