import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {loadOptionalNativePackedEgaPvsBank,loadOptionalNativeEgaPvsBank} from '../lib/game/load-ega-pvs-bank.ts';
import {loadOptionalNativePvsBank} from '../lib/game/load-selected-pvs-bank.ts';
const [capture,imagePath,directory,format='packed']=process.argv.slice(2);
assert.ok(['packed','planar','indexed'].includes(format));
const rows:{name:string;pages:number;bytes:number[]}[]=JSON.parse(readFileSync(capture,'utf8'));
assert.equal(rows.length,12);
for(const row of rows){
 let memory:Uint8Array=new Uint8Array(0x100000);memory.set(readFileSync(imagePath));const d=0x32090;
 const put=(at:number,value:number)=>new DataView(memory.buffer).setUint16(d+at,value,true);
 for(const [at,value] of [[0x4b12,0x1000],[0x4b14,0x1000],[0x4b16,0x1100],[0x4b18,0x1100],[0x4788,0x7000],[0x100c,0],[0x100e,0x7000],[0x1010,1],[0x1110,0],[0x110e,0xf000]])put(at,value);
 const source=new Uint8Array(readFileSync(join(directory,row.name)));memory.fill(0xa5,0x70000,0x90000);memory.set(new TextEncoder().encode(row.name.replace(/\.PVS$/i,'')+'\0'),d+0xd000);
 const text=(at:number)=>{let end=at;while(memory[d+end])end++;return Buffer.from(memory.subarray(d+at,d+end)).toString('latin1');};
 const host={memory:()=>memory,writeMemory(next:Uint8Array){memory=next;},async exists(at:number){return text(at).toUpperCase()===row.name.toUpperCase();},async read(at:number){return text(at).toUpperCase()===row.name.toUpperCase()?source:null;}};
 const loaded=format==='packed'?await loadOptionalNativePackedEgaPvsBank(host,d,0xd000,0xeffe):format==='planar'?await loadOptionalNativeEgaPvsBank(host,d,0xd000,0xeffe):await loadOptionalNativePvsBank(host,d,0xd000,0xeffe,false,{extensionTable:0x53ae,scratchNameOffset:0x53cf});
 assert.deepEqual(loaded,{offset:0,segment:0x7000});
 const descriptor=new DataView(memory.buffer).getUint16(d+0x4b14,true);
 assert.equal(new DataView(memory.buffer).getUint16(d+descriptor+12,true),row.pages);
 assert.deepEqual(memory.subarray(0x70000,0x70000+row.bytes.length),Uint8Array.from(row.bytes),row.name);
 assert.deepEqual(new Uint8Array(readFileSync(join(directory,row.name))),source);
}
console.log(JSON.stringify({nativeWholeOpponentBanks:rows.length,format,allocatedBytesMatchBothOriginalEditions:true,sourceFilesUnchanged:true,pass:true}));
