import {opponentSteeringStep} from './opponent-steering-step.ts';
import {opponentEngineCommand} from './opponent-engine-command.ts';

export interface OpponentControls {
 steering:number;frontContact:number;rearContact:number;crash:number;
 wheelAngle:number;roadSpeed:number;speed:number;demandedGrip:number;surfaceGrip:number;
}
/** Supplied DOS 0x725d..0x7334: contact-gated steering and engine input. */
export function opponentControls(state:OpponentControls,requestedAngle:number,targetByte:number,mode:number){
 const steering=opponentSteeringStep(state.steering,(state.frontContact&255)?requestedAngle:0);
 const engine=opponentEngineCommand(state.rearContact,state.crash,state.wheelAngle,state.roadSpeed,state.speed,targetByte,mode,state.demandedGrip,state.surfaceGrip);
 return {steering,...engine};
}
