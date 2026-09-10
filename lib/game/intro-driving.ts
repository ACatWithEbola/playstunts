import {readOpponentCarState} from './read-opponent-race-state.ts';
import {writeOpponentCarState} from './write-opponent-race-state.ts';
import {opponentTick} from '../physics/opponent-tick.ts';
import {trackOpponentRoutePoint} from '../physics/track-route-point.ts';
import {originalIntroPath,originalIntroRoute} from './initialize-intro-scene.ts';
import type {NativeRaceData} from './native-race-session.ts';
import type {Vector} from '../physics/math.ts';
export type IntroDrivingData=Pick<NativeRaceData,'tuning'|'simulation'|'raw'|'objects'|'planes'|'walls'|'records'|'points'|'indices'>;
/** The original B3AC opponent simulation, with its special intro contact mode.
 * Input is the retained data segment after B1B6 setup, not a recorded drive.
 */
export function createOriginalIntroDriving(initial:Uint8Array,data:IntroDrivingData){
 if(initial.length!==65536)throw Error('Intro driving requires the original data segment');
 const view=new DataView(initial.buffer,initial.byteOffset,initial.byteLength),sim=new DataView(data.simulation.buffer,data.simulation.byteOffset,data.simulation.byteLength);
 let carBytes=Uint8Array.from(initial.subarray(0x8cf0,0x8da8)),previous=readOpponentCarState(carBytes,initial[0x8eaf]);
 const track={mode:2,raw:data.raw,objects:data.objects,planes:data.planes,walls:data.walls};
 const wheels=Array.from({length:4},(_,i)=>[0,1,2].map(a=>sim.getInt16(210+i*6+a*2,true)) as Vector);
 const lookup=(entry:number,point:number)=>{const target=trackOpponentRoutePoint(data.raw,originalIntroRoute,entry,point,data.records,data.points,data.objects,data.indices,initial.subarray(0x9362,0x9362+511));return {...target,midpoint:target.midpoint as Vector,first:target.first as Vector,second:target.second as Vector};};
 const context={previousAngle:previous.angle,startX:view.getInt16(0xa3e2+2,true),startZ:view.getInt16(0xa796+56,true),startAngle:view.getInt16(0x9b2a,true),raceWords:Array.from({length:11},(_,i)=>view.getUint16(0x8c22+i*2,true)),savedRaceWords:Array.from({length:11},(_,i)=>view.getUint16(0x899a+i*2,true)),timeAdjustment:view.getUint16(0xa034,true),flags:initial[0x8018]};
 return {get car(){return previous.car;},get bytes(){return carBytes;},tick(){
  const car=previous.car,controls={position:car.pose.position,rotation:car.pose.rotation,steering:car.grip.steeringAngle,frontContact:car.grip.surfaces[0]+car.grip.surfaces[1],rearContact:car.engine.rearContact,crash:car.grip.crash,wheelAngle:car.grip.wheelAngle,roadSpeed:car.engine.roadSpeed,speed:car.engine.speed,demandedGrip:car.grip.demandedGrip,surfaceGrip:car.grip.surfaceGrip,sliding:car.grip.sliding,route:previous.route,routeTarget:previous.routeTarget,targetAlternate:previous.targetAlternate};
  const result=opponentTick([car,[controls,car.engine,data.tuning,[0,0,0],0,2,originalIntroPath,lookup,200],wheels,track,data.tuning],context);
  carBytes=writeOpponentCarState(carBytes,car,result,result.decision.route,result.decision.routeTarget,result.race.angle,result.decision.targetAlternate);
  previous={...readOpponentCarState(carBytes,result.decision.routeTarget.side),car:result};context.previousAngle=result.race.angle;context.raceWords=result.race.raceWords;context.savedRaceWords=result.race.savedRaceWords;
  return previous.car;
 }};
}
