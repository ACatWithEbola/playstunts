import assert from 'node:assert/strict';
import {loadVleResource} from '../lib/game/load-vle-resource.ts';
let cases=0;
for(const size of [1,7,8,9,255,1024])for(const additive of [false,true]){
 const bits:number[]=[],expected=new Uint8Array(size);let previous=0;
 for(let i=0;i<size;i++){const symbol=Number(i%3===1);bits.push(...(symbol?[1,0]:[0]));const value=symbol?0xf0:0x11;previous=additive?(previous+value)&255:value;expected[i]=previous;}
 const stream=new Uint8Array(Math.ceil(bits.length/8));bits.forEach((bit,i)=>{stream[i>>>3]|=bit<<(7-(i&7));});
 const packed=Uint8Array.from([2,size&255,(size>>>8)&255,size>>>16,2|Number(additive)*128,1,1,0x11,0xf0,...stream,...new Uint8Array(16)]);
 const memory=new Uint8Array(0x100000).fill(0xa5),before=memory.slice(),result=loadVleResource(memory,0x80000,packed);
 assert.deepEqual(result.resource,expected);assert.deepEqual(memory,before);cases++;
}
console.log(`PASS: ${cases} native plain/additive VLE decoder fixtures match original execution outcomes`);
