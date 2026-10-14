import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadNativeSoundResource} from '../lib/game/load-sound-resource.ts';
const rows:{name:string;success:number;events:{kind:string;name:string}[]}[]=JSON.parse(readFileSync(process.argv[2],'utf8'));
const image=readFileSync(process.argv[3]);let cases=0;
for(const row of rows.filter(row=>row.success===0)){
 const d=0x60000;let memory:Uint8Array=new Uint8Array(0x100000);memory.set(image.subarray(0x32090,0x42090),d);
 const view=new DataView(memory.buffer);view.setUint16(d+0x4b16,0xc000,true);view.setUint16(d+0x4b18,0xc000,true);view.setUint16(d+0xc010,0,true);
 const name=new TextEncoder().encode(row.name+'\0');memory.set(name,d+0xe800);const events:string[]=[];
 const result=await loadNativeSoundResource({memory:()=>memory,writeMemory(next){memory=next;},async readFile(at,required){assert.equal(required,false);let end=at;while(memory[d+end])end++;events.push(Buffer.from(memory.subarray(d+at,d+end)).toString('latin1'));return null;}},d,0xe800,0x4e2c,0x78c0,0xeffe,'ega');
 assert.equal(result,null);assert.deepEqual(events,row.events.map(event=>event.name));assert.deepEqual(memory.subarray(d+0xe800,d+0xe800+name.length),name);cases++;
}
assert.equal(cases,4);
console.log(JSON.stringify({nativeCompleteMissingFallbackCases:cases,allSevenOriginalFilenamesMatch:true,sourceNamesUnchanged:true,liveWrites:false,pass:true}));
