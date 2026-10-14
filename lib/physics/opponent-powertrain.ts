import {opponentDecision,type OpponentDecisionState,type OpponentRouteTarget} from './opponent-decision.ts';
import {stepEngine,type EngineState,type EngineTuning} from './engine.ts';
import type {Vector} from './math.ts';
import {LEGACY_PHYSICS,uses1991Physics,type PhysicsEngineVersion} from './engine-version.ts';
/** Original opponent update through 0x734c, before grip/contact processing. */
export function opponentPowertrain(state:OpponentDecisionState,engine:EngineState,tuning:EngineTuning,playerPosition:Vector,playerCrash:number,mode:number,path:ArrayLike<number>,lookup:(entry:number,point:number)=>OpponentRouteTarget&{last:number},speedProfile:number,physicsEngine:PhysicsEngineVersion=LEGACY_PHYSICS,framesPerSecond:10|20=20){
 const modernRoute=uses1991Physics(physicsEngine);
 const decision=opponentDecision({...state,speed:engine.speed,roadSpeed:engine.roadSpeed,rearContact:engine.rearContact},playerPosition,playerCrash,mode,path,lookup,modernRoute&&framesPerSecond===10?{steering:16,speed:2,modernRoute}:{steering:8,speed:1,modernRoute});
 const updatedEngine=stepEngine({...engine,roadSpeed:decision.roadSpeed},tuning,decision.command,framesPerSecond,speedProfile,undefined,physicsEngine);
 return {decision,engine:updatedEngine};
}
