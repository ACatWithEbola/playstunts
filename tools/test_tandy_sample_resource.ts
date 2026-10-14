import assert from 'node:assert/strict';
import {readTandySampleResource} from '../lib/game/read-tandy-sample-resource.ts';
const backing=new Uint8Array(0x100020),memory=backing.subarray(16,0x100010);
for(const [offset,segment,length] of [[0x100,0x9000,128],[0xffd0,0x7000,65535],[0xfff7,0x7000,0xabcd],[0,0x8000,0]]){
 const address=segment*16+((offset+8)&65535);memory[address]=length&255;memory[address+1]=length>>8;
 assert.deepEqual(readTandySampleResource(memory,offset,segment),{offset,segment,length});
 memory[address]^=1;
 assert.equal(readTandySampleResource(memory,offset,segment).length,length^1,'Descriptor reads must remain live');
}
for(const [offset,segment] of [[0,0],[65535,65535],[-1,1],[1,65536],[1.5,1],[0xfff7,0xf000]])assert.throws(()=>readTandySampleResource(memory,offset,segment));
console.log('Legacy Tandy sample descriptor resolves live far-pointer/length bytes, view offsets, effective-address wrapping and physical word-byte carry without mutation or BIOS timing assumptions');
