import assert from 'node:assert/strict';
import {captureOriginalRaceInput} from '../lib/game/capture-race-input.ts';
import {raceSnapshotSize} from '../lib/game/versioned-race-snapshot.ts';
for(const engine of ['ms-1990','ms-1991'] as const)for(const rate of [10,20] as const){
 const d=0x20000,bank=0x50000,inputs=0x70000,memory=new Uint8Array(0x100000),v=new DataView(memory.buffer);
 const put=(at:number,value:number)=>v.setUint16(d+at,value,true),get=(at:number)=>v.getUint16(d+at,true);
 const chunk=30*rate,slots=12000/chunk,size=raceSnapshotSize(engine);
 put(0xa030,0);put(0xa032,bank/16);put(0x9c40,0);put(0x9c42,inputs/16);
 put(0x73b2,12000);put(0x8fd8,12000);put(0x8c26,12000);memory[d+0xa34e]=1;
 for(let slot=0;slot<slots;slot++){
  for(let byte=0;byte<size;byte++)memory[bank+slot*size+byte]=(slot*17+byte*3)&255;
  v.setUint16(bank+slot*size+0x140,slot*chunk,true);
 }
 memory.fill(0xa5,bank+slots*size,bank+slots*size+48);
 for(let i=0;i<12000;i++)memory[inputs+i]=(i*7)&255;
 const before=memory.slice();
 assert.deepEqual(captureOriginalRaceInput(memory,d,0x39,rate,engine),{action:'record',recorded:true});
 for(let slot=0;slot<slots-1;slot++){
  const expected=before.slice(bank+(slot+1)*size,bank+(slot+2)*size);
  new DataView(expected.buffer).setUint16(0x140,slot*chunk,true);
  assert.deepEqual(memory.slice(bank+slot*size,bank+(slot+1)*size),expected,'Entire checkpoint including both modern body caches');
 }
 assert.deepEqual(memory.slice(bank+slots*size,bank+slots*size+48),before.slice(bank+slots*size,bank+slots*size+48),'Live cache tail untouched');
 assert.deepEqual(memory.slice(inputs,inputs+12000-chunk),before.slice(inputs+chunk,inputs+12000));
 assert.equal(memory[inputs+12000-chunk],0x39);
 assert.equal(get(0x73b2),12000-chunk+1);assert.equal(get(0x8fd8),12000-chunk+1);
 assert.equal(get(0xa034),chunk);assert.equal(get(0x8c26),12000-chunk);
 if(engine==='ms-1990'){
  const implicit=before.slice();captureOriginalRaceInput(implicit,d,0x39,rate);
  assert.deepEqual(implicit,memory,'Omitted version preserves legacy bytes');
 }
 console.log(JSON.stringify({engine,rate,checkpointBytes:size,checkpointsCopied:slots-1,pass:true}));
}
