import assert from 'node:assert/strict';
import {readPc15SampleResource} from '../lib/game/read-pc15-sample-resource.ts';
const backing=new Uint8Array(0x100020),memory=backing.subarray(16,0x100010),instrument=new Uint8Array(100);
const v=new DataView(instrument.buffer),m=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
for(const [offset,segment,length] of [[0x100,0x9000,128],[0xffd0,0x7000,65535],[0xfff7,0x7000,0xabcd],[0,0x8000,0]]){
 v.setUint16(6,offset,true);v.setUint16(8,segment,true);memory[segment*16+((offset+8)&65535)]=length&255;memory[segment*16+((offset+9)&65535)]=length>>8;
 assert.deepEqual(readPc15SampleResource(memory,instrument),{offset,segment,length});
}
assert.throws(()=>readPc15SampleResource(memory,new Uint8Array(9)));
assert.throws(()=>readPc15SampleResource(memory,new Uint8Array(100)));
v.setUint16(6,65535,true);v.setUint16(8,65535,true);assert.throws(()=>readPc15SampleResource(memory,instrument));
console.log('PC15 sample pointer/length resolves original ABI, byte-offset views and wrapped-offset inputs without mutation');
