/** Original race initializer prefix 9178..91c8, including 142b4 input/audio-queue reset.
 * Caller owns the original memory image and data-segment base.
 */
import {raceSnapshotSize} from './versioned-race-snapshot.ts';
import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
export function resetRaceSession(before:Uint8Array,dataSegment:number,mode:number,framesPerSecond:10|20=20,engine?:PhysicsEngineVersion){
 const out=before.slice(),v=new DataView(out.buffer,out.byteOffset,out.byteLength),at=(offset:number)=>dataSegment+offset;
 if(dataSegment<0||at(65536)>out.length)throw Error('Original data segment is outside memory');
 if((mode&65535)===65535){
  v.setUint16(at(0xa034),0,true);
  const checkpoints=v.getUint16(at(0xa030),true)+v.getUint16(at(0xa032),true)*16;
  // Original MS91 clears20 slots at both cadences. Native experimental10Hz
  // allocates40 slots; clear its extra slots too so old checkpoint markers
  // cannot survive a fresh start. This is storage hygiene, not physics parity.
  for(let i=0;i<12000/(30*framesPerSecond);i++){
   const size=raceSnapshotSize(engine),address=checkpoints+(size===1120?0x3f4:0x3c4)+i*size;
   if(address>=out.length)throw Error('Original replay checkpoint is outside memory');
   out[address]=0;
  }
 }
 out[at(0x90a0)]=1;out[at(0x9b43)]=2;
 for(const offset of [0x73b2,0x93dc])v.setUint16(at(offset),0,true);
 for(const offset of [0x8ff4,0x7fee])out[at(offset)]=0;
 return out;
}
