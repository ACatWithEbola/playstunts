import assert from 'node:assert/strict';
import {captureOriginalRaceInput} from '../lib/game/capture-race-input.ts';
const d=0x20000,base=0x40000,inputs=0x60000;
function run(fps?:10|20){
 const rate=fps??20,chunk=30*rate,memory=new Uint8Array(0x80000),v=new DataView(memory.buffer);
 const put=(o:number,n:number)=>v.setUint16(d+o,n,true);
 put(0x73b2,12000);put(0x8fd8,12000);put(0x8c26,12000);put(0xa034,1);
 put(0xa032,base/16);put(0x9c42,inputs/16);
 for(let i=0;i<12000/chunk;i++)v.setUint16(base+i*0x430+0x140,i*chunk,true);
 for(let i=0;i<12000;i++)memory[inputs+i]=i&255;
 assert.deepEqual(captureOriginalRaceInput(memory,d,123,fps),{action:'record',recorded:true});
 assert.equal(v.getUint16(d+0x73b2,true),12000-chunk+1);
 assert.equal(v.getUint16(d+0xa034,true),chunk+1);
 assert.equal(memory[inputs],chunk&255);
 assert.equal(memory[inputs+12000-chunk],123);
 for(let i=0;i<12000/chunk-1;i++)assert.equal(v.getUint16(base+i*0x430+0x140,true),i*chunk);
 return memory;
}
assert.deepEqual(run(),run(20));run(10);
console.log('Recording history shifts 300/600 frames and 40/20 checkpoints; default20 unchanged');
