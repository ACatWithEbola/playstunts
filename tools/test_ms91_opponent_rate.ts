import assert from 'node:assert/strict';
import {opponentPowertrain} from '../lib/physics/opponent-powertrain.ts';
import {stepEngine,type EngineState,type EngineTuning} from '../lib/physics/engine.ts';
import type {OpponentDecisionState} from '../lib/physics/opponent-decision.ts';
import {opponentSteeringStep} from '../lib/physics/opponent-steering-step.ts';
import {opponentEngineCommand} from '../lib/physics/opponent-engine-command.ts';
import {opponentDecision} from '../lib/physics/opponent-decision.ts';
import {opponentGripStep} from '../lib/physics/opponent-grip-step.ts';
import {stepGrip,type GripState} from '../lib/physics/grip.ts';
import {opponentTargetAngle} from '../lib/physics/opponent-target-angle.ts';
const engine:EngineState={speed:10000,roadSpeed:10000,lastSpeed:10000,speedDiff:0,rpm:2000,lastRPM:2000,gear:1,ratio:24576,ratioHigh:96,gravity:0,rearContact:2,allContact:4,automatic:0,shifting:0,shiftTimer:0,limiter:0,knobX:0,knobY:0,targetX:0,targetY:0,accelerating:0,braking:0};
const tuning:EngineTuning={gears:5,mass:1000,braking:40,idleRPM:900,downshiftRPM:1800,upshiftRPM:6500,maxRPM:9000,gearRatios:Array(7).fill(24576),gearKnobPoints:Array.from({length:7},()=>[0,0]),aeroResistance:0,idleTorque:100,torqueCurve:Array(104).fill(100)};
const state:OpponentDecisionState={position:[0,0,0],rotation:[0,0,0],steering:0,frontContact:2,rearContact:2,crash:1,wheelAngle:0,roadSpeed:10000,speed:10000,demandedGrip:0,surfaceGrip:0,sliding:0,route:{routeIndex:0,point:0,completed:0},routeTarget:{midpoint:[0,0,0],first:[0,0,0],second:[0,0,0],side:0}};
const lookup=()=>{throw Error('Crashed opponent must not request a route target');};
const run=(fps?:10|20)=>opponentPowertrain(state,engine,tuning,[0,0,0],0,0,[],lookup,200,'ms-1991',fps);
assert.deepEqual(run(),run(20));
for(const fps of [10,20] as const){
  const result=run(fps);
  assert.equal(result.decision.command,2);
  assert.deepEqual(result.engine,stepEngine({...engine,roadSpeed:result.decision.roadSpeed},tuning,2,fps,200,undefined,'ms-1991'));
}
assert.notDeepEqual(run(10).engine,run(20).engine);
console.log('Opponent powertrain uses explicit cadence and preserves default 20 Hz');
// A public CHERRIS replay reached an airborne opponent's wall-retry branch.
// Airborne grip does not write contact locals; the preceding engine call does.
// Dropping those words left suspension distances undefined and retried forever.
for(const physicsEngine of ['ms-1990','ms-1991'] as const)for(const fps of [10,20] as const)for(const allContact of [0,4]){
 const motor={...engine,allContact,rearContact:allContact?2:0};
 const grip:GripState={speed:motor.speed,roadSpeed:motor.roadSpeed,steeringAngle:0,wheelAngle:0,spin:0,frontWheelAngle:0,slip:0,demandedGrip:0,surfaceGrip:0,allContact,surfaces:Array(4).fill(allContact?1:0),sliding:0,crash:1,soundFlags:0,yaw:0,roll:0};
 const controls={...state,frontContact:allContact?2:0,rearContact:motor.rearContact};
 const args:Parameters<typeof opponentPowertrain>=[controls,motor,tuning,[0,0,0],0,0,[],lookup,200,physicsEngine,fps];
 const before=structuredClone({controls,motor,grip});
 const power=opponentPowertrain(...args),actual:[number,number][]=[],expected:[number,number][]=[];
 let engineWords:[number,number]|undefined;
 stepEngine({...motor,roadSpeed:power.decision.roadSpeed},tuning,power.decision.command,fps,200,words=>{engineWords=words;},physicsEngine);
 assert.ok(engineWords);expected.push(engineWords);
 const gripTuning={grip:200,surfaceGrip:Array(8).fill(256)};
 const expectedGrip=stepGrip({...grip,soundFlags:power.decision.active,speed:power.engine.speed,roadSpeed:power.engine.roadSpeed,allContact:power.engine.allContact,steeringAngle:power.decision.steering,wheelAngle:power.decision.wheelAngle},gripTuning,false,0,words=>expected.push(words),physicsEngine);
 const result=opponentGripStep(args,grip,gripTuning,words=>actual.push(words));
 assert.deepEqual(actual,expected,'Contact inherits engine locals until grounded grip overwrites them');
 assert.equal(actual.length,allContact?2:1,'Airborne contact must still receive the engine-call locals');
 assert.deepEqual(result.grip,expectedGrip,'Restoring scratch must not change grip or powertrain arithmetic');
 assert.deepEqual({controls,motor,grip},before,'Previous-frame inputs stay unchanged');
}
console.log('Airborne and grounded opponent contact locals retained in both editions at both rates');
// Exercise a driving opponent too; the original fixture above only covers its
// crash/braking branch and cannot establish route-following cadence behavior.
const active={...state,crash:0,routeTarget:{...state.routeTarget,midpoint:[0,0,1000] as [number,number,number]}};
const target=()=>({...active.routeTarget,last:0});
const drive=(fps?:10|20)=>opponentPowertrain(active,engine,tuning,[2000,0,2000],0,0,[0],target,200,'ms-1991',fps);
assert.deepEqual(drive(),drive(20));
for(const fps of [10,20] as const){
 const result=drive(fps);
 assert.deepEqual(result.engine,stepEngine({...engine,roadSpeed:result.decision.roadSpeed},tuning,result.decision.command,fps,200,undefined,'ms-1991'));
}
console.log('Active route-following opponent also propagates cadence to the engine');
assert.equal(opponentSteeringStep(0,-11),-8);
assert.equal(opponentSteeringStep(0,-11,16),-11);
for(const current of [-65,-16,0,16,65])for(const target of [-32768,-65,-11,0,11,65,32767])assert.equal(opponentSteeringStep(current,target),opponentSteeringStep(current,target,8));
const coast=(speed:number,step:1|2)=>opponentEngineCommand(2,0,1,speed,speed,0,0,0,0,step);
assert.equal(coast(1023,2).roadSpeed,0);assert.equal(coast(1023,2).wheelAngle,0);
assert.equal(coast(1024,2).roadSpeed,0);assert.equal(coast(1024,2).wheelAngle,1);
assert.equal(coast(1025,2).roadSpeed,1);
assert.equal(coast(1025,1).roadSpeed,513);
console.log('Opponent10 Hz steering/coasting steps scale16/2; default8/1 unchanged');
const lateral={...active,position:[0,0,0] as [number,number,number],rotation:[0,0,0] as [number,number,number],routeTarget:{midpoint:[1000,-1,0] as [number,number,number],first:[1000,-1,0] as [number,number,number],second:[1000,-1,0] as [number,number,number],side:40}};
let lookups=0;const next=()=>{lookups++;return {midpoint:[0,-1,1000] as [number,number,number],first:[0,-1,1000] as [number,number,number],second:[0,-1,1000] as [number,number,number],side:115,last:0};};
const oldDecision=opponentDecision(lateral,[2000,0,2000],0,0,[0],next);
assert.equal(lookups,0);assert.equal(oldDecision.routeTarget.side,40);
const modernDecision=opponentDecision(lateral,[2000,0,2000],0,0,[0],next,{steering:8,speed:1,modernRoute:true});
assert.equal(lookups,1);assert.equal(modernDecision.routeTarget.side,115);assert.equal(modernDecision.route.point,1);
lookups=0;
const coastingDecision=opponentDecision({...lateral,wheelAngle:1},[2000,0,2000],0,0,[0],next,{steering:8,speed:1,modernRoute:true});
assert.equal(lookups,0);assert.equal(coastingDecision.routeTarget.side,40,'Velocity heading offset suppresses the extra forced advance');
lookups=0;
const beforeLateral=structuredClone(lateral);
const stubbornTarget=()=>{lookups++;return {...lateral.routeTarget,last:0};};
const bounded=opponentDecision(lateral,[2000,0,2000],0,0,[0],stubbornTarget,{steering:8,speed:1,modernRoute:true});
assert.equal(lookups,1,'A still-lateral replacement must not cause an unbounded route advance');
assert.equal(bounded.route.point,1);
assert.deepEqual(lateral,beforeLateral,'Route recomputation must not modify the previous frame');
lookups=0;
opponentDecision(lateral,[2000,0,2000],0,2,[0],stubbornTarget,{steering:8,speed:1,modernRoute:true});
assert.equal(lookups,0,'Introduction mode suppresses the modern extra forced advance');
const identity=[16384,0,0,0,16384,0,0,0,16384];
assert.equal(opponentTargetAngle([100,-1,100],[0,500,0],identity).local[1],-501);
assert.equal(opponentTargetAngle([100,-1,100],[0,500,0],identity,true).local[1],0);
console.log('Modern forced-route recomputation and unspecified-height handling pass; legacy route and target defaults preserved');
