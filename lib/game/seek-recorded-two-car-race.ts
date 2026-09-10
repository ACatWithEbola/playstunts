import {restoreReplayCheckpoint} from './restore-replay-checkpoint.ts';
import {readRecordedTwoCarRace,stepRecordedTwoCarRace,type RecordedTwoCarRace} from './recorded-two-car-race.ts';
/** Original seek caller with both cars restored and replayed together. */
export function seekRecordedTwoCarRace(before:RecordedTwoCarRace,target:number,initialize:Parameters<typeof restoreReplayCheckpoint>[3],prepare:(state:RecordedTwoCarRace,remaining:number)=>[Parameters<typeof stepRecordedTwoCarRace>[1],Parameters<typeof stepRecordedTwoCarRace>[2]],onFrame?:(result:ReturnType<typeof stepRecordedTwoCarRace>)=>void){
 const restored=restoreReplayCheckpoint(before.memory,before.dataSegment,target,initialize);let state=readRecordedTwoCarRace(restored.memory,before.dataSegment);
 new DataView(state.memory.buffer,state.memory.byteOffset,state.memory.byteLength).setUint16(state.dataSegment+0x73b2,target,true);
 let remaining=(target-state.player.driving.race.stats[2])&65535,frames=0;
 while(state.player.driving.race.stats[2]!==target){
  const [player,opponent]=prepare(state,remaining);if(!player.caller)throw Error('Two-car seeking requires the nested original caller stack');
  const result=stepRecordedTwoCarRace(state,{...player,caller:{...player.caller,incomingSI:remaining}},opponent);state=result.state;remaining=(remaining-1)&65535;frames++;onFrame?.(result);
 }
 return {state,checkpoint:restored.checkpoint,frames};
}
