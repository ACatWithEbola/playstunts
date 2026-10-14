import assert from 'node:assert/strict';
import {loadedPc15Generation} from '../lib/game/loaded-pc15-generation.ts';
const memory=new Uint8Array(0x100000),d=0x60000;
for(const [slots,generation] of [[5,'ms-1990'],[7,'ms-1991']] as const){
 memory[d+0x9fe4]=slots;const before=memory.slice();
 assert.equal(loadedPc15Generation(memory,d),generation);
 assert.deepEqual(memory,before);
}
for(const slots of [0,1,16,128,255]){memory[d+0x9fe4]=slots;assert.throws(()=>loadedPc15Generation(memory,d));}
assert.throws(()=>loadedPc15Generation(memory,-1));
assert.throws(()=>loadedPc15Generation(memory,memory.length-65535));
console.log('Retained PC15 generation uses initialized driver slots only; invalid layouts reject without writes');
