import {prepareNativeRaceAudio} from './prepare-native-race-audio.ts';
import {createRaceMemoryAudioStream} from './race-memory-audio-stream.ts';
import type {PlayerAudioSeed} from './player-audio.ts';
import type {DrivingAudioQueueSeed} from './driving-audio-queue.ts';
import type {PlayerAudioChip} from './player-audio-stream.ts';
export type NativeAudioMemory=Parameters<typeof createRaceMemoryAudioStream>[1];
/** Retained native-preview startup over the live simulation's original queue.
 * One chip and timer/voice pool serve both cars. The host schedules PCM output.
 */
export function createNativeRaceAudioStream(seed:PlayerAudioSeed&{queue:DrivingAudioQueueSeed},cars:number[][],bank:Uint8Array,voices:Uint8Array,memory:NativeAudioMemory,chip:PlayerAudioChip,rate:number){
 const d=0x2d1a0,prepared=prepareNativeRaceAudio(seed,cars,bank,voices),race=prepared.race;
 let savedVolumes=Uint8Array.from(seed.savedVolumes);
 const initial=memory.read().slice(),v=new DataView(initial.buffer);
 for(const [offset,value] of [[0x8016,0],[0x86de,prepared.opponentHandle],[0x8a46,seed.queue.counter],[0x9332,seed.queue.read],[0x8ffc,seed.queue.write]])v.setUint16(d+offset,value,true);
 initial[d+0x8936]=seed.queue.busy;initial[d+0x9fea]=Number(seed.activeAudio);
 initial[d+0x73d8]=seed.soundFlags??0;initial[d+0x73dc]=0;
 seed.queue.records.forEach((record,index)=>initial.set(record,d+0x955e+index*34));
 memory.write(initial);
 const stream=createRaceMemoryAudioStream(race,memory,d,prepared.initialWrites,chip,rate);
 const write=(writes:number[][])=>{for(const [r,value] of writes)chip.write(r,value);};
 return {
  render:stream.render,
  snapshot:race.snapshot,
  enqueue(){stream.produce();},
  setEnabled(enabled:boolean){const result=race.setEnabled(enabled,savedVolumes);savedVolumes=Uint8Array.from(result.savedVolumes);write(result.writes);},
  impacts(flags:number,handle=0){write(race.impacts(handle,flags,memory.read()[d+0x9fea]!==0));},
  crash(handle=0){write(race.crash(handle));},
  exit(){
   const before=memory.read().slice(),mode=before[d+0x9aca];before[d+0x9aca]=1;memory.write(before);
   stream.produce();
   const next=memory.read().slice();next[d+0x9aca]=mode;memory.write(next);
  },
 };
}
