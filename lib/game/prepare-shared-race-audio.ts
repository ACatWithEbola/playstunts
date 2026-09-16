import {allocateRawCarAudio} from './allocate-raw-car-audio.ts';
import {loadCarSoundResources} from './load-car-sound-resources.ts';
import {createRaceAudio,type RaceAudioState} from './race-audio.ts';
import type {LoadedEffectResource} from './effect-runtime.ts';
/** Allocate the opponent from the caller's original raw descriptor and banks,
 * then start player followed by opponent on the same timer/voice tables.
 * Existing resource addresses and retained driver state remain caller-owned.
 */
export function prepareSharedRaceAudio(
 before:RaceAudioState,existingResources:LoadedEffectResource[],playerHandle:number,
 descriptor:Uint8Array,nameAt:Parameters<typeof allocateRawCarAudio>[2],
 sounds:Parameters<typeof allocateRawCarAudio>[3],enabled=true,master=127,
){
 const names:string[]=[],view=new DataView(descriptor.buffer,descriptor.byteOffset,descriptor.byteLength);
 if(descriptor[6])throw Error('Shared startup requires the original unresolved descriptor');
 for(const offset of [16,20,24,28,32,36,40,44]){
  const bytes=nameAt({offset:view.getUint16(offset,true),segment:view.getUint16(offset+2,true)});
  names.push(String.fromCharCode(...bytes.slice(0,4)).replaceAll('\0',' '));
 }
 const allocated=allocateRawCarAudio(before,descriptor,nameAt,sounds);
 const loaded=loadCarSoundResources(allocated.bank,sounds.voices,names,sounds.bankAddress,sounds.voiceAddress,allocated.percussion);
 const car=allocated.cars[allocated.handle],v=new DataView(car.buffer),offset=v.getUint16(0x24,true),segment=v.getUint16(0x26,true);
 const index=(segment-sounds.voiceAddress.segment)*16+offset-sounds.voiceAddress.offset;
 const engine:LoadedEffectResource={headerOffset:0,headerSegment:0,header:new Uint8Array(),sequenceOffset:0,sequenceSegment:0,sequence:new Uint8Array(),instrumentOffset:offset,instrumentSegment:segment,instrument:sounds.voices.slice(index,index+100)};
 const resources=[...existingResources,...Object.values(loaded.resources),engine];
 const race=createRaceAudio({...before,cars:allocated.cars,timers:allocated.timers,busy:allocated.busy},resources,enabled,master);
 const initialWrites:number[][]=[];
 for(const handle of [playerHandle,allocated.handle])initialWrites.push(...race.start(handle));
 return {race,initialWrites,opponentHandle:allocated.handle,resources,bank:loaded.bank,percussion:loaded.percussion};
}
