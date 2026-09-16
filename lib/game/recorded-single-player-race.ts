import {crashFrameSounds,type RaceFrameSound} from './race-frame-sounds.ts';
import {originalMovementAudioCall} from './movement-audio-call.ts';
import {readRaceContactScratch,writeRaceContactScratch,writeRaceContactNeighbors,writeContactFrameOrigins} from '../physics/race-contact-scratch.ts';
import {raceDrivingCaller} from '../physics/race-driving-caller.ts';
import {produceRaceAudioInPlace,type RaceAudioRequest} from './produce-race-audio.ts';
import {restoreReplayCheckpoint} from './restore-replay-checkpoint.ts';
import {readPlayerDrivingState} from './initialized-player-driving.ts';
import type {Vector} from '../physics/math.ts';
import {beginReplayFrame} from './begin-replay-frame.ts';
import {advanceRaceClock} from './race-clock.ts';
import {idleRaceStep} from './idle-race-step.ts';
import {stepSinglePlayerRaceTick} from './single-player-race-tick.ts';
import {stepPlayerDriving,type PlayerDrivingState} from './player-driving-step.ts';
import {writePlayerRaceState} from './write-player-race-state.ts';
import type {RaceCameraState} from '../physics/race-cameras.ts';
export interface RecordedPlayerRace {memory:Uint8Array;dataSegment:number;player:PlayerDrivingState;camera:RaceCameraState;done:number;mode:number}
/** Decode persistent race state after checkpoint restoration. Caller stack/contact scratch remains explicit input to driving. */
export function readRecordedPlayerRace(memory:Uint8Array,dataSegment:number):RecordedPlayerRace{
 if(!Number.isInteger(dataSegment)||dataSegment<0||dataSegment+65536>memory.length)throw Error('Original data segment is outside memory');
 const data=memory.subarray(dataSegment,dataSegment+65536),v=new DataView(data.buffer,data.byteOffset,data.byteLength);
 return {memory,dataSegment,player:readPlayerDrivingState(data),camera:{position:[0,1,2].map(a=>v.getInt16(0x8c06+a*2,true)) as Vector,previous:[0,1,2].map(a=>v.getInt16(0x8c12+a*2,true)) as Vector,selected:data[0x8ead]},done:data[0x8ff4],mode:data[0xa3c2]};
}
/** Restore persistent memory and decode it together so a caller cannot accidentally keep the pre-seek car state. */
export function restoreRecordedPlayerRace(before:RecordedPlayerRace,target:number,initialize:Parameters<typeof restoreReplayCheckpoint>[3]){
 const restored=restoreReplayCheckpoint(before.memory,before.dataSegment,target,initialize);
 return {state:readRecordedPlayerRace(restored.memory,before.dataSegment),checkpoint:restored.checkpoint};
}
export interface RecordedRaceCaller {stackSegment:number;entryStackPointer:number;incomingSI:number}
export interface RecordedRaceResources {caller?:RecordedRaceCaller;produceAudio?:boolean;trackside:Parameters<typeof stepSinglePlayerRaceTick>[1];tuning:Parameters<typeof stepPlayerDriving>[1];wheels:Parameters<typeof stepPlayerDriving>[2];track:Parameters<typeof stepPlayerDriving>[4];navigation:Parameters<typeof stepPlayerDriving> extends [unknown,unknown,unknown,unknown,unknown,unknown,...infer Rest]?Rest:never}
/** Original single-player caller order, with audio execution returned to its driver. */
export function stepRecordedSinglePlayerRace(before:RecordedPlayerRace,resources:RecordedRaceResources){
 const prefix=beginReplayFrame(before.memory,before.dataSegment);const {memory}=prefix;
 // Contact physics reads DS8eab, not the replay-control mode at DSa3c2.
 const track={...resources.track,mode:prefix.active};
 let player=before.player,camera=before.camera,done=before.done,carUpdated=false;
 if(resources.caller){
  const caller=resources.caller,v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),d=before.dataSegment;
  player={...player,driving:{...player.driving,car:{...player.driving.car,
   contactWheelAngles:readRaceContactScratch(memory,caller.stackSegment,caller.entryStackPointer),
   contactEntryRegisters:raceDrivingCaller(player.driving.race.stats[2],caller.incomingSI,v.getUint16(d+0x9c40,true),v.getUint16(d+0xa030,true)),
  }}};
 }
 const audioRequests:RaceAudioRequest[]=[];
 const produce=()=>{
  const result=produceRaceAudioInPlace(memory,before.dataSegment);audioRequests.push(...result.requests);
  player={...player,driving:{...player.driving,race:{...player.driving.race,audioEnabled:memory[before.dataSegment+0x9fea]!==0}}};
 };
 let audio:'before-player'|'after-effects'|null=null,effects:ReturnType<typeof stepPlayerDriving>['effects']=[];
 if(prefix.active){
  const result=stepSinglePlayerRaceTick({player,camera,done,mode:before.mode},resources.trackside,resources.tuning,resources.wheels,prefix.input<<24>>24,track,...resources.navigation);
  ({player,camera,done}=result);effects=result.player.effects;carUpdated=true;audio='after-effects';
 }else{
  const race=player.driving.race,car=player.driving.car;
  const clock=advanceRaceClock({frame:race.stats[2],counter:race.abortFlag,timer:race.timer,evaluationCause:race.evaluationCause,done,mode:before.mode,crash:car.grip.crash,roadSpeed:car.engine.roadSpeed});
  const stats=[...race.stats];stats[2]=clock.frame;done=clock.done;
  player={...player,driving:{...player.driving,race:{...race,stats,abortFlag:clock.counter,timer:clock.timer}}};
  const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),d=before.dataSegment,start=resources.navigation[6];
  const idle=idleRaceStep({mode:before.mode,phase:memory[d+0x7fee],radius:view.getUint16(d+0x93dc,true),position:car.pose.position,speed:car.engine.speed,startX:start.x,startZ:start.z,startAngle:start.angle});
  memory[d+0x7fee]=idle.phase;view.setUint16(d+0x93dc,idle.radius,true);if(idle.audio){audio='before-player';if(resources.produceAudio)produce();}
  if(idle.command!==null){const result=stepPlayerDriving(player,resources.tuning,resources.wheels,idle.command,track,clock.frame,...resources.navigation);player=result;effects=result.effects;carUpdated=true;}
 }
 memory.set(writePlayerRaceState(memory.subarray(before.dataSegment,before.dataSegment+65536),before.player,player,camera,done,carUpdated),before.dataSegment);
 const originalCar=before.player.driving.car;
 const contactCalled=carUpdated&&!(originalCar.grip.crash&&originalCar.engine.roadSpeed===0&&originalCar.engine.speed===0&&originalCar.suspension.rc1.every(n=>n===0));
 if(resources.caller&&contactCalled&&player.driving.car.contactWheelAngles){
  const {stackSegment,entryStackPointer}=resources.caller;
  if(player.driving.car.contactOrigins)writeContactFrameOrigins(memory,stackSegment,entryStackPointer-120,player.driving.car.contactOrigins);
  writeRaceContactScratch(memory,stackSegment,entryStackPointer,player.driving.car.contactWheelAngles);
  if(player.driving.car.contactFrontAngle!==undefined)writeRaceContactNeighbors(memory,stackSegment,entryStackPointer,player.driving.car.contactFrontAngle,track.landmarks?player.driving.car.contactLandmarkMisses:undefined);
 }
 // AA92 is called from the completed movement routine (8964), before
 // the shared A670 producer can change the active-audio flag.
 const impactAudio=contactCalled?originalMovementAudioCall(prefix.active,memory[before.dataSegment+0x9aca],0,player.driving.car.grip.soundFlags,player.driving.race.audioHandles,memory[before.dataSegment+0x9fea]):null;
 const soundEvents:RaceFrameSound[]=[...crashFrameSounds(effects),...(impactAudio?[{kind:'impact' as const,...impactAudio}]:[])];
 if(audio==='after-effects'&&resources.produceAudio)produce();
 return {state:{...before,memory,player,camera,done},audio,audioRequests,effects,impactAudio,soundEvents,checkpoint:prefix.checkpoint};
}
