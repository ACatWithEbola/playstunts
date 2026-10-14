import assert from 'node:assert/strict';
import {advanceOriginalNestedHardwareClock} from '../lib/game/hardware-clock-memory.ts';
const d=0x2d1a0;
for(const disabled of [false,true])for(const nested of [0,32767,65535]){
 const memory=new Uint8Array(0x100000),v=new DataView(memory.buffer);
 memory[d+0x408e]=1;memory[d+0x4090]=Number(disabled);
 v.setUint16(d+0x4088,5,true);v.setUint16(d+0x4086,5,true);v.setUint32(d+0x407a,20,true);
 v.setUint16(d+0x408c,nested,true);
 assert.equal(advanceOriginalNestedHardwareClock(memory,d),!disabled);
 assert.equal(v.getUint16(d+0x4088,true),4);assert.equal(v.getUint32(d+0x407a,true),disabled?20:21);
 const next=disabled?0:(nested+1)&65535;
 assert.equal(v.getUint16(d+0x408c,true),next);
 assert.equal(v.getUint16(d+0x408a,true),!disabled&&(next<<16>>16)>0?next:0);
 assert.equal(memory[d+0x408e],disabled?0:1,'Original disabled-callback IRQ follows shared guard cleanup');
}
console.log('Nested hardware counters match original guarded IRQ case, retain outer guard, honor callback disable and signed nesting overflow/high-water semantics');
