import {opponentRouteDistance} from './opponent-route-distance.ts';
import type {Vector} from './math.ts';
import {opponentPose} from './opponent-pose.ts';
import {opponentSelectTarget} from './opponent-select-target.ts';
import {opponentTargetAngle} from './opponent-target-angle.ts';
import {stepOpponentRoute,stepOpponentRouteNear,type OpponentRouteState} from './opponent-route-step.ts';
import type {OpponentControls} from './opponent-controls.ts';
import {opponentSteeringStep} from './opponent-steering-step.ts';
import {opponentEngineCommand} from './opponent-engine-command.ts';

export interface OpponentRouteTarget {midpoint:Vector;first:Vector;second:Vector;side:number;alternate?:number}
export interface OpponentDecisionState extends OpponentControls {
 contactCaller?:{frameOffset:number;pathOffset:number;incomingSI:number;incomingDI:number};targetAlternate?:number;position:Vector;rotation:Vector;sliding:number;route:OpponentRouteState;routeTarget:OpponentRouteTarget;
}
/** Supplied 0x6e70..0x7334, ending before the engine call. Lookup owns original speed context. */
export function opponentDecision(state:OpponentDecisionState,playerPosition:Vector,playerCrash:number,mode:number,path:ArrayLike<number>,lookup:(entry:number,point:number)=>OpponentRouteTarget&{last:number}){
 let route={...state.route},routeTarget={...state.routeTarget};
 let targetAlternate=state.targetAlternate;
 const retainAlternate=()=>{if(targetAlternate!==undefined&&routeTarget.alternate!==undefined)targetAlternate=routeTarget.alternate;};
 let avoidance=0,steering=state.steering;
 const contactEntryRegisters: [number,number]|undefined=state.contactCaller?[state.contactCaller.incomingSI&65535,state.contactCaller.incomingDI&65535]:undefined;
 // Historical result name: car+b7 is the initial engine-sound flag, not a physics gate.
 const active=(state.crash&255)&&!(state.roadSpeed&65535)?0:1;
 if(!(state.crash&255)){
  const pose=opponentPose(state.position,playerPosition,state.rotation);
  if(contactEntryRegisters)contactEntryRegisters[0]=opponentRouteDistance(routeTarget.midpoint,pose.position).distance&65535;
  const near=stepOpponentRouteNear(route,routeTarget.midpoint,pose.position,path,lookup);
  route=near.state;if(near.lookup){routeTarget=near.lookup;retainAlternate();}
  const selected=opponentSelectTarget(routeTarget.midpoint,routeTarget.first,routeTarget.second,pose.position,pose.player,pose.matrix,mode,playerCrash);
  avoidance=selected.avoidance;
  const {angle}=opponentTargetAngle(selected.target,pose.position,pose.matrix);
  const turned=stepOpponentRoute(route,angle,state.sliding,path,lookup);
  route=turned.state;if(turned.lookup){routeTarget=turned.lookup;retainAlternate();}
  if(contactEntryRegisters&&state.contactCaller)contactEntryRegisters[1]=(turned.lookup?state.contactCaller.pathOffset:state.contactCaller.frameOffset-26)&65535;
  steering=opponentSteeringStep(state.steering,(state.frontContact&255)?angle:0);
 }
 const engine=opponentEngineCommand(state.rearContact,state.crash,state.wheelAngle,state.roadSpeed,state.speed,routeTarget.side,mode,state.demandedGrip,state.surfaceGrip);
 const {midpoint,first,second,side}=routeTarget;
 return {...(contactEntryRegisters?{contactEntryRegisters}:{}),...(targetAlternate===undefined?{}:{targetAlternate}),route,routeTarget:{midpoint,first,second,side},avoidance,active,steering,...engine};
}
