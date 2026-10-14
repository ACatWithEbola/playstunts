import assert from 'node:assert/strict';
import {createNoteIsolation} from './mt32-note-isolation.ts';
const input=[0x99,42,127,36,127,0xf8,0x92,45,127,0x82,45,0,0xb9,123,0,0xf0,0x41,0x99,0x12,0xf7,0x99,42,80].map(byte=>[0x330,byte]);
const expected=[0x99,42,127,36,0,0xf8,0x92,45,0,0x82,45,0,0xb9,123,0,0xf0,0x41,0x99,0x12,0xf7,0x99,42,80].map(byte=>[0x330,byte]);
for(const size of [1,2,3,7,input.length]){
 const mask=createNoteIsolation(9,42),actual=[];
 for(let i=0;i<input.length;i+=size)actual.push(...mask(input.slice(i,i+size)));
 assert.deepEqual(actual,expected);assert.equal(actual.length,input.length);
}
const channels=createNoteIsolation(2);
assert.deepEqual(channels([[0x331,0x99],[0x330,0x92],[0x330,45],[0x330,127],[0x330,47],[0x330,99]]),[[0x331,0x99],[0x330,0x92],[0x330,45],[0x330,127],[0x330,47],[0x330,99]]);
assert.throws(()=>createNoteIsolation(16));assert.throws(()=>createNoteIsolation(2,128));
for(const size of [1,2,5,99]){
 const bytes=[0xf0,0x41,0x10,0xf8,0x92,45,127,47,99,0x99,42,80];
 const mask=createNoteIsolation(9,42),actual:number[]=[];
 for(let i=0;i<bytes.length;i+=size)actual.push(...mask(bytes.slice(i,i+size).map(b=>[0x330,b])).map(r=>r[1]));
 assert.deepEqual(actual,[0xf0,0x41,0x10,0xf8,0x92,45,0,47,0,0x99,42,80]);
}
console.log('Diagnostic isolation preserves byte count/order, running status, realtime/SysEx/controllers/releases and chunk boundaries; only other attack velocities change');
