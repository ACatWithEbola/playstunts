import {opponentDecision,type OpponentDecisionState,type OpponentRouteTarget} from './opponent-decision.ts';
import {stepEngine,type EngineState,type EngineTuning} from './engine.ts';
import type {Vector} from './math.ts';
/** Original opponent update through 0x734c, before grip/contact processing. */
export function opponentPowertrain(state:OpponentDecisionState,engine:EngineState,tuning:EngineTuning,playerPosition:Vector,playerCrash:number,mode:number,path:ArrayLike<number>,lookup:(entry:number,point:number)=>OpponentRouteTarget&{last:number},speedProfile:number){
 const decision=opponentDecision({...state,speed:engine.speed,roadSpeed:engine.roadSpeed,rearContact:engine.rearContact},playerPosition,playerCrash,mode,path,lookup);
 const updatedEngine=stepEngine({...engine,roadSpeed:decision.roadSpeed},tuning,decision.command,20,speedProfile);
 return {decision,engine:updatedEngine};
}
