import {resolveReplayCadence,type ReplayCadence} from './replay-cadence.ts';
import {raceCheckpointStorageBytes} from './versioned-race-snapshot.ts';
import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
/** Verify the live checkpoint pointer against its resident allocator block.
 * Logical session cadence is not evidence of retained physical capacity. */
export function hasReplayCheckpointCapacity(memory:Uint8Array,d:number,rate:ReplayCadence,mode:'mcga'|'cga'|'tandy'|'ega'='mcga',engine?:PhysicsEngineVersion){
 const required=raceCheckpointStorageBytes(resolveReplayCadence(rate),engine);
 if(!Number.isInteger(d)||d<0||d+65536>memory.length)return false;
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(at:number)=>view.getUint16(d+at,true);
 const pointer=0xa030+{mcga:0,cga:0x5e0,tandy:0x620,ega:0x45c}[mode],address=word(pointer)+word(pointer+2)*16;
 const first=word(0x4b12),last=word(0x4b14);
 if(last<first||last+18>65536||(last-first)%18!==0)return false;
 for(let at=first;at<=last;at+=18){
  if(word(at+16)!==2)continue;
  const base=word(at+14)*16,end=base+word(at+12)*16;
  if(base<=address&&address<end)return address+required<=end&&end<=memory.length;
 }
 return false;
}
