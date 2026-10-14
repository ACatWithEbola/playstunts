import {advanceOriginalNestedHardwareClock} from './hardware-clock-memory.ts';
/** Explicit race IRQ ownership for timed transport. Dispatching runtime ticks
 * already advance the hardware clock. Only suppressed boundaries advance here.
 * Caller must exclusively own the guard and close before handing off memory. */
export function createTimedAllocatedRaceClock(memory:()=>Uint8Array,d=0x2d1a0){
 let closed=false,guarded=false;
 if(memory()[d+0x408e])throw Error('Timed race clock cannot acquire an active IRQ guard');
 const release=()=>{
  if(!guarded)return;
  const live=memory(),view=new DataView(live.buffer,live.byteOffset,live.byteLength);
  live[d+0x408e]=0;view.setUint16(d+0x408c,0,true);guarded=false;
 };
 return {
  onHardwareTick(dispatch:boolean){
   if(closed)throw Error('Timed race clock closed');
   if(dispatch){release();return;}
   const live=memory();
   if(!guarded&&live[d+0x408e])throw Error('Timed race clock overlaps another IRQ owner');
   live[d+0x408e]=1;guarded=true;advanceOriginalNestedHardwareClock(live,d);
   if(!live[d+0x408e])guarded=false;
  },
  close(){if(closed)return;release();closed=true;},
 };
}
