import {readRecordedPlayerRace,stepRecordedSinglePlayerRace,type RecordedPlayerRace,type RecordedRaceResources} from './recorded-single-player-race.ts';
import {readOpponentRaceState} from './read-opponent-race-state.ts';
import {writeOpponentCarState} from './write-opponent-race-state.ts';
import {writePlayerRaceState} from './write-player-race-state.ts';
import {stepTwoCarRaceFrame,type TwoCarRaceResources} from './two-car-race-frame.ts';
import {beginReplayFrame} from './begin-replay-frame.ts';
import {advanceRaceClock} from './race-clock.ts';
import {raceDrivingCaller} from '../physics/race-driving-caller.ts';
import {readContactFrameScratch,writeContactFrameScratch,writeContactFrameNeighbors,writeContactFrameOrigins} from '../physics/race-contact-scratch.ts';
import {produceRaceAudio} from './produce-race-audio.ts';
import type {RaceCameraState} from '../physics/race-cameras.ts';
import type {Vector} from '../physics/math.ts';
export interface RecordedTwoCarRace extends RecordedPlayerRace {opponent:ReturnType<typeof readOpponentRaceState>;opponentCamera:RaceCameraState}
export function readRecordedTwoCarRace(memory:Uint8Array,dataSegment:number):RecordedTwoCarRace{
 const player=readRecordedPlayerRace(memory,dataSegment),v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),d=dataSegment;
 player.player.driving.car.contactFlag=memory[d+0x8ce8];
 const opponent=readOpponentRaceState(memory,d);opponent.car.contactFlag=opponent.contact;
 return {...player,opponent,opponentCamera:{position:[0,1,2].map(i=>v.getInt16(d+0x8c0c+i*2,true)) as Vector,previous:[0,1,2].map(i=>v.getInt16(d+0x8c18+i*2,true)) as Vector,selected:memory[d+0x8eae]}};
}
/** Shared recorded caller with ordered cross-car contact effects. */
export function stepRecordedTwoCarRace(before:RecordedTwoCarRace,playerResources:RecordedRaceResources,opponentResources:TwoCarRaceResources['opponent']){
 const caller=playerResources.caller;if(!caller)throw Error('Shared race requires original caller stack context');
 const prefix=beginReplayFrame(before.memory,before.dataSegment);let memory=prefix.memory;
 if(!prefix.active||memory[before.dataSegment+0x8fc8]===0){const result=stepRecordedSinglePlayerRace(before,playerResources);return {...result,state:{...before,...result.state}};}
 const d=before.dataSegment,v=new DataView(memory.buffer),race=before.player.driving.race,car=before.player.driving.car,sp=caller.entryStackPointer;
 const registers=raceDrivingCaller(race.stats[2],caller.incomingSI,v.getUint16(d+0x9c40,true),v.getUint16(d+0xa030,true));
 const clock=advanceRaceClock({frame:race.stats[2],counter:race.abortFlag,timer:race.timer,evaluationCause:race.evaluationCause,done:before.done,mode:before.mode,crash:car.grip.crash,roadSpeed:car.engine.roadSpeed});const stats=[...race.stats];stats[2]=clock.frame;
 const player={...before.player,driving:{...before.player.driving,race:{...race,stats,abortFlag:clock.counter,timer:clock.timer},car:{...car,contactWheelAngles:readContactFrameScratch(memory,caller.stackSegment,sp-120),contactEntryRegisters:registers}}};
 const opponent={...before.opponent,car:{...before.opponent.car,contactWheelAngles:readContactFrameScratch(memory,caller.stackSegment,sp-94)}};
 const result=stepTwoCarRaceFrame({player,opponent,cameras:[before.camera,before.opponentCamera]},{audioExiting:memory[d+0x9aca],player:[playerResources.tuning,playerResources.wheels,prefix.input<<24>>24,{...playerResources.track,mode:prefix.active},clock.frame,...playerResources.navigation],trackside:playerResources.trackside,opponent:{...opponentResources,track:{...opponentResources.track,mode:prefix.active},contactCaller:{frameOffset:sp-16,pathOffset:v.getUint16(d+0x7ff4,true),incomingSI:registers[0],incomingDI:registers[1]}}});
 memory.set(writePlayerRaceState(memory.subarray(d,d+65536),before.player,result.player,result.cameras[0],clock.done),d);
 memory.set(writeOpponentCarState(memory.subarray(d+0x8cf0,d+0x8da8),before.opponent.car,result.opponent.car,result.opponent.route,result.opponent.routeTarget,result.opponent.angle,result.opponent.targetAlternate),d+0x8cf0);
 result.cameras[1].position.forEach((n,i)=>v.setInt16(d+0x8c0c+i*2,n,true));result.cameras[1].previous.forEach((n,i)=>v.setInt16(d+0x8c18+i*2,n,true));memory[d+0x8eae]=result.cameras[1].selected;memory[d+0x8eaf]=result.opponent.routeTarget.side;memory[d+0x8f14]=result.opponent.avoidance;
 for(const [index,current] of [result.player.driving.car,result.opponent.car].entries()){
  if(index===0&&car.grip.crash&&car.engine.roadSpeed===0&&car.engine.speed===0&&car.suspension.rc1.every(n=>n===0))continue;
  const bp=sp-(index?94:120);
  if(current.contactOrigins)writeContactFrameOrigins(memory,caller.stackSegment,bp,current.contactOrigins);
  if(current.contactWheelAngles)writeContactFrameScratch(memory,caller.stackSegment,bp,current.contactWheelAngles);
  if(current.contactFrontAngle!==undefined)writeContactFrameNeighbors(memory,caller.stackSegment,bp,current.contactFrontAngle,(index?opponentResources.track:playerResources.track).landmarks?current.contactLandmarkMisses:undefined);
 }
 const audio=playerResources.produceAudio?produceRaceAudio(memory,d):null;if(audio)memory=audio.memory;
 const state:RecordedTwoCarRace={...before,memory,player:result.player,opponent:result.opponent,camera:result.cameras[0],opponentCamera:result.cameras[1],done:clock.done};
 if(audio)state.player={...state.player,driving:{...state.player.driving,race:{...state.player.driving.race,audioEnabled:memory[d+0x9fea]!==0}}};
 return {state,audio:'after-effects' as const,audioRequests:audio?.requests??[],effects:result.effects,soundEvents:result.soundEvents,checkpoint:prefix.checkpoint};
}
