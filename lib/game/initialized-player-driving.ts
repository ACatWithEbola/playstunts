import {initializePlayerRace} from '../physics/initialize-player-race.ts';
import {readReferencePose,readReferenceEngine,readReferenceGrip,readReferenceSuspension,readReferenceWheelPositions} from '../physics/reference-state.ts';
import type {PlayerDrivingState} from './player-driving-step.ts';
import type {Vector} from '../physics/math.ts';
/** Decode the supplied version's DS state; retained original bytes are explicit input. */
export function readPlayerDrivingState(memory:Uint8Array):PlayerDrivingState{
 if(memory.length!==65536)throw Error('Expected the complete original data segment');
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),b=(at:number)=>v.getUint8(at),w=(at:number)=>v.getUint16(at,true),s=(at:number)=>v.getInt16(at,true),l=(at:number)=>v.getInt32(at,true);
 const pose=readReferencePose(memory,0),engine=readReferenceEngine(memory,0),grip=readReferenceGrip(memory,0);
 const progress={status:b(0x8f11),confirmations:b(0x8f12),route:w(0x8da8),lastRoute:w(0x8daa),laps:b(0x8ced),lastPenalty:w(0xa7da),penaltyDisplay:b(0x8fbd),totalPenalty:w(0x8c30)};
 const race={crash:grip.crash,speed:engine.speed,roadSpeed:engine.roadSpeed,yaw:w(0x8c50),abortFlag:w(0x8c1e),timer:w(0x8c20),stats:Array.from({length:11},(_,i)=>w(0x8c22+i*2)),savedStats:Array.from({length:11},(_,i)=>w(0x899a+i*2)),elapsed:w(0xa034),evaluationCause:b(0x8eac),replay:!!b(0x9aca),audioEnabled:!!b(0x9fea),preserveStats:!!(b(0x8018)&4),audioHandles:[w(0x8016),w(0x86de)]};
 const particles={random:Array.from(memory.subarray(0x9f5c,0x9f62)),active:b(0x8ee0),particles:Array.from({length:24},(_,i)=>({x:l(0x8ae6+i*4),y:l(0x8b46+i*4),z:l(0x8ba6+i*4),angleX:s(0x8db4+i*2),angleZ:s(0x8de4+i*2),heading:s(0x8e14+i*2),speed:s(0x8e44+i*2),verticalSpeed:s(0x8e74+i*2),style:b(0x8ee1+i),owner:b(0x8ef9+i)}))};
 return {driving:{car:{pose:{position:pose.position,rotation:pose.rotation},engine,grip,suspension:readReferenceSuspension(memory,0),wheelPositions:readReferenceWheelPositions(memory,0)},race,particles},navigation:{progress,cache:[s(0x8dac),s(0x8dae),s(0x8db0),s(0x8db2)],guidance:{position:pose.position,rotation:pose.rotation,target:[s(0x8cc4),s(0x8cc6),s(0x8cc8)] as Vector,targetFirst:[s(0x8cca),s(0x8ccc),s(0x8cce)] as Vector,targetSecond:[s(0x8cd0),s(0x8cd2),s(0x8cd4)] as Vector,routeIndex:w(0x8c82),point:b(0x8cee),status:progress.status,previousStatus:0,crash:grip.crash,warning:b(0x8f13),confirmations:progress.confirmations,route:progress.route,lastRoute:progress.lastRoute,angle:w(0x8c80),wheelAngle:w(0x8cd6),laps:progress.laps}}};
}
/** Native shared/player initialization through 9426, before opponent setup. */
export function initializePlayerDriving(memory:Uint8Array,...args:Parameters<typeof initializePlayerRace> extends [unknown,...infer Rest]?Rest:never){
 if(memory.length!==65536)throw Error('Expected the complete original data segment');
 const data=memory.slice();data.set(initializePlayerRace(data.subarray(0x8c06,0x8f15),...args),0x8c06);
 return {data,state:readPlayerDrivingState(data)};
}

import {initializeRaceCars} from '../physics/initialize-race-cars.ts';
/** Complete shared/car/target setup, decoded for the combined player driving step. */
export function initializeRaceDriving(...args:Parameters<typeof initializeRaceCars>){
 const data=initializeRaceCars(...args);
 return {data,state:readPlayerDrivingState(data)};
}
