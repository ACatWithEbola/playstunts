import {restoreRecordedPlayerRace, stepRecordedSinglePlayerRace, type RecordedPlayerRace, type RecordedRaceResources} from './recorded-single-player-race.ts';
import {raceDrivingCaller} from '../physics/race-driving-caller.ts';
import type {PhysicsEngineVersion} from '../physics/engine-version.ts';

/** Original 167db..16843 seek, excluding progress painting and its wait.
 * Resource preparation must supply actual caller contact/route scratch; checkpoint
 * decoding alone does not reconstruct that transient state. Audio requests are
 * delivered in frame order to the host, as in the normal recorded race wrapper.
 */
export function seekRecordedPlayerRace(
 before:RecordedPlayerRace,
 target:number,
 initialize:Parameters<typeof restoreRecordedPlayerRace>[2],
 prepare:(state:RecordedPlayerRace,remaining:number)=>RecordedRaceResources,
 onFrame?:(result:ReturnType<typeof stepRecordedSinglePlayerRace>)=>void,
 framesPerSecond:10|20=20,
 engine?:PhysicsEngineVersion,
){
 const restored=restoreRecordedPlayerRace(before,target,initialize,framesPerSecond,engine);
 let state=restored.state;
 const d=state.dataSegment;
 new DataView(state.memory.buffer,state.memory.byteOffset,state.memory.byteLength).setUint16(d+0x73b2,target,true);
 let remaining=(target-state.player.driving.race.stats[2])&65535,frames=0;
 while(state.player.driving.race.stats[2]!==target){
  const resources=prepare(state,remaining);
  if((resources.track.framesPerSecond??20)!==framesPerSecond)throw Error('Seek and simulation cadence must match');
  const v=new DataView(state.memory.buffer,state.memory.byteOffset,state.memory.byteLength);
  state.player.driving.car.contactEntryRegisters=raceDrivingCaller(state.player.driving.race.stats[2],remaining,v.getUint16(d+0x9c40,true),v.getUint16(d+0xa030,true));
  const result=stepRecordedSinglePlayerRace(state,resources.caller?{...resources,caller:{...resources.caller,incomingSI:remaining}}:resources);
  state=result.state;remaining=(remaining-1)&65535;frames++;
  onFrame?.(result);
 }
 return {state,checkpoint:restored.checkpoint,frames};
}
