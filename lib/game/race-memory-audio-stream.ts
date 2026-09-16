import {createAudioRuntimeStream,type PlayerAudioChip} from './player-audio-stream.ts';
import {produceRaceAudioInPlace} from './produce-race-audio.ts';
import {tickRaceAudioMemory} from './consume-race-audio.ts';
import type {createRaceAudio} from './race-audio.ts';
/** One sample-aligned hardware clock over the race's actual queue memory.
 * Read at each IRQ boundary: simulation frames may have replaced the memory
 * between render calls. Commit the consumer's updated counters immediately.
 */
export function createRaceMemoryAudioStream(
 race:ReturnType<typeof createRaceAudio>,
 memory:{read():Uint8Array;write(next:Uint8Array):void;stackMatches():boolean},
 dataSegment:number,initialWrites:number[][],chip:PlayerAudioChip,sampleRate:number,
){
 const stream=createAudioRuntimeStream({initialWrites,tick(){
  const result=tickRaceAudioMemory(memory.read(),dataSegment,memory.stackMatches(),race);
  memory.write(result.memory);return result.writes;
 }},chip,sampleRate);
 return {...stream,
  /** Called after a simulation frame has written the original car/view fields.
   * Publish the producer memory before the next independently timed IRQ.
   */
  produce(){
   const current=memory.read(),result=produceRaceAudioInPlace(current,dataSegment);
   const view=new DataView(current.buffer,current.byteOffset,current.byteLength);
   const flags=race.snapshot().soundFlags;
   flags[view.getUint16(dataSegment+0x8016,true)]=current[dataSegment+0x73d8];
   if(current[dataSegment+0x8fc8])flags[view.getUint16(dataSegment+0x86de,true)]=current[dataSegment+0x73dc];
   const writes=race.dispatchRequests(result.requests,flags);
   memory.write(current);
   for(const [register,value] of writes)chip.write(register,value);
  },
 };
}
