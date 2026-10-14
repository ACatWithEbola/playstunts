import assert from 'node:assert/strict';
import {loadNativeRawResource} from '../lib/game/load-raw-resource.ts';
let cases=0;
for(const required of [false,true])for(const length of [null,0,1,15,16,17,1048576]){
 let memory:Uint8Array=new Uint8Array(0x100000);const d=0x60000,v=new DataView(memory.buffer),put=(at:number,value:number)=>v.setUint16(d+at,value,true);
 memory.set(Buffer.from('TEST.RES\0'),d+0x2000);put(0x4b12,0x1000);put(0x4b14,0x1000);put(0x4b16,0x1100);put(0x4b18,0x1100);put(0x100e,0x3000);put(0x1010,1);put(0x110e,0x5000);
 const bytes=length===null?null:Uint8Array.from({length},(_,i)=>(i*17+3)&255);let reads=0;
 const host={memory:()=>memory,writeMemory(next:Uint8Array){memory=next;},async readFile(at:number,needed:boolean){assert.equal(at,0x2000);assert.equal(needed,required);reads++;return bytes;}};
 if(length===1048576){await assert.rejects(loadNativeRawResource(host,d,0x2000,required),/exceeds paragraph count/);assert.equal(new DataView(memory.buffer).getUint16(d+0x4b14,true),0x1000);}
 else{
  const result=await loadNativeRawResource(host,d,0x2000,required);
  if(length===null||length===0)assert.equal(result,null);
  else{assert.deepEqual(result,{offset:0,segment:0x3000});assert.deepEqual(memory.slice(0x30000,0x30000+length),bytes);assert.equal(new DataView(memory.buffer).getUint16(d+0x101e,true),Math.ceil(length/16));}
 }
 assert.equal(reads,1);assert.equal(Buffer.from(memory.slice(d+0x2000,d+0x2009)).toString(),'TEST.RES\0');cases++;
}
console.log(`PASS: ${cases} raw resource boundaries; missing/empty files, paragraph rounding, unchanged filenames and oversized-file rejection`);
